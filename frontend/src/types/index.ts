/**
 * Bhumi Prajna - TypeScript Type Definitions
 * Core types matching the data dictionary and backend schemas.
 */

// ========== Auth & Users ==========

export type UserRole = 'ADMIN' | 'CENTRAL_OFFICER' | 'STATE_OFFICER' | 'DISTRICT_OFFICER';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  state: string | null;
  district: string | null;
  is_active: boolean;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface UserCreate {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  state?: string;
  district?: string;
}

// ========== Risk ==========

export type RiskCategory = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export const RISK_COLORS: Record<RiskCategory, { text: string; bg: string; border: string }> = {
  LOW: { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  MEDIUM: { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  HIGH: { text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  CRITICAL: { text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
};

export const RISK_LABELS: Record<RiskCategory, string> = {
  LOW: 'Low Risk',
  MEDIUM: 'Medium Risk',
  HIGH: 'High Risk',
  CRITICAL: 'Critical Risk',
};

// ========== Projects ==========

export type ProjectStatus = 'ONGOING' | 'COMPLETED' | 'CANCELLED' | 'ON_HOLD';

export interface Project {
  id: string;
  project_name: string;
  state: string;
  district: string;
  project_type: string;
  land_area: number;
  affected_families: number;
  status: ProjectStatus;
  current_stage: string;
  next_stage: string | null;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  snapshot_date: string;
  // Latest prediction
  risk_category?: RiskCategory;
  delay_probability?: number;
  predicted_delay_days?: number;
  confidence_score?: number;
  data_freshness_days?: number;
}

export interface ProjectDetail extends Project {
  // Parameter groups
  approvals: ApprovalParams;
  legal: LegalParams;
  compensation: CompensationParams;
  documentation: DocumentationParams;
  notifications_params: NotificationParams;
  ownership: OwnershipParams;
  rr: RRParams;
  possession: PossessionParams;
  stakeholder: StakeholderParams;
  coordination: CoordinationParams;
  // Prediction
  latest_prediction?: Prediction;
  // History
  update_history?: StateSnapshot[];
}

// ========== Parameter Groups ==========

export interface ApprovalParams {
  approvals_required: number;
  approvals_completed: number;
  approvals_pending: number;
  approval_progress_pct: number;
  approval_process_start_date: string | null;
  approval_expected_completion_date: string | null;
  oldest_pending_approval_days: number | null;
}

export interface LegalParams {
  legal_cases_total: number;
  legal_cases_pending: number;
  legal_cases_resolved: number;
  disputed_land_area: number;
  oldest_pending_case_days: number | null;
  legal_process_start_date: string | null;
}

export interface CompensationParams {
  compensation_total_amount: number;
  compensation_paid_amount: number;
  compensation_pending_amount: number;
  beneficiaries_eligible: number;
  beneficiaries_compensated: number;
  beneficiaries_pending: number;
  compensation_progress_pct: number;
  compensation_process_start_date: string | null;
  compensation_expected_completion_date: string | null;
}

export interface DocumentationParams {
  documents_required: number;
  documents_submitted: number;
  documents_verified: number;
  documents_incomplete: number;
  documents_unverified: number;
  documentation_progress_pct: number;
  documentation_process_start_date: string | null;
}

export interface NotificationParams {
  notifications_required: number;
  notifications_issued: number;
  notifications_pending: number;
  notification_progress_pct: number;
  latest_notification_date: string | null;
  notification_process_start_date: string | null;
  notification_expected_completion_date: string | null;
}

export interface OwnershipParams {
  parcels_total: number;
  parcels_disputed: number;
  ownership_claims_total: number;
  ownership_conflicts_pending: number;
  ownership_conflicts_resolved: number;
  disputed_land_area: number;
  ownership_verification_start_date: string | null;
}

export interface RRParams {
  rr_families_required: number;
  rr_families_completed: number;
  rr_families_pending: number;
  rr_progress_pct: number;
  rr_process_start_date: string | null;
  rr_expected_completion_date: string | null;
}

export interface PossessionParams {
  land_required_for_possession: number;
  land_acquired_for_possession: number;
  land_remaining_for_possession: number;
  possession_progress_pct: number;
  possession_status: string;
  possession_expected_date: string | null;
}

export interface StakeholderParams {
  stakeholder_requests_raised: number;
  stakeholder_responses_received: number;
  stakeholder_requests_pending: number;
  average_response_time_days: number | null;
  oldest_pending_response_days: number | null;
}

export interface CoordinationParams {
  departments_involved: number;
  coordination_requests_raised: number;
  coordination_requests_resolved: number;
  coordination_requests_pending: number;
  average_coordination_response_days: number | null;
  longest_pending_coordination_days: number | null;
}

// ========== Prediction ==========

export interface Prediction {
  prediction_id: string;
  project_id: string;
  snapshot_id: string;
  model_version: string;
  prediction_timestamp: string;
  next_stage: string;
  delay_probability: number;
  predicted_delay_days: number | null;
  risk_category: RiskCategory;
  confidence_score: number;
  data_freshness_days: number;
  top_factors: RiskFactor[];
  recommendations: string[];
}

export interface RiskFactor {
  feature: string;
  label: string;
  contribution: number;
  direction: 'increases_risk' | 'decreases_risk';
}

// ========== State Snapshots ==========

export interface StateSnapshot {
  id: string;
  project_id: string;
  snapshot_date: string;
  current_stage: string;
  risk_category?: RiskCategory;
  delay_probability?: number;
  created_at: string;
  created_by_email: string;
}

// ========== Notifications ==========

export interface AppNotification {
  id: string;
  user_id: string;
  project_id: string;
  type: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  created_at: string;
  read_at: string | null;
  project_name?: string;
}

// ========== Audit ==========

export interface AuditRecord {
  id: string;
  actor_user_id: string;
  actor_email: string;
  project_id: string | null;
  action: string;
  timestamp: string;
  changed_fields: Record<string, unknown> | null;
  before_values: Record<string, unknown> | null;
  after_values: Record<string, unknown> | null;
  details: string | null;
}

// ========== Analytics ==========

export interface DashboardStats {
  total_ongoing: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  no_prediction_count: number;
  high_risk_projects: Project[];
  recent_alerts: AppNotification[];
}

// ========== Geography ==========

export interface GeoState {
  name: string;
  code: string;
  latitude: number;
  longitude: number;
}

export interface GeoDistrict {
  name: string;
  state_name: string;
  state_code: string;
  latitude: number;
  longitude: number;
}

// ========== Stages ==========

export interface StageDefinition {
  id: string;
  name: string;
  stage_order: number;
  description: string | null;
}
