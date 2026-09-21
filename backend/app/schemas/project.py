"""
Bhumi Prajna - Project Schemas
Pydantic schemas for project CRUD, snapshot creation, and API responses.
"""

from datetime import date, datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, field_validator


# ========== Stage Parameters (10 groups) ==========

class ApprovalParams(BaseModel):
    approvals_required: int = Field(ge=0)
    approvals_completed: int = Field(ge=0)
    approval_process_start_date: Optional[date] = None
    approval_expected_completion_date: Optional[date] = None
    oldest_pending_approval_days: Optional[int] = None

class LegalParams(BaseModel):
    legal_cases_total: int = Field(ge=0, default=0)
    legal_cases_pending: int = Field(ge=0, default=0)
    legal_cases_resolved: int = Field(ge=0, default=0)
    disputed_land_area: float = Field(ge=0, default=0.0)
    oldest_pending_case_days: Optional[int] = None
    legal_process_start_date: Optional[date] = None

class CompensationParams(BaseModel):
    compensation_total_amount: float = Field(ge=0)
    compensation_paid_amount: float = Field(ge=0, default=0.0)
    beneficiaries_eligible: int = Field(ge=0)
    beneficiaries_compensated: int = Field(ge=0, default=0)
    compensation_process_start_date: Optional[date] = None
    compensation_expected_completion_date: Optional[date] = None

class DocumentationParams(BaseModel):
    documents_required: int = Field(ge=0)
    documents_submitted: int = Field(ge=0, default=0)
    documents_verified: int = Field(ge=0, default=0)
    documentation_process_start_date: Optional[date] = None

class NotificationParams(BaseModel):
    notifications_required: int = Field(ge=0)
    notifications_issued: int = Field(ge=0, default=0)
    latest_notification_date: Optional[date] = None
    notification_process_start_date: Optional[date] = None
    notification_expected_completion_date: Optional[date] = None

class OwnershipParams(BaseModel):
    parcels_total: int = Field(ge=0)
    parcels_disputed: int = Field(ge=0, default=0)
    ownership_claims_total: int = Field(ge=0, default=0)
    ownership_conflicts_pending: int = Field(ge=0, default=0)
    ownership_conflicts_resolved: int = Field(ge=0, default=0)
    ownership_verification_start_date: Optional[date] = None

class RRParams(BaseModel):
    rr_families_required: int = Field(ge=0, default=0)
    rr_families_completed: int = Field(ge=0, default=0)
    rr_process_start_date: Optional[date] = None
    rr_expected_completion_date: Optional[date] = None

class PossessionParams(BaseModel):
    land_required_for_possession: float = Field(ge=0)
    land_acquired_for_possession: float = Field(ge=0, default=0.0)
    possession_status: Optional[str] = None
    possession_expected_date: Optional[date] = None

class StakeholderParams(BaseModel):
    stakeholder_requests_raised: int = Field(ge=0, default=0)
    stakeholder_responses_received: int = Field(ge=0, default=0)
    average_response_time_days: Optional[float] = None
    oldest_pending_response_days: Optional[int] = None

class CoordinationParams(BaseModel):
    departments_involved: int = Field(ge=1, default=1)
    coordination_requests_raised: int = Field(ge=0, default=0)
    coordination_requests_resolved: int = Field(ge=0, default=0)
    average_coordination_response_days: Optional[float] = None
    longest_pending_coordination_days: Optional[int] = None


# ========== Project Create ==========

class ProjectCreate(BaseModel):
    # Core identity
    project_name: str = Field(min_length=3, max_length=500)
    state: str
    district: str
    project_type: str
    land_area: float = Field(gt=0, description="Total land area in hectares")
    affected_families: int = Field(ge=0)
    current_stage: str
    next_stage: Optional[str] = None
    snapshot_date: date
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    # 10 parameter groups
    approvals: ApprovalParams
    legal: LegalParams
    compensation: CompensationParams
    documentation: DocumentationParams
    notifications: NotificationParams
    ownership: OwnershipParams
    rr: RRParams
    possession: PossessionParams
    stakeholder: StakeholderParams
    coordination: CoordinationParams


# ========== Project Update (add new snapshot) ==========

class ProjectSnapshotCreate(BaseModel):
    """Adding a new snapshot — new observation of the project's current state."""
    snapshot_date: date
    current_stage: str
    next_stage: Optional[str] = None
    status: str = "ONGOING"

    approvals: ApprovalParams
    legal: LegalParams
    compensation: CompensationParams
    documentation: DocumentationParams
    notifications: NotificationParams
    ownership: OwnershipParams
    rr: RRParams
    possession: PossessionParams
    stakeholder: StakeholderParams
    coordination: CoordinationParams


# ========== Prediction Factor ==========

class RiskFactor(BaseModel):
    feature: str
    label: str
    contribution: float
    direction: str  # "increases_risk" | "decreases_risk"


# ========== Project Response ==========

class ProjectListItem(BaseModel):
    id: UUID
    project_name: str
    state: str
    district: str
    project_type: str
    land_area: float
    affected_families: int
    status: str
    current_stage: str
    next_stage: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    snapshot_date: date
    created_at: datetime
    updated_at: datetime
    # Latest prediction (denormalized)
    risk_category: Optional[str]
    delay_probability: Optional[float]
    predicted_delay_days: Optional[float]
    confidence_score: Optional[float]
    data_freshness_days: Optional[int]

    model_config = {"from_attributes": True}


class PredictionResponse(BaseModel):
    prediction_id: UUID
    project_id: UUID
    snapshot_id: Optional[UUID]
    model_version: str
    prediction_timestamp: datetime
    next_stage: Optional[str]
    delay_probability: float
    predicted_delay_days: Optional[float]
    risk_category: str
    confidence_score: Optional[float]
    data_freshness_days: Optional[int]
    top_factors: Optional[list]
    recommendations: Optional[list]

    model_config = {"from_attributes": True}


class ProjectDetailResponse(BaseModel):
    id: UUID
    project_name: str
    state: str
    district: str
    project_type: str
    land_area: float
    affected_families: int
    status: str
    current_stage: str
    next_stage: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    snapshot_date: date
    created_at: datetime
    updated_at: datetime
    risk_category: Optional[str]
    delay_probability: Optional[float]
    predicted_delay_days: Optional[float]
    confidence_score: Optional[float]
    data_freshness_days: Optional[int]
    latest_snapshot: Optional[dict] = None
    latest_prediction: Optional[dict] = None
    snapshot_history: List[dict] = []

    model_config = {"from_attributes": True}


class ProjectListResponse(BaseModel):
    projects: List[ProjectListItem]
    total: int
    page: int
    page_size: int
