"""
Bhumi Prajna - Project & State Snapshot Database Models
All 10 parameter groups from data_dictionary.md.
Separate operational and historical tables.
"""

import uuid
from datetime import datetime, timezone, date
from enum import Enum as PyEnum

from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Date,
    Enum, Text, ForeignKey, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.db.session import Base


class ProjectStatus(str, PyEnum):
    ONGOING = "ONGOING"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    ON_HOLD = "ON_HOLD"


class ProjectType(str, PyEnum):
    HIGHWAY = "HIGHWAY"
    RAILWAY = "RAILWAY"
    IRRIGATION = "IRRIGATION"
    INDUSTRIAL = "INDUSTRIAL"
    URBAN_DEVELOPMENT = "URBAN_DEVELOPMENT"
    POWER = "POWER"
    MINING = "MINING"
    DEFENSE = "DEFENSE"
    OTHER = "OTHER"


# ========== Operational Project ==========

class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_name = Column(String(500), nullable=False)
    state = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=False, index=True)
    project_type = Column(Enum(ProjectType, name="project_type_enum"), nullable=False)
    land_area = Column(Float, nullable=False)  # hectares
    affected_families = Column(Integer, nullable=False, default=0)
    status = Column(Enum(ProjectStatus, name="project_status_enum"), nullable=False, default=ProjectStatus.ONGOING)
    current_stage = Column(String(255), nullable=False)
    next_stage = Column(String(255), nullable=True)

    # Location for GIS
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    # Metadata
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))
    created_by = Column(UUID(as_uuid=True), nullable=False)
    snapshot_date = Column(Date, nullable=False)

    # Latest prediction cache (denormalized for dashboard performance)
    risk_category = Column(String(20), nullable=True)
    delay_probability = Column(Float, nullable=True)
    predicted_delay_days = Column(Float, nullable=True)
    confidence_score = Column(Float, nullable=True)
    data_freshness_days = Column(Integer, nullable=True)


# ========== Project State Snapshot ==========
# Each update is a chronological observation — never overwrite historical states.

class ProjectStateSnapshot(Base):
    __tablename__ = "project_state_snapshots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False, index=True)
    snapshot_date = Column(Date, nullable=False)
    current_stage = Column(String(255), nullable=False)
    next_stage = Column(String(255), nullable=True)
    status = Column(String(50), nullable=False, default="ONGOING")

    # === Administrative Approvals ===
    approvals_required = Column(Integer, default=0)
    approvals_completed = Column(Integer, default=0)
    approvals_pending = Column(Integer, default=0)
    approval_progress_pct = Column(Float, default=0.0)
    approval_process_start_date = Column(Date, nullable=True)
    approval_expected_completion_date = Column(Date, nullable=True)
    oldest_pending_approval_days = Column(Integer, nullable=True)

    # === Legal Disputes ===
    legal_cases_total = Column(Integer, default=0)
    legal_cases_pending = Column(Integer, default=0)
    legal_cases_resolved = Column(Integer, default=0)
    disputed_land_area = Column(Float, default=0.0)
    oldest_pending_case_days = Column(Integer, nullable=True)
    legal_process_start_date = Column(Date, nullable=True)

    # === Compensation ===
    compensation_total_amount = Column(Float, default=0.0)
    compensation_paid_amount = Column(Float, default=0.0)
    compensation_pending_amount = Column(Float, default=0.0)
    beneficiaries_eligible = Column(Integer, default=0)
    beneficiaries_compensated = Column(Integer, default=0)
    beneficiaries_pending = Column(Integer, default=0)
    compensation_progress_pct = Column(Float, default=0.0)
    compensation_process_start_date = Column(Date, nullable=True)
    compensation_expected_completion_date = Column(Date, nullable=True)

    # === Documentation ===
    documents_required = Column(Integer, default=0)
    documents_submitted = Column(Integer, default=0)
    documents_verified = Column(Integer, default=0)
    documents_incomplete = Column(Integer, default=0)
    documents_unverified = Column(Integer, default=0)
    documentation_progress_pct = Column(Float, default=0.0)
    documentation_process_start_date = Column(Date, nullable=True)

    # === Notifications (project notifications, not system alerts) ===
    notifications_required = Column(Integer, default=0)
    notifications_issued = Column(Integer, default=0)
    notifications_pending = Column(Integer, default=0)
    notification_progress_pct = Column(Float, default=0.0)
    latest_notification_date = Column(Date, nullable=True)
    notification_process_start_date = Column(Date, nullable=True)
    notification_expected_completion_date = Column(Date, nullable=True)

    # === Ownership Conflicts ===
    parcels_total = Column(Integer, default=0)
    parcels_disputed = Column(Integer, default=0)
    ownership_claims_total = Column(Integer, default=0)
    ownership_conflicts_pending = Column(Integer, default=0)
    ownership_conflicts_resolved = Column(Integer, default=0)
    ownership_disputed_land_area = Column(Float, default=0.0)
    ownership_verification_start_date = Column(Date, nullable=True)

    # === Rehabilitation & Resettlement ===
    rr_families_required = Column(Integer, default=0)
    rr_families_completed = Column(Integer, default=0)
    rr_families_pending = Column(Integer, default=0)
    rr_progress_pct = Column(Float, default=0.0)
    rr_process_start_date = Column(Date, nullable=True)
    rr_expected_completion_date = Column(Date, nullable=True)

    # === Possession ===
    land_required_for_possession = Column(Float, default=0.0)
    land_acquired_for_possession = Column(Float, default=0.0)
    land_remaining_for_possession = Column(Float, default=0.0)
    possession_progress_pct = Column(Float, default=0.0)
    possession_status = Column(String(50), nullable=True)
    possession_expected_date = Column(Date, nullable=True)

    # === Stakeholder Responsiveness ===
    stakeholder_requests_raised = Column(Integer, default=0)
    stakeholder_responses_received = Column(Integer, default=0)
    stakeholder_requests_pending = Column(Integer, default=0)
    average_response_time_days = Column(Float, nullable=True)
    oldest_pending_response_days = Column(Integer, nullable=True)

    # === Inter-Department Coordination ===
    departments_involved = Column(Integer, default=0)
    coordination_requests_raised = Column(Integer, default=0)
    coordination_requests_resolved = Column(Integer, default=0)
    coordination_requests_pending = Column(Integer, default=0)
    average_coordination_response_days = Column(Float, nullable=True)
    longest_pending_coordination_days = Column(Integer, nullable=True)

    # Metadata
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    created_by = Column(UUID(as_uuid=True), nullable=False)
    is_synthetic = Column(Boolean, default=False)

    __table_args__ = (
        UniqueConstraint('project_id', 'snapshot_date', name='uq_project_snapshot_date'),
    )


# ========== Prediction Record ==========

class PredictionRecord(Base):
    __tablename__ = "predictions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False, index=True)
    snapshot_id = Column(UUID(as_uuid=True), ForeignKey("project_state_snapshots.id"), nullable=True)
    model_version = Column(String(100), nullable=False)
    prediction_timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    next_stage = Column(String(255), nullable=True)
    delay_probability = Column(Float, nullable=False)
    predicted_delay_days = Column(Float, nullable=True)
    risk_category = Column(String(20), nullable=False)
    confidence_score = Column(Float, nullable=True)
    data_freshness_days = Column(Integer, nullable=True)
    top_factors = Column(JSONB, nullable=True)
    recommendations = Column(JSONB, nullable=True)


# ========== Notification (in-app alerts) ==========

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True, index=True)
    type = Column(String(100), nullable=False)
    severity = Column(String(20), nullable=False, default="INFO")
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    read_at = Column(DateTime(timezone=True), nullable=True)
    trigger_prediction_id = Column(UUID(as_uuid=True), nullable=True)


# ========== Model Version Metadata ==========

class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    model_version = Column(String(100), unique=True, nullable=False)
    model_type = Column(String(100), nullable=False)
    training_dataset_version = Column(String(100), nullable=True)
    feature_schema_version = Column(String(100), nullable=True)
    training_timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    validation_metrics = Column(JSONB, nullable=True)
    calibration_metrics = Column(JSONB, nullable=True)
    status = Column(String(20), nullable=False, default="candidate")  # candidate/approved/retired
    notes = Column(Text, nullable=True)
    model_path = Column(String(500), nullable=True)


# ========== Historical Project (for training) ==========

class HistoricalProject(Base):
    __tablename__ = "historical_projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_name = Column(String(500), nullable=False)
    state = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=False, index=True)
    project_type = Column(String(50), nullable=False)
    land_area = Column(Float, nullable=False)
    affected_families = Column(Integer, nullable=False, default=0)
    final_status = Column(String(50), nullable=False)  # COMPLETED/CANCELLED
    total_duration_days = Column(Integer, nullable=True)
    is_synthetic = Column(Boolean, default=False)
    seed_version = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


# ========== Historical Project Snapshot (for training) ==========

class HistoricalProjectSnapshot(Base):
    __tablename__ = "historical_project_snapshots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    historical_project_id = Column(UUID(as_uuid=True), ForeignKey("historical_projects.id"), nullable=False, index=True)
    snapshot_date = Column(Date, nullable=False)
    current_stage = Column(String(255), nullable=False)
    next_stage = Column(String(255), nullable=True)

    # All 10 parameter groups (same fields as ProjectStateSnapshot)
    approvals_required = Column(Integer, default=0)
    approvals_completed = Column(Integer, default=0)
    approvals_pending = Column(Integer, default=0)
    approval_progress_pct = Column(Float, default=0.0)
    oldest_pending_approval_days = Column(Integer, nullable=True)

    legal_cases_total = Column(Integer, default=0)
    legal_cases_pending = Column(Integer, default=0)
    legal_cases_resolved = Column(Integer, default=0)
    disputed_land_area = Column(Float, default=0.0)
    oldest_pending_case_days = Column(Integer, nullable=True)

    compensation_total_amount = Column(Float, default=0.0)
    compensation_paid_amount = Column(Float, default=0.0)
    compensation_pending_amount = Column(Float, default=0.0)
    beneficiaries_eligible = Column(Integer, default=0)
    beneficiaries_compensated = Column(Integer, default=0)
    beneficiaries_pending = Column(Integer, default=0)
    compensation_progress_pct = Column(Float, default=0.0)

    documents_required = Column(Integer, default=0)
    documents_submitted = Column(Integer, default=0)
    documents_verified = Column(Integer, default=0)
    documents_incomplete = Column(Integer, default=0)
    documentation_progress_pct = Column(Float, default=0.0)

    notifications_required = Column(Integer, default=0)
    notifications_issued = Column(Integer, default=0)
    notifications_pending = Column(Integer, default=0)
    notification_progress_pct = Column(Float, default=0.0)

    parcels_total = Column(Integer, default=0)
    parcels_disputed = Column(Integer, default=0)
    ownership_conflicts_pending = Column(Integer, default=0)
    ownership_conflicts_resolved = Column(Integer, default=0)

    rr_families_required = Column(Integer, default=0)
    rr_families_completed = Column(Integer, default=0)
    rr_families_pending = Column(Integer, default=0)
    rr_progress_pct = Column(Float, default=0.0)

    land_required_for_possession = Column(Float, default=0.0)
    land_acquired_for_possession = Column(Float, default=0.0)
    possession_progress_pct = Column(Float, default=0.0)

    stakeholder_requests_raised = Column(Integer, default=0)
    stakeholder_responses_received = Column(Integer, default=0)
    stakeholder_requests_pending = Column(Integer, default=0)
    average_response_time_days = Column(Float, nullable=True)

    departments_involved = Column(Integer, default=0)
    coordination_requests_raised = Column(Integer, default=0)
    coordination_requests_resolved = Column(Integer, default=0)
    coordination_requests_pending = Column(Integer, default=0)
    average_coordination_response_days = Column(Float, nullable=True)

    # Temporal features
    days_in_current_stage = Column(Integer, default=0)
    total_project_days = Column(Integer, default=0)

    # Target fields (ONLY for training — never used as input features)
    next_stage_delayed_30d = Column(Integer, nullable=True)  # 0 or 1
    next_stage_delay_days = Column(Integer, nullable=True)
    next_stage_planned_completion_date = Column(Date, nullable=True)
    next_stage_actual_completion_date = Column(Date, nullable=True)

    is_synthetic = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint('historical_project_id', 'snapshot_date', name='uq_hist_project_snapshot_date'),
    )
