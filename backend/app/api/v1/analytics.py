"""
Pravaah - Analytics API (M4)
Role-scoped analytics: risk distribution, stage breakdown, trend over time,
top risk-driving parameters, state/district comparison.
"""

from datetime import date, datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, case, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.project import Project, ProjectStateSnapshot, PredictionRecord

router = APIRouter(tags=["Analytics"])


def _scope(query, user: User):
    """Apply geographic RBAC to a query on Project."""
    if user.role in ("ADMIN", "CENTRAL_OFFICER"):
        return query
    if user.role == "STATE_OFFICER" and user.state:
        return query.where(Project.state == user.state)
    if user.role == "DISTRICT_OFFICER":
        if user.state:
            query = query.where(Project.state == user.state)
        if user.district:
            query = query.where(Project.district == user.district)
    return query


@router.get("/analytics/overview")
async def analytics_overview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Aggregate risk distribution, stage distribution, type distribution,
    avg probability by state, and data freshness histogram.
    """
    base = _scope(select(Project).where(Project.status == "ONGOING"), current_user)
    result = await db.execute(base)
    projects = result.scalars().all()

    # Risk distribution
    risk_dist: dict[str, int] = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0, "NO_PREDICTION": 0}
    for p in projects:
        key = p.risk_category if p.risk_category else "NO_PREDICTION"
        risk_dist[key] = risk_dist.get(key, 0) + 1

    # Stage distribution
    stage_dist: dict[str, int] = {}
    for p in projects:
        stage_dist[p.current_stage] = stage_dist.get(p.current_stage, 0) + 1

    # Project type distribution
    type_dist: dict[str, int] = {}
    for p in projects:
        t = p.project_type if hasattr(p.project_type, '__str__') else str(p.project_type)
        type_dist[t] = type_dist.get(t, 0) + 1

    # Avg delay probability by stage
    stage_prob: dict[str, list] = {}
    for p in projects:
        if p.delay_probability is not None:
            stage_prob.setdefault(p.current_stage, []).append(p.delay_probability)
    avg_prob_by_stage = {
        stage: round(sum(probs) / len(probs), 3)
        for stage, probs in stage_prob.items()
    }

    # State-level comparison
    state_agg: dict[str, dict] = {}
    for p in projects:
        s = p.state
        if s not in state_agg:
            state_agg[s] = {"total": 0, "critical": 0, "high": 0, "probs": []}
        state_agg[s]["total"] += 1
        if p.risk_category == "CRITICAL":
            state_agg[s]["critical"] += 1
        elif p.risk_category == "HIGH":
            state_agg[s]["high"] += 1
        if p.delay_probability is not None:
            state_agg[s]["probs"].append(p.delay_probability)

    state_comparison = [
        {
            "state": s,
            "total": v["total"],
            "critical": v["critical"],
            "high": v["high"],
            "avg_delay_probability": round(sum(v["probs"]) / len(v["probs"]), 3) if v["probs"] else None,
        }
        for s, v in state_agg.items()
    ]

    # Data freshness buckets
    today = date.today()
    freshness: dict[str, int] = {"<7d": 0, "7–30d": 0, "30–90d": 0, ">90d": 0}
    for p in projects:
        age = (today - p.snapshot_date).days if p.snapshot_date else 999
        if age < 7:
            freshness["<7d"] += 1
        elif age < 30:
            freshness["7–30d"] += 1
        elif age < 90:
            freshness["30–90d"] += 1
        else:
            freshness[">90d"] += 1

    # Top risk metrics (average per-field across all latest snapshots)
    # Pull latest snapshot per project for parameter analysis
    pids = [p.id for p in projects]
    risk_drivers: dict[str, float] = {}
    if pids:
        snap_q = (
            select(ProjectStateSnapshot)
            .where(ProjectStateSnapshot.project_id.in_(pids))
            .order_by(ProjectStateSnapshot.project_id, ProjectStateSnapshot.snapshot_date.desc())
        )
        snap_result = await db.execute(snap_q)
        all_snaps = snap_result.scalars().all()
        # Keep only latest per project
        seen = set()
        latest_snaps = []
        for s in all_snaps:
            if s.project_id not in seen:
                seen.add(s.project_id)
                latest_snaps.append(s)

        driver_fields = [
            ("approvals_pending", "Approvals Pending"),
            ("legal_cases_pending", "Legal Cases Pending"),
            ("beneficiaries_pending", "Beneficiaries Pending"),
            ("documents_incomplete", "Documents Incomplete"),
            ("rr_families_pending", "R&R Families Pending"),
            ("ownership_conflicts_pending", "Ownership Conflicts"),
            ("notifications_pending", "Notifications Pending"),
            ("coordination_requests_pending", "Coordination Pending"),
        ]
        for field, label in driver_fields:
            vals = [getattr(s, field, None) for s in latest_snaps if getattr(s, field, None) is not None]
            if vals:
                risk_drivers[label] = round(sum(vals) / len(vals), 1)

    return {
        "total_ongoing": len(projects),
        "risk_distribution": risk_dist,
        "stage_distribution": stage_dist,
        "type_distribution": type_dist,
        "avg_prob_by_stage": avg_prob_by_stage,
        "state_comparison": state_comparison,
        "data_freshness": freshness,
        "avg_risk_drivers": risk_drivers,
    }


@router.get("/analytics/trends")
async def analytics_trends(
    days: int = Query(90, ge=7, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Prediction trend: avg delay probability and risk count per week
    over the last N days. Uses predictions table to show model output history.
    """
    since = date.today() - timedelta(days=days)

    # Get scoped project IDs
    pid_q = _scope(
        select(Project.id).where(Project.status == "ONGOING"),
        current_user
    )
    pid_result = await db.execute(pid_q)
    project_ids = [r[0] for r in pid_result.all()]

    if not project_ids:
        return {"weekly_trends": [], "days": days}

    from sqlalchemy import cast, Date as SADate
    # Pull predictions since cutoff — filter on prediction_timestamp
    since_dt = datetime.combine(since, datetime.min.time())
    pred_q = (
        select(PredictionRecord)
        .where(
            PredictionRecord.project_id.in_(project_ids),
            PredictionRecord.prediction_timestamp >= since_dt,
        )
        .order_by(PredictionRecord.prediction_timestamp)
    )
    pred_result = await db.execute(pred_q)
    preds = pred_result.scalars().all()

    # Bucket by ISO week using prediction_timestamp
    week_buckets: dict[str, dict] = {}
    for p in preds:
        if p.prediction_timestamp:
            d = p.prediction_timestamp.date() if hasattr(p.prediction_timestamp, 'date') else p.prediction_timestamp
            iso = d.strftime("%Y-W%V")
            week_start = (d - timedelta(days=d.weekday())).isoformat()
            if iso not in week_buckets:
                week_buckets[iso] = {
                    "week": iso,
                    "week_start": week_start,
                    "probs": [],
                    "critical": 0, "high": 0, "medium": 0, "low": 0,
                }
            b = week_buckets[iso]
            if p.delay_probability is not None:
                b["probs"].append(p.delay_probability)
            rc = p.risk_category or "LOW"
            b[rc.lower()] = b.get(rc.lower(), 0) + 1

    weekly = sorted(week_buckets.values(), key=lambda x: x["week"])
    for w in weekly:
        probs = w.pop("probs", [])
        w["avg_delay_probability"] = round(sum(probs) / len(probs), 3) if probs else None
        w["prediction_count"] = w["critical"] + w["high"] + w["medium"] + w["low"]

    return {"weekly_trends": weekly, "days": days}


@router.get("/analytics/district-comparison")
async def district_comparison(
    state: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Compare districts within a state by risk profile."""
    base = _scope(
        select(Project).where(Project.status == "ONGOING"),
        current_user
    )
    if state:
        base = base.where(Project.state == state)

    result = await db.execute(base)
    projects = result.scalars().all()

    district_agg: dict[str, dict] = {}
    for p in projects:
        d = p.district
        if d not in district_agg:
            district_agg[d] = {
                "district": d, "state": p.state,
                "total": 0, "critical": 0, "high": 0, "medium": 0, "low": 0,
                "probs": [],
            }
        district_agg[d]["total"] += 1
        rc = (p.risk_category or "LOW").lower()
        district_agg[d][rc] = district_agg[d].get(rc, 0) + 1
        if p.delay_probability is not None:
            district_agg[d]["probs"].append(p.delay_probability)

    comparison = []
    for v in district_agg.values():
        probs = v.pop("probs", [])
        v["avg_delay_probability"] = round(sum(probs) / len(probs), 3) if probs else None
        comparison.append(v)

    comparison.sort(key=lambda x: x.get("avg_delay_probability") or 0, reverse=True)
    return {"districts": comparison, "state": state}
