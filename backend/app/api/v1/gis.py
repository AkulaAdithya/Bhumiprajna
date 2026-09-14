"""
Bhūmi Prājñā - GIS API (M4)
Returns projects with coordinates for Leaflet map display.
Geographic RBAC enforced — officers only see their scope.
"""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.project import Project
from app.models.geography import State, District

router = APIRouter(tags=["GIS"])


def _scope(query, user: User):
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


@router.get("/gis/projects")
async def gis_projects(
    risk_category: Optional[str] = Query(None),
    status: Optional[str] = Query(None, description="ONGOING (default) or COMPLETED or ALL"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return all scoped projects as GeoJSON-style features for Leaflet.
    Projects without lat/lon are geocoded from district centroid.
    """
    base = _scope(select(Project), current_user)

    # Status filter
    filter_status = status or "ONGOING"
    if filter_status != "ALL":
        base = base.where(Project.status == filter_status)

    if risk_category:
        base = base.where(Project.risk_category == risk_category)

    result = await db.execute(base)
    projects = result.scalars().all()

    # Build district → centroid lookup for projects without coords
    district_q = await db.execute(select(District))
    districts = {d.name: (d.latitude, d.longitude) for d in district_q.scalars().all()}
    state_q = await db.execute(select(State))
    states = {s.name: (s.latitude, s.longitude) for s in state_q.scalars().all()}

    features = []
    for p in projects:
        lat = p.latitude
        lon = p.longitude

        # Fallback to district centroid
        if lat is None or lon is None:
            if p.district in districts:
                lat, lon = districts[p.district]
            elif p.state in states:
                lat, lon = states[p.state]

        # Add small jitter to prevent exact overlaps (same district)
        import random, math
        seed = hash(str(p.id)) % 10000
        rng = random.Random(seed)
        lat = (lat or 20.0) + rng.uniform(-0.08, 0.08)
        lon = (lon or 78.0) + rng.uniform(-0.08, 0.08)

        risk = p.risk_category or "NO_PREDICTION"
        prob_pct = round((p.delay_probability or 0) * 100, 1)

        features.append({
            "id": str(p.id),
            "project_name": p.project_name,
            "state": p.state,
            "district": p.district,
            "project_type": str(p.project_type),
            "current_stage": p.current_stage,
            "land_area": p.land_area,
            "affected_families": p.affected_families,
            "risk_category": risk,
            "delay_probability": p.delay_probability,
            "delay_probability_pct": prob_pct,
            "confidence_score": p.confidence_score,
            "data_freshness_days": p.data_freshness_days,
            "snapshot_date": p.snapshot_date.isoformat() if p.snapshot_date else None,
            "status": str(p.status),
            "lat": round(lat, 6),
            "lon": round(lon, 6),
            "has_exact_coords": p.latitude is not None and p.longitude is not None,
        })

    return {
        "count": len(features),
        "features": features,
    }


@router.get("/gis/heatmap")
async def gis_heatmap(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return aggregated risk intensity per district for heatmap overlay.
    """
    base = _scope(
        select(Project).where(Project.status == "ONGOING"),
        current_user
    )
    result = await db.execute(base)
    projects = result.scalars().all()

    district_q = await db.execute(select(District))
    district_coords = {d.name: (d.latitude, d.longitude) for d in district_q.scalars().all()}

    dist_agg: dict = {}
    for p in projects:
        d = p.district
        if d not in dist_agg:
            lat, lon = district_coords.get(d, (None, None))
            dist_agg[d] = {
                "district": d, "state": p.state,
                "lat": lat, "lon": lon,
                "total": 0, "risk_score_sum": 0.0, "probs": [],
            }
        dist_agg[d]["total"] += 1
        risk_map = {"CRITICAL": 1.0, "HIGH": 0.75, "MEDIUM": 0.4, "LOW": 0.1}
        dist_agg[d]["risk_score_sum"] += risk_map.get(p.risk_category or "LOW", 0.1)
        if p.delay_probability is not None:
            dist_agg[d]["probs"].append(p.delay_probability)

    heatmap_points = []
    for v in dist_agg.values():
        if v["lat"] is None:
            continue
        probs = v["probs"]
        intensity = v["risk_score_sum"] / max(v["total"], 1)
        heatmap_points.append({
            "district": v["district"],
            "state": v["state"],
            "lat": v["lat"],
            "lon": v["lon"],
            "total_projects": v["total"],
            "avg_delay_probability": round(sum(probs) / len(probs), 3) if probs else None,
            "risk_intensity": round(intensity, 3),  # 0–1, higher = more risk
        })

    heatmap_points.sort(key=lambda x: x["risk_intensity"], reverse=True)
    return {"heatmap_points": heatmap_points}
