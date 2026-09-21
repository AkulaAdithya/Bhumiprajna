"""
Bhumi Prajna - Alert Service (M5)
Generates in-app Notification records when:
  1. Risk escalates (LOW→MEDIUM, MEDIUM→HIGH, HIGH/MEDIUM→CRITICAL)
  2. Risk improves (CRITICAL→HIGH, HIGH→MEDIUM, MEDIUM→LOW)
  3. Project data is stale (snapshot > STALE_THRESHOLD_DAYS old)

Does NOT automatically retrain the model.
"""

from datetime import date, datetime, timezone, timedelta
from typing import Optional
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project, Notification
from app.models.user import User

# ── Risk ordering ─────────────────────────────────────────────────────────────
RISK_RANK = {"LOW": 0, "MEDIUM": 1, "HIGH": 2, "CRITICAL": 3}
STALE_THRESHOLD_DAYS = 30


def _risk_rank(risk: Optional[str]) -> int:
    return RISK_RANK.get(risk or "LOW", 0)


def _direction(old: Optional[str], new: str) -> Optional[str]:
    """Return 'escalated', 'improved', or None (no meaningful change)."""
    if old is None:
        return None
    old_r = _risk_rank(old)
    new_r = _risk_rank(new)
    if new_r > old_r:
        return "escalated"
    if new_r < old_r:
        return "improved"
    return None


def _severity_for_risk(risk: str) -> str:
    return {"CRITICAL": "CRITICAL", "HIGH": "HIGH", "MEDIUM": "MEDIUM", "LOW": "LOW"}.get(risk, "LOW")


async def _get_scoped_users(db: AsyncSession, state: str, district: str):
    """Fetch all active users who have access to this project's geography."""
    q = select(User).where(User.is_active.is_(True))
    result = await db.execute(q)
    all_users = result.scalars().all()

    def has_access(u: User) -> bool:
        if u.role in ("ADMIN", "CENTRAL_OFFICER"):
            return True
        if u.role == "STATE_OFFICER" and u.state == state:
            return True
        if u.role == "DISTRICT_OFFICER" and u.state == state and u.district == district:
            return True
        return False

    return [u for u in all_users if has_access(u)]


async def fire_risk_change_alerts(
    db: AsyncSession,
    project: Project,
    old_risk: Optional[str],
    new_risk: str,
    delay_probability: float,
) -> int:
    """
    Create Notification records for all scoped users when risk changes.
    Returns number of notifications created.
    """
    direction = _direction(old_risk, new_risk)
    if direction is None:
        return 0  # No change, no alert

    users = await _get_scoped_users(db, project.state, project.district)
    if not users:
        return 0

    prob_pct = round(delay_probability * 100, 1)
    notif_type = "RISK_ESCALATION" if direction == "escalated" else "RISK_IMPROVEMENT"
    severity = _severity_for_risk(new_risk)

    if direction == "escalated":
        message = (
            f"⚠️ Risk escalated: {project.project_name} — "
            f"{old_risk} → {new_risk} ({prob_pct}% delay probability). "
            f"Stage: {project.current_stage}."
        )
    else:
        message = (
            f"✅ Risk improved: {project.project_name} — "
            f"{old_risk} → {new_risk} ({prob_pct}% delay probability). "
            f"Stage: {project.current_stage}."
        )

    count = 0
    for user in users:
        db.add(Notification(
            id=uuid.uuid4(),
            user_id=user.id,
            project_id=project.id,
            type=notif_type,
            severity=severity,
            message=message,
        ))
        count += 1

    return count


async def fire_stale_data_alerts(
    db: AsyncSession,
    project: Project,
    snapshot_date: date,
) -> int:
    """
    Create a DATA_STALE notification if the snapshot is older than
    STALE_THRESHOLD_DAYS and no recent stale alert has already been sent.
    Returns number of notifications created.
    """
    today = date.today()
    age_days = (today - snapshot_date).days
    if age_days < STALE_THRESHOLD_DAYS:
        return 0

    # Dedup: check if a stale alert for this project was sent in the last 7 days
    cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    existing_q = await db.execute(
        select(Notification).where(
            Notification.project_id == project.id,
            Notification.type == "DATA_STALE",
            Notification.created_at >= cutoff,
        ).limit(1)
    )
    if existing_q.scalar_one_or_none():
        return 0  # Already alerted recently

    users = await _get_scoped_users(db, project.state, project.district)
    if not users:
        return 0

    message = (
        f"🕐 Stale data: {project.project_name} has not been updated in {age_days} days "
        f"(last snapshot: {snapshot_date.isoformat()}). "
        f"Please enter current acquisition status to maintain prediction accuracy."
    )

    count = 0
    for user in users:
        db.add(Notification(
            id=uuid.uuid4(),
            user_id=user.id,
            project_id=project.id,
            type="DATA_STALE",
            severity="MEDIUM" if age_days < 60 else "HIGH",
            message=message,
        ))
        count += 1

    return count


async def run_stale_check_for_all(db: AsyncSession) -> dict:
    """
    Run stale-data check across all ONGOING projects.
    Called on-demand (e.g., admin trigger or scheduled cron).
    Returns summary of alerts created.
    """
    q = select(Project).where(Project.status == "ONGOING")
    result = await db.execute(q)
    projects = result.scalars().all()

    total_created = 0
    stale_projects = []
    today = date.today()

    for project in projects:
        if project.snapshot_date:
            age = (today - project.snapshot_date).days
            n = await fire_stale_data_alerts(db, project, project.snapshot_date)
            if n > 0:
                total_created += n
                stale_projects.append({
                    "project_id": str(project.id),
                    "project_name": project.project_name,
                    "age_days": age,
                    "notifications_created": n,
                })

    await db.commit()
    return {
        "projects_checked": len(projects),
        "stale_projects": len(stale_projects),
        "notifications_created": total_created,
        "details": stale_projects,
    }
