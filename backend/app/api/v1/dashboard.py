"""
Bhūmi Prājñā - Dashboard Stats API
Role-scoped KPI aggregations for the dashboard.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.project import Project, Notification

router = APIRouter(tags=["Dashboard"])


@router.get("/dashboard/stats")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return KPI counts scoped to the user's geographic authorization."""

    # Base query filtered by role/scope
    base = select(Project).where(Project.status == "ONGOING")
    if current_user.role == "STATE_OFFICER" and current_user.state:
        base = base.where(Project.state == current_user.state)
    elif current_user.role == "DISTRICT_OFFICER":
        if current_user.state:
            base = base.where(Project.state == current_user.state)
        if current_user.district:
            base = base.where(Project.district == current_user.district)

    projects_result = await db.execute(base)
    projects = projects_result.scalars().all()

    # Aggregate by risk
    counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0, None: 0}
    for p in projects:
        counts[p.risk_category] = counts.get(p.risk_category, 0) + 1

    # High-risk list (CRITICAL + HIGH), sorted by probability desc
    high_risk = sorted(
        [p for p in projects if p.risk_category in ("CRITICAL", "HIGH")],
        key=lambda p: p.delay_probability or 0,
        reverse=True
    )[:10]

    # Recent unread alerts for this user
    alerts_result = await db.execute(
        select(Notification)
        .where(Notification.user_id == current_user.id, Notification.read_at.is_(None))
        .order_by(Notification.created_at.desc())
        .limit(5)
    )
    alerts = alerts_result.scalars().all()

    def project_summary(p):
        return {
            "id": str(p.id),
            "project_name": p.project_name,
            "state": p.state,
            "district": p.district,
            "project_type": p.project_type,
            "current_stage": p.current_stage,
            "risk_category": p.risk_category,
            "delay_probability": p.delay_probability,
            "confidence_score": p.confidence_score,
            "data_freshness_days": p.data_freshness_days,
        }

    def alert_summary(a):
        return {
            "id": str(a.id),
            "type": a.type,
            "severity": a.severity,
            "message": a.message,
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "project_id": str(a.project_id) if a.project_id else None,
        }

    return {
        "total_ongoing": len(projects),
        "critical_count": counts["CRITICAL"],
        "high_count": counts["HIGH"],
        "medium_count": counts["MEDIUM"],
        "low_count": counts["LOW"],
        "no_prediction_count": counts[None],
        "high_risk_projects": [project_summary(p) for p in high_risk],
        "recent_alerts": [alert_summary(a) for a in alerts],
    }
