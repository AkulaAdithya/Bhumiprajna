"""
Bhumi Prajna - Projects API
Full CRUD + snapshot creation + on-demand prediction.
All endpoints enforce geographic RBAC via dependencies.
"""

import uuid
from datetime import date, datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_roles, enforce_geographic_scope
from app.db.session import get_db
from app.models.user import User
from app.models.project import (
    Project, ProjectStateSnapshot, PredictionRecord
)
from app.models.audit import AuditLog
from app.schemas.project import (
    ProjectCreate, ProjectSnapshotCreate,
    ProjectListResponse, ProjectListItem, ProjectDetailResponse, PredictionResponse
)
from app.ml.prediction_service import prediction_service
from app.services.alert_service import fire_risk_change_alerts

router = APIRouter(tags=["Projects"])


def _is_snapshot_complete(snap_or_params: "dict | ProjectStateSnapshot") -> bool:
    """
    Canonical completion check: returns True when every acquisition milestone
    tracked by Bhumi Prajna has been fully satisfied.

    Works with either a derived-params dict (during add_snapshot) or a
    ProjectStateSnapshot ORM object (during retroactive startup scan).

    Rules (all must hold):
      • Approvals, legal cases, documents (incomplete + unverified),
        notifications, R&R families, stakeholder requests, coordination
        requests, and ownership conflicts must all have 0 pending/incomplete.
      • Compensation: beneficiaries_pending = 0 AND pending_amount ≤ 0.
      • Possession: if land_required > 0 → land_remaining must be ≤ 0.
        If land_required = 0, possession is N/A (not a blocker).
      • At least one numeric "required" field must be non-zero so that
        brand-new placeholder projects don't auto-complete immediately.
    """
    def g(key: str, default=0):
        if isinstance(snap_or_params, dict):
            return snap_or_params.get(key, default)
        return getattr(snap_or_params, key, default)

    # Guard: must have some actual work registered
    any_work = any([
        g("approvals_required") > 0,
        g("legal_cases_total") > 0,
        g("compensation_total_amount") > 0,
        g("documents_required") > 0,
        g("notifications_required") > 0,
        g("rr_families_required") > 0,
        g("land_required_for_possession") > 0,
        g("stakeholder_requests_raised") > 0,
        g("coordination_requests_raised") > 0,
    ])
    if not any_work:
        return False

    # Core milestone checks
    milestones_ok = all([
        g("approvals_pending") <= 0,
        g("legal_cases_pending") <= 0,
        g("beneficiaries_pending") <= 0,
        g("compensation_pending_amount") <= 0.0,
        g("documents_incomplete") <= 0,
        g("documents_unverified") <= 0,
        g("notifications_pending") <= 0,
        g("rr_families_pending") <= 0,
        g("stakeholder_requests_pending") <= 0,
        g("coordination_requests_pending") <= 0,
        g("ownership_conflicts_pending") <= 0,
    ])

    # Possession is only a blocker when land has been designated for acquisition
    land_req = g("land_required_for_possession")
    possession_ok = (land_req <= 0) or (g("land_remaining_for_possession") <= 0.0)

    return milestones_ok and possession_ok



def _derive_snapshot_fields(data: dict) -> dict:
    """
    Compute derived fields (pending counts, progress %) from submitted parameters.
    Backend is authoritative — never trust client-computed derived fields.
    """
    req = data.get("approvals_required", 0)
    done = data.get("approvals_completed", 0)
    data["approvals_pending"] = max(0, req - done)
    data["approval_progress_pct"] = round(done / max(req, 1) * 100, 1)

    total_legal = data.get("legal_cases_total", 0)
    resolved = data.get("legal_cases_resolved", 0)
    data["legal_cases_pending"] = max(0, total_legal - resolved)

    comp_total = data.get("compensation_total_amount", 0)
    comp_paid = data.get("compensation_paid_amount", 0)
    data["compensation_pending_amount"] = max(0.0, comp_total - comp_paid)
    data["compensation_progress_pct"] = round(comp_paid / max(comp_total, 0.01) * 100, 1)
    ben_eligible = data.get("beneficiaries_eligible", 0)
    ben_comp = data.get("beneficiaries_compensated", 0)
    data["beneficiaries_pending"] = max(0, ben_eligible - ben_comp)

    docs_req = data.get("documents_required", 0)
    docs_sub = data.get("documents_submitted", 0)
    docs_ver = data.get("documents_verified", 0)
    data["documents_incomplete"] = max(0, docs_req - docs_sub)
    data["documents_unverified"] = max(0, docs_sub - docs_ver)
    data["documentation_progress_pct"] = round(docs_ver / max(docs_req, 1) * 100, 1)

    notif_req = data.get("notifications_required", 0)
    notif_issued = data.get("notifications_issued", 0)
    data["notifications_pending"] = max(0, notif_req - notif_issued)
    data["notification_progress_pct"] = round(notif_issued / max(notif_req, 1) * 100, 1)

    rr_req = data.get("rr_families_required", 0)
    rr_done = data.get("rr_families_completed", 0)
    data["rr_families_pending"] = max(0, rr_req - rr_done)
    data["rr_progress_pct"] = round(rr_done / max(rr_req, 1) * 100, 1)

    land_req = data.get("land_required_for_possession", 0)
    land_acq = data.get("land_acquired_for_possession", 0)
    data["land_remaining_for_possession"] = max(0.0, land_req - land_acq)
    data["possession_progress_pct"] = round(land_acq / max(land_req, 0.01) * 100, 1)

    sth_raised = data.get("stakeholder_requests_raised", 0)
    sth_recv = data.get("stakeholder_responses_received", 0)
    data["stakeholder_requests_pending"] = max(0, sth_raised - sth_recv)

    coord_raised = data.get("coordination_requests_raised", 0)
    coord_res = data.get("coordination_requests_resolved", 0)
    data["coordination_requests_pending"] = max(0, coord_raised - coord_res)

    return data


def _build_snapshot(
    project_id: uuid.UUID,
    snap_date: date,
    current_stage: str,
    next_stage: Optional[str],
    snap_status: str,
    created_by: uuid.UUID,
    p: dict,
) -> ProjectStateSnapshot:
    """Explicitly construct a ProjectStateSnapshot from the derived params dict."""
    return ProjectStateSnapshot(
        id=uuid.uuid4(),
        project_id=project_id,
        snapshot_date=snap_date,
        current_stage=current_stage,
        next_stage=next_stage,
        status=snap_status,
        created_by=created_by,
        is_synthetic=False,
        approvals_required=p.get("approvals_required", 0),
        approvals_completed=p.get("approvals_completed", 0),
        approvals_pending=p.get("approvals_pending", 0),
        approval_progress_pct=p.get("approval_progress_pct", 0.0),
        approval_process_start_date=p.get("approval_process_start_date"),
        approval_expected_completion_date=p.get("approval_expected_completion_date"),
        oldest_pending_approval_days=p.get("oldest_pending_approval_days"),
        legal_cases_total=p.get("legal_cases_total", 0),
        legal_cases_pending=p.get("legal_cases_pending", 0),
        legal_cases_resolved=p.get("legal_cases_resolved", 0),
        disputed_land_area=p.get("disputed_land_area", 0.0),
        oldest_pending_case_days=p.get("oldest_pending_case_days"),
        legal_process_start_date=p.get("legal_process_start_date"),
        compensation_total_amount=p.get("compensation_total_amount", 0.0),
        compensation_paid_amount=p.get("compensation_paid_amount", 0.0),
        compensation_pending_amount=p.get("compensation_pending_amount", 0.0),
        beneficiaries_eligible=p.get("beneficiaries_eligible", 0),
        beneficiaries_compensated=p.get("beneficiaries_compensated", 0),
        beneficiaries_pending=p.get("beneficiaries_pending", 0),
        compensation_progress_pct=p.get("compensation_progress_pct", 0.0),
        compensation_process_start_date=p.get("compensation_process_start_date"),
        compensation_expected_completion_date=p.get("compensation_expected_completion_date"),
        documents_required=p.get("documents_required", 0),
        documents_submitted=p.get("documents_submitted", 0),
        documents_verified=p.get("documents_verified", 0),
        documents_incomplete=p.get("documents_incomplete", 0),
        documents_unverified=p.get("documents_unverified", 0),
        documentation_progress_pct=p.get("documentation_progress_pct", 0.0),
        documentation_process_start_date=p.get("documentation_process_start_date"),
        notifications_required=p.get("notifications_required", 0),
        notifications_issued=p.get("notifications_issued", 0),
        notifications_pending=p.get("notifications_pending", 0),
        notification_progress_pct=p.get("notification_progress_pct", 0.0),
        latest_notification_date=p.get("latest_notification_date"),
        notification_process_start_date=p.get("notification_process_start_date"),
        notification_expected_completion_date=p.get("notification_expected_completion_date"),
        parcels_total=p.get("parcels_total", 0),
        parcels_disputed=p.get("parcels_disputed", 0),
        ownership_claims_total=p.get("ownership_claims_total", 0),
        ownership_conflicts_pending=p.get("ownership_conflicts_pending", 0),
        ownership_conflicts_resolved=p.get("ownership_conflicts_resolved", 0),
        ownership_disputed_land_area=p.get("ownership_disputed_land_area", 0.0),
        ownership_verification_start_date=p.get("ownership_verification_start_date"),
        rr_families_required=p.get("rr_families_required", 0),
        rr_families_completed=p.get("rr_families_completed", 0),
        rr_families_pending=p.get("rr_families_pending", 0),
        rr_progress_pct=p.get("rr_progress_pct", 0.0),
        rr_process_start_date=p.get("rr_process_start_date"),
        rr_expected_completion_date=p.get("rr_expected_completion_date"),
        land_required_for_possession=p.get("land_required_for_possession", 0.0),
        land_acquired_for_possession=p.get("land_acquired_for_possession", 0.0),
        land_remaining_for_possession=p.get("land_remaining_for_possession", 0.0),
        possession_progress_pct=p.get("possession_progress_pct", 0.0),
        possession_status=p.get("possession_status"),
        possession_expected_date=p.get("possession_expected_date"),
        stakeholder_requests_raised=p.get("stakeholder_requests_raised", 0),
        stakeholder_responses_received=p.get("stakeholder_responses_received", 0),
        stakeholder_requests_pending=p.get("stakeholder_requests_pending", 0),
        average_response_time_days=p.get("average_response_time_days"),
        oldest_pending_response_days=p.get("oldest_pending_response_days"),
        departments_involved=p.get("departments_involved", 1),
        coordination_requests_raised=p.get("coordination_requests_raised", 0),
        coordination_requests_resolved=p.get("coordination_requests_resolved", 0),
        coordination_requests_pending=p.get("coordination_requests_pending", 0),
        average_coordination_response_days=p.get("average_coordination_response_days"),
        longest_pending_coordination_days=p.get("longest_pending_coordination_days"),
    )


@router.get("/projects", response_model=ProjectListResponse)
async def list_projects(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    risk_category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    stage: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List projects with filtering. Geographic scope enforced server-side."""
    # Filter out CANCELLED and, by default, COMPLETED (unless explicitly requested)
    if status:
        query = select(Project).where(Project.status == status)
    else:
        query = select(Project).where(Project.status.in_(["ONGOING", "ON_HOLD"]))

    # Geographic RBAC
    if current_user.role == "STATE_OFFICER" and current_user.state:
        query = query.where(Project.state == current_user.state)
    elif current_user.role == "DISTRICT_OFFICER":
        if current_user.state:
            query = query.where(Project.state == current_user.state)
        if current_user.district:
            query = query.where(Project.district == current_user.district)

    # Filters
    if state:
        query = query.where(Project.state == state)
    if district:
        query = query.where(Project.district == district)
    if risk_category:
        query = query.where(Project.risk_category == risk_category)
    if stage:
        query = query.where(Project.current_stage == stage)
    if search:
        query = query.where(Project.project_name.ilike(f"%{search}%"))

    # Count
    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar()

    # Paginate, sort by risk (CRITICAL first)
    risk_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3, None: 4}
    query = query.order_by(Project.updated_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    projects = result.scalars().all()

    return ProjectListResponse(
        projects=[ProjectListItem.model_validate(p) for p in projects],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("/projects", status_code=status.HTTP_201_CREATED)
async def create_project(
    data: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "CENTRAL_OFFICER", "STATE_OFFICER", "DISTRICT_OFFICER"])),
):
    """Create a new project with its initial snapshot, then run prediction."""
    # Enforce geographic scope
    enforce_geographic_scope(current_user, data.state, data.district)

    project_id = uuid.uuid4()

    # Build flat parameter dict from all groups
    params = {}
    for group in [data.approvals, data.legal, data.compensation, data.documentation,
                  data.notifications, data.ownership, data.rr, data.possession,
                  data.stakeholder, data.coordination]:
        params.update(group.model_dump())

    # Derive backend-computed fields
    params = _derive_snapshot_fields(params)

    # ── Auto-completion using shared canonical check ──
    all_milestones_complete = _is_snapshot_complete(params)
    effective_status = "COMPLETED" if all_milestones_complete else "ONGOING"

    # Create Project
    project = Project(
        id=project_id,
        project_name=data.project_name,
        state=data.state,
        district=data.district,
        project_type=data.project_type,
        land_area=data.land_area,
        affected_families=data.affected_families,
        current_stage=data.current_stage,
        next_stage=data.next_stage,
        snapshot_date=data.snapshot_date,
        latitude=data.latitude,
        longitude=data.longitude,
        status=effective_status,
        created_by=current_user.id,
        updated_at=datetime.now(timezone.utc),
    )
    db.add(project)

    # Create initial snapshot using explicit builder (avoids unknown kwargs)
    snapshot = _build_snapshot(
        project_id=project_id,
        snap_date=data.snapshot_date,
        current_stage=data.current_stage,
        next_stage=data.next_stage,
        snap_status=effective_status,
        created_by=current_user.id,
        p=params,
    )
    db.add(snapshot)
    await db.flush()

    # Run prediction
    prediction_result = _run_prediction(data, params, snapshot.id, project_id, data.snapshot_date)
    db.add(prediction_result["record"])

    # Update project cache
    project.risk_category = prediction_result["risk_category"]
    project.delay_probability = prediction_result["delay_probability"]
    project.predicted_delay_days = prediction_result["predicted_delay_days"]
    project.confidence_score = prediction_result["confidence_score"]
    project.data_freshness_days = 0

    # Audit log
    db.add(AuditLog(
        actor_user_id=current_user.id,
        actor_email=current_user.email,
        project_id=project_id,
        action="PROJECT_CREATED",
        details=f"Project '{data.project_name}' created in {data.district}, {data.state}",
        after_values={"risk_category": prediction_result["risk_category"],
                      "delay_probability": prediction_result["delay_probability"]},
    ))

    # Fire risk alerts (new project — no prior risk, treated as escalation if HIGH/CRITICAL)
    await fire_risk_change_alerts(
        db, project,
        old_risk=None,
        new_risk=prediction_result["risk_category"],
        delay_probability=prediction_result["delay_probability"],
    )

    await db.commit()

    return {
        "id": str(project_id),
        "project_name": data.project_name,
        "risk_category": prediction_result["risk_category"],
        "delay_probability": prediction_result["delay_probability"],
        "message": "Project created and prediction generated",
    }


@router.get("/projects/{project_id}", response_model=ProjectDetailResponse)
async def get_project(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get project detail with latest prediction and snapshot history."""
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Geographic RBAC check
    enforce_geographic_scope(current_user, project.state, project.district)

    # Fetch latest snapshot
    snap_result = await db.execute(
        select(ProjectStateSnapshot)
        .where(ProjectStateSnapshot.project_id == project_id)
        .order_by(ProjectStateSnapshot.snapshot_date.desc())
        .limit(1)
    )
    latest_snap = snap_result.scalar_one_or_none()

    # Fetch latest prediction
    pred_result = await db.execute(
        select(PredictionRecord)
        .where(PredictionRecord.project_id == project_id)
        .order_by(PredictionRecord.prediction_timestamp.desc())
        .limit(1)
    )
    latest_pred = pred_result.scalar_one_or_none()

    # Snapshot history (last 10)
    hist_result = await db.execute(
        select(ProjectStateSnapshot)
        .where(ProjectStateSnapshot.project_id == project_id)
        .order_by(ProjectStateSnapshot.snapshot_date.desc())
        .limit(10)
    )
    history = hist_result.scalars().all()

    return ProjectDetailResponse(
        id=project.id,
        project_name=project.project_name,
        state=project.state,
        district=project.district,
        project_type=project.project_type,
        land_area=project.land_area,
        affected_families=project.affected_families,
        status=project.status,
        current_stage=project.current_stage,
        next_stage=project.next_stage,
        latitude=project.latitude,
        longitude=project.longitude,
        snapshot_date=project.snapshot_date,
        created_at=project.created_at,
        updated_at=project.updated_at,
        risk_category=project.risk_category,
        delay_probability=project.delay_probability,
        predicted_delay_days=project.predicted_delay_days,
        confidence_score=project.confidence_score,
        data_freshness_days=project.data_freshness_days,
        latest_snapshot=_snap_to_dict(latest_snap),
        latest_prediction=_pred_to_dict(latest_pred),
        snapshot_history=[_snap_summary(s) for s in history],
    )


@router.delete("/projects/{project_id}", status_code=status.HTTP_200_OK)
async def remove_project(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN"])),
):
    """
    Admin-only: soft-delete a project by setting status=CANCELLED.
    All snapshots, predictions, and audit records are preserved.
    """
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if str(project.status).upper() == "CANCELLED":
        raise HTTPException(status_code=400, detail="Project is already cancelled")

    prev_status = str(project.status)
    project.status = "CANCELLED"
    project.updated_at = datetime.now(timezone.utc)

    db.add(AuditLog(
        actor_user_id=current_user.id,
        actor_email=current_user.email,
        project_id=project_id,
        action="PROJECT_REMOVED",
        details=f"Admin '{current_user.email}' removed project '{project.project_name}' ({project.district}, {project.state}). Status changed from {prev_status} to CANCELLED.",
        before_values={"status": prev_status},
        after_values={"status": "CANCELLED"},
    ))

    await db.commit()

    return {"message": f"Project '{project.project_name}' has been removed (status set to CANCELLED). All historical data is preserved."}


@router.post("/projects/{project_id}/snapshots", status_code=status.HTTP_201_CREATED)
async def add_snapshot(
    project_id: uuid.UUID,
    data: ProjectSnapshotCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a new state observation snapshot, then re-run prediction."""
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    enforce_geographic_scope(current_user, project.state, project.district)

    # Check for duplicate snapshot date
    existing = (await db.execute(
        select(ProjectStateSnapshot)
        .where(ProjectStateSnapshot.project_id == project_id,
               ProjectStateSnapshot.snapshot_date == data.snapshot_date)
    )).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409,
                            detail=f"Snapshot for {data.snapshot_date} already exists")

    # Build and derive params
    params = {}
    for group in [data.approvals, data.legal, data.compensation, data.documentation,
                  data.notifications, data.ownership, data.rr, data.possession,
                  data.stakeholder, data.coordination]:
        params.update(group.model_dump())
    params = _derive_snapshot_fields(params)

    # Capture before state for audit
    before = {
        "risk_category": project.risk_category,
        "delay_probability": project.delay_probability,
        "current_stage": project.current_stage,
    }

    # ── Auto-completion using shared canonical check ──
    prev_status = str(project.status)
    all_milestones_complete = _is_snapshot_complete(params)
    effective_status = "COMPLETED" if all_milestones_complete else data.status

    snapshot = _build_snapshot(
        project_id=project_id,
        snap_date=data.snapshot_date,
        current_stage=data.current_stage,
        next_stage=data.next_stage,
        snap_status=effective_status,
        created_by=current_user.id,
        p=params,
    )
    db.add(snapshot)

    # Update project header
    project.current_stage = data.current_stage
    project.next_stage = data.next_stage
    project.snapshot_date = data.snapshot_date
    project.status = effective_status
    project.updated_at = datetime.now(timezone.utc)

    await db.flush()

    # Run prediction on updated state
    project_data_for_pred = {
        "project_type": project.project_type,
        "land_area": project.land_area,
        "affected_families": project.affected_families,
        "current_stage": data.current_stage,
        **params,
    }
    pred_result = _run_prediction_from_dict(
        project_data_for_pred, params, snapshot.id, project_id, data.snapshot_date
    )
    db.add(pred_result["record"])

    project.risk_category = pred_result["risk_category"]
    project.delay_probability = pred_result["delay_probability"]
    project.predicted_delay_days = pred_result["predicted_delay_days"]
    project.confidence_score = pred_result["confidence_score"]
    project.data_freshness_days = 0

    # Audit
    after = {
        "risk_category": pred_result["risk_category"],
        "delay_probability": pred_result["delay_probability"],
        "current_stage": data.current_stage,
    }
    db.add(AuditLog(
        actor_user_id=current_user.id,
        actor_email=current_user.email,
        project_id=project_id,
        action="SNAPSHOT_ADDED",
        before_values=before,
        after_values=after,
        details=f"New snapshot for {data.snapshot_date}",
    ))

    # If auto-completed, write a second audit entry for traceability
    if all_milestones_complete and prev_status != "COMPLETED":
        db.add(AuditLog(
            actor_user_id=current_user.id,
            actor_email=current_user.email,
            project_id=project_id,
            action="PROJECT_COMPLETED",
            details=f"Project '{project.project_name}' automatically marked COMPLETED — all acquisition milestones fulfilled.",
            before_values={"status": prev_status},
            after_values={"status": "COMPLETED"},
        ))

    # Fire risk-change alert if risk level changed
    await fire_risk_change_alerts(
        db, project,
        old_risk=before.get("risk_category"),
        new_risk=pred_result["risk_category"],
        delay_probability=pred_result["delay_probability"],
    )

    await db.commit()

    return {
        "snapshot_id": str(snapshot.id),
        "risk_category": pred_result["risk_category"],
        "delay_probability": pred_result["delay_probability"],
        "status": effective_status,
        "message": "Snapshot saved and prediction updated" + (" — project automatically marked COMPLETED" if all_milestones_complete and prev_status != "COMPLETED" else ""),
    }


@router.post("/projects/{project_id}/predict")
async def trigger_prediction(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Re-run prediction on current state without adding a new snapshot."""
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    enforce_geographic_scope(current_user, project.state, project.district)

    snap_result = await db.execute(
        select(ProjectStateSnapshot)
        .where(ProjectStateSnapshot.project_id == project_id)
        .order_by(ProjectStateSnapshot.snapshot_date.desc())
        .limit(1)
    )
    latest_snap = snap_result.scalar_one_or_none()
    if not latest_snap:
        raise HTTPException(status_code=400, detail="No snapshot found to predict from")

    features = _snapshot_to_features(latest_snap, project)
    result = prediction_service.predict(features, latest_snap.snapshot_date)

    pred_record = PredictionRecord(
        id=uuid.uuid4(),
        project_id=project_id,
        snapshot_id=latest_snap.id,
        model_version=result["model_version"],
        next_stage=project.next_stage,
        delay_probability=result["delay_probability"],
        predicted_delay_days=result["predicted_delay_days"],
        risk_category=result["risk_category"],
        confidence_score=result["confidence_score"],
        data_freshness_days=result["data_freshness_days"],
        top_factors=result["top_factors"],
        recommendations=result["recommendations"],
    )
    db.add(pred_record)

    old_risk = project.risk_category
    project.risk_category = result["risk_category"]
    project.delay_probability = result["delay_probability"]
    project.confidence_score = result["confidence_score"]
    project.data_freshness_days = result["data_freshness_days"]

    # Fire risk-change alert if risk level changed
    await fire_risk_change_alerts(
        db, project,
        old_risk=old_risk,
        new_risk=result["risk_category"],
        delay_probability=result["delay_probability"],
    )

    await db.commit()

    return {
        "prediction_id": str(pred_record.id),
        **result,
    }


# ========== Helpers ==========

def _run_prediction(data: ProjectCreate, params: dict, snapshot_id, project_id, snap_date: date):
    features = {
        "project_type": data.project_type,
        "land_area": data.land_area,
        "affected_families": data.affected_families,
        "current_stage": data.current_stage,
        **params,
    }
    return _run_prediction_from_dict(features, params, snapshot_id, project_id, snap_date)


def _run_prediction_from_dict(features: dict, params: dict, snapshot_id, project_id, snap_date: date):
    result = prediction_service.predict(features, snap_date)
    record = PredictionRecord(
        id=uuid.uuid4(),
        project_id=project_id,
        snapshot_id=snapshot_id,
        model_version=result["model_version"],
        delay_probability=result["delay_probability"],
        predicted_delay_days=result["predicted_delay_days"],
        risk_category=result["risk_category"],
        confidence_score=result["confidence_score"],
        data_freshness_days=result["data_freshness_days"],
        top_factors=result["top_factors"],
        recommendations=result["recommendations"],
    )
    return {**result, "record": record}


def _snapshot_to_features(snap: ProjectStateSnapshot, project: Project) -> dict:
    # Compute temporal features from available dates.
    # days_in_current_stage: how long the project has been in this stage,
    #   estimated as (snapshot_date - project.created_at.date()).
    #   If the snapshot is the initial one, this equals total_project_days.
    # total_project_days: total calendar days since project creation to snapshot.
    today = date.today()
    project_start = project.created_at.date() if project.created_at else today
    snap_date = snap.snapshot_date if snap.snapshot_date else today
    total_project_days = max(0, (snap_date - project_start).days)
    # days_in_current_stage: use snapshot date relative to project start as a lower bound;
    # the model was trained with this field reflecting real stage durations,
    # so using total_project_days is a reasonable proxy for now.
    days_in_current_stage = total_project_days

    return {
        "project_type": project.project_type,
        "land_area": project.land_area,
        "affected_families": project.affected_families,
        "current_stage": snap.current_stage,
        "approvals_required": snap.approvals_required,
        "approvals_completed": snap.approvals_completed,
        "approvals_pending": snap.approvals_pending,
        "approval_progress_pct": snap.approval_progress_pct,
        "oldest_pending_approval_days": snap.oldest_pending_approval_days,
        "legal_cases_total": snap.legal_cases_total,
        "legal_cases_pending": snap.legal_cases_pending,
        "legal_cases_resolved": snap.legal_cases_resolved,
        "disputed_land_area": snap.disputed_land_area,
        "oldest_pending_case_days": snap.oldest_pending_case_days,
        "compensation_total_amount": snap.compensation_total_amount,
        "compensation_paid_amount": snap.compensation_paid_amount,
        "compensation_pending_amount": snap.compensation_pending_amount,
        "beneficiaries_eligible": snap.beneficiaries_eligible,
        "beneficiaries_compensated": snap.beneficiaries_compensated,
        "beneficiaries_pending": snap.beneficiaries_pending,
        "compensation_progress_pct": snap.compensation_progress_pct,
        "documents_required": snap.documents_required,
        "documents_submitted": snap.documents_submitted,
        "documents_verified": snap.documents_verified,
        "documents_incomplete": snap.documents_incomplete,
        "documentation_progress_pct": snap.documentation_progress_pct,
        "notifications_required": snap.notifications_required,
        "notifications_issued": snap.notifications_issued,
        "notifications_pending": snap.notifications_pending,
        "notification_progress_pct": snap.notification_progress_pct,
        "parcels_total": snap.parcels_total,
        "parcels_disputed": snap.parcels_disputed,
        "ownership_conflicts_pending": snap.ownership_conflicts_pending,
        "ownership_conflicts_resolved": snap.ownership_conflicts_resolved,
        "rr_families_required": snap.rr_families_required,
        "rr_families_completed": snap.rr_families_completed,
        "rr_families_pending": snap.rr_families_pending,
        "rr_progress_pct": snap.rr_progress_pct,
        "land_required_for_possession": snap.land_required_for_possession,
        "land_acquired_for_possession": snap.land_acquired_for_possession,
        "possession_progress_pct": snap.possession_progress_pct,
        "stakeholder_requests_raised": snap.stakeholder_requests_raised,
        "stakeholder_responses_received": snap.stakeholder_responses_received,
        "stakeholder_requests_pending": snap.stakeholder_requests_pending,
        "average_response_time_days": snap.average_response_time_days,
        "departments_involved": snap.departments_involved,
        "coordination_requests_raised": snap.coordination_requests_raised,
        "coordination_requests_resolved": snap.coordination_requests_resolved,
        "coordination_requests_pending": snap.coordination_requests_pending,
        "average_coordination_response_days": snap.average_coordination_response_days,
        "days_in_current_stage": days_in_current_stage,
        "total_project_days": total_project_days,
    }


def _snap_to_dict(snap) -> Optional[dict]:
    if not snap:
        return None
    return {
        "id": str(snap.id),
        "snapshot_date": str(snap.snapshot_date),
        "current_stage": snap.current_stage,
        "approvals_required": snap.approvals_required,
        "approvals_completed": snap.approvals_completed,
        "approvals_pending": snap.approvals_pending,
        "approval_progress_pct": snap.approval_progress_pct,
        "legal_cases_total": snap.legal_cases_total,
        "legal_cases_pending": snap.legal_cases_pending,
        "compensation_total_amount": snap.compensation_total_amount,
        "compensation_paid_amount": snap.compensation_paid_amount,
        "compensation_progress_pct": snap.compensation_progress_pct,
        "beneficiaries_eligible": snap.beneficiaries_eligible,
        "beneficiaries_compensated": snap.beneficiaries_compensated,
        "documents_required": snap.documents_required,
        "documents_verified": snap.documents_verified,
        "documentation_progress_pct": snap.documentation_progress_pct,
        "notifications_required": snap.notifications_required,
        "notifications_issued": snap.notifications_issued,
        "notification_progress_pct": snap.notification_progress_pct,
        "parcels_total": snap.parcels_total,
        "parcels_disputed": snap.parcels_disputed,
        "rr_families_required": snap.rr_families_required,
        "rr_families_completed": snap.rr_families_completed,
        "rr_progress_pct": snap.rr_progress_pct,
        "land_required_for_possession": snap.land_required_for_possession,
        "land_acquired_for_possession": snap.land_acquired_for_possession,
        "possession_progress_pct": snap.possession_progress_pct,
        "stakeholder_requests_raised": snap.stakeholder_requests_raised,
        "stakeholder_responses_received": snap.stakeholder_responses_received,
        "departments_involved": snap.departments_involved,
        "coordination_requests_raised": snap.coordination_requests_raised,
        "coordination_requests_resolved": snap.coordination_requests_resolved,
    }


def _pred_to_dict(pred) -> Optional[dict]:
    if not pred:
        return None
    return {
        "prediction_id": str(pred.id),
        "model_version": pred.model_version,
        "prediction_timestamp": pred.prediction_timestamp.isoformat(),
        "delay_probability": pred.delay_probability,
        "predicted_delay_days": pred.predicted_delay_days,
        "risk_category": pred.risk_category,
        "confidence_score": pred.confidence_score,
        "data_freshness_days": pred.data_freshness_days,
        "top_factors": pred.top_factors or [],
        "recommendations": pred.recommendations or [],
    }


def _snap_summary(snap) -> dict:
    return {
        "id": str(snap.id),
        "snapshot_date": str(snap.snapshot_date),
        "current_stage": snap.current_stage,
        "created_at": snap.created_at.isoformat() if snap.created_at else None,
    }
