"""
Pravaah - Model Governance API (M5)
View model versions, metrics, and deployment history.
Trigger stale-data check.
Admin-controlled approval workflow for future model updates.
Per phases.md: Never automatically retrain after every project update.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_roles
from app.db.session import get_db
from app.models.user import User
from app.models.project import ModelVersion
from app.services.alert_service import run_stale_check_for_all

router = APIRouter(tags=["Model Governance"])


@router.get("/models")
async def list_model_versions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all registered model versions with metrics."""
    result = await db.execute(
        select(ModelVersion).order_by(ModelVersion.training_timestamp.desc())
    )
    versions = result.scalars().all()

    def _serialise(mv: ModelVersion) -> dict:
        metrics = mv.validation_metrics or {}
        clf = metrics.get("classification", {})
        cal = metrics.get("calibration", {})
        return {
            "id": str(mv.id),
            "model_version": mv.model_version,
            "model_type": mv.model_type,
            "status": mv.status,
            "training_timestamp": mv.training_timestamp.isoformat() if mv.training_timestamp else None,
            "training_dataset_version": mv.training_dataset_version,
            "feature_schema_version": mv.feature_schema_version,
            "model_path": mv.model_path,
            "notes": mv.notes,
            "metrics": {
                "pr_auc":      clf.get("pr_auc"),
                "roc_auc":     clf.get("roc_auc"),
                "f1":          clf.get("f1"),
                "precision":   clf.get("precision"),
                "recall":      clf.get("recall"),
                "brier_score": clf.get("brier_score"),
                "brier_after_calibration": cal.get("brier_after"),
                "mae_days":    metrics.get("regression", {}).get("mae"),
            },
            "calibration_metrics": mv.calibration_metrics,
        }

    active = next((mv for mv in versions if mv.status == "approved"), None)
    return {
        "total": len(versions),
        "active_version": active.model_version if active else None,
        "versions": [_serialise(mv) for mv in versions],
    }


@router.get("/models/{model_version}")
async def get_model_version(
    model_version: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get detailed info for a specific model version."""
    result = await db.execute(
        select(ModelVersion).where(ModelVersion.model_version == model_version)
    )
    mv = result.scalar_one_or_none()
    if not mv:
        raise HTTPException(status_code=404, detail=f"Model version '{model_version}' not found")

    metrics = mv.validation_metrics or {}
    return {
        "id": str(mv.id),
        "model_version": mv.model_version,
        "model_type": mv.model_type,
        "status": mv.status,
        "training_timestamp": mv.training_timestamp.isoformat() if mv.training_timestamp else None,
        "training_dataset_version": mv.training_dataset_version,
        "feature_schema_version": mv.feature_schema_version,
        "model_path": mv.model_path,
        "notes": mv.notes,
        "validation_metrics": mv.validation_metrics,
        "calibration_metrics": mv.calibration_metrics,
        "governance_note": (
            "Model updates require explicit admin approval. "
            "The system does NOT automatically retrain on operational data updates."
        ),
    }


@router.post("/models/{model_version}/approve")
async def approve_model_version(
    model_version: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN"])),
):
    """
    Approve a candidate model version for production use.
    Only ADMIN can approve. Previous approved version is archived.
    This is the controlled approval gate — no auto-promotion.
    """
    result = await db.execute(
        select(ModelVersion).where(ModelVersion.model_version == model_version)
    )
    mv = result.scalar_one_or_none()
    if not mv:
        raise HTTPException(status_code=404, detail=f"Model version '{model_version}' not found")

    if mv.status == "approved":
        return {"message": f"Version {model_version} is already active.", "status": "approved"}

    # Archive current active version
    active_result = await db.execute(
        select(ModelVersion).where(ModelVersion.status == "approved")
    )
    active = active_result.scalar_one_or_none()
    if active:
        active.status = "archived"

    # Approve new version
    mv.status = "approved"
    await db.commit()

    return {
        "message": f"Model version {model_version} approved for production.",
        "previous_active": active.model_version if active else None,
        "now_active": model_version,
    }


@router.post("/models/stale-check")
async def trigger_stale_check(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "CENTRAL_OFFICER"])),
):
    """
    Run stale-data check across all ONGOING projects.
    Creates DATA_STALE notifications for projects with snapshots older
    than the threshold (30 days). Deduplicates within 7-day windows.
    """
    summary = await run_stale_check_for_all(db)
    return {
        "triggered_by": current_user.email,
        "triggered_at": datetime.now(timezone.utc).isoformat(),
        **summary,
    }
