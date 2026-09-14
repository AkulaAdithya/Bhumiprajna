"""
Bhūmi Prājñā - Geographic Data API
Provides states and districts for dropdowns and GIS.
"""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.geography import State, District
from app.models.stage import StageDefinition

router = APIRouter(tags=["Geography & Stages"])


@router.get("/geo/states")
async def list_states(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all states."""
    result = await db.execute(select(State).order_by(State.name))
    states = result.scalars().all()
    return [
        {
            "name": s.name,
            "code": s.code,
            "latitude": s.latitude,
            "longitude": s.longitude,
        }
        for s in states
    ]


@router.get("/geo/districts")
async def list_districts(
    state: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List districts, optionally filtered by state."""
    query = select(District).order_by(District.state_name, District.name)
    if state:
        query = query.where(District.state_name == state)
    result = await db.execute(query)
    districts = result.scalars().all()
    return [
        {
            "name": d.name,
            "state_name": d.state_name,
            "state_code": d.state_code,
            "latitude": d.latitude,
            "longitude": d.longitude,
        }
        for d in districts
    ]


@router.get("/stages")
async def list_stages(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all active stage definitions."""
    result = await db.execute(
        select(StageDefinition)
        .where(StageDefinition.is_active == True)
        .order_by(StageDefinition.stage_order)
    )
    stages = result.scalars().all()
    return [
        {
            "id": str(s.id),
            "name": s.name,
            "stage_order": s.stage_order,
            "description": s.description,
        }
        for s in stages
    ]
