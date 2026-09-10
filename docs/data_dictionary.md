# Data Dictionary
## Predictive Land Acquisition Intelligence & Early-Intervention Decision Support Platform

### 1. Data Design Principle
The central ML unit is a **historical snapshot**:

> A project state as it was known on a specific snapshot date, paired with what happened after that date.

Officers enter observed records/progress. They do not enter the model's risk score or manually invent delay values.

Historical snapshots must not contain information that would only become known after the snapshot date.

### 2. Operational Project Fields

| Field | Type | Meaning | Source/Entry | Notes |
|---|---|---|---|---|
| project_id | string/UUID | Unique project identifier | System | Stable primary identifier |
| project_name | string | Project name | Officer | Required |
| state | string | Project state | Officer/system | RBAC scope |
| district | string | Project district | Officer/system | RBAC scope |
| project_type | categorical | Type of project | Officer | Configurable categories |
| land_area | numeric | Total land required | Officer | Use consistent unit |
| affected_families | integer | Families affected | Officer | Non-negative |
| status | categorical | Lifecycle state | System/officer workflow | ONGOING/COMPLETED/CANCELLED/ON_HOLD |
| snapshot_date | date | Date state was observed | System/officer | Critical for leakage control |
| current_stage | categorical | Current acquisition stage | Derived/configured | Stage sequence is configurable |
| next_stage | categorical | Next relevant stage | Derived | Used for prediction target |

### 3. Current-State Parameters

#### 3.1 Administrative Approvals
Recommended observed fields:
- `approvals_required`
- `approvals_completed`
- `approvals_pending`
- `approval_progress_pct`
- `approval_process_start_date`
- `approval_expected_completion_date`
- `oldest_pending_approval_days` (derived only from dates known at snapshot)

#### 3.2 Legal Disputes
- `legal_cases_total`
- `legal_cases_pending`
- `legal_cases_resolved`
- `disputed_land_area`
- `oldest_pending_case_days`
- `legal_process_start_date`

#### 3.3 Compensation
- `compensation_total_amount`
- `compensation_paid_amount`
- `compensation_pending_amount`
- `beneficiaries_eligible`
- `beneficiaries_compensated`
- `beneficiaries_pending`
- `compensation_progress_pct`
- `compensation_process_start_date`
- `compensation_expected_completion_date`

#### 3.4 Documentation
- `documents_required`
- `documents_submitted`
- `documents_verified`
- `documents_incomplete`
- `documents_unverified`
- `documentation_progress_pct`
- `documentation_process_start_date`

Distinguish incomplete documents from submitted-but-not-yet-verified documents.

#### 3.5 Notifications
- `notifications_required`
- `notifications_issued`
- `notifications_pending`
- `notification_progress_pct`
- `latest_notification_date`
- `notification_process_start_date`
- `notification_expected_completion_date`

#### 3.6 Ownership Conflicts
- `parcels_total`
- `parcels_disputed`
- `ownership_claims_total`
- `ownership_conflicts_pending`
- `ownership_conflicts_resolved`
- `disputed_land_area`
- `ownership_verification_start_date`

#### 3.7 Rehabilitation & Resettlement (R&R)
- `rr_families_required`
- `rr_families_completed`
- `rr_families_pending`
- `rr_progress_pct`
- `rr_process_start_date`
- `rr_expected_completion_date`

#### 3.8 Possession
Possession is primarily treated as a stage/milestone rather than a generic delay factor.

Observed fields:
- `land_required_for_possession`
- `land_acquired_for_possession`
- `land_remaining_for_possession`
- `possession_progress_pct`
- `possession_status`
- `possession_expected_date`

#### 3.9 Stakeholder Responsiveness
- `stakeholder_requests_raised`
- `stakeholder_responses_received`
- `stakeholder_requests_pending`
- `average_response_time_days`
- `oldest_pending_response_days`

#### 3.10 Inter-Department Coordination
- `departments_involved`
- `coordination_requests_raised`
- `coordination_requests_resolved`
- `coordination_requests_pending`
- `average_coordination_response_days`
- `longest_pending_coordination_days`

### 4. Historical Context
Historical context must represent information that was available by the snapshot date.

Examples:
- `district_prior_project_count`
- `district_prior_completed_project_count`
- `district_prior_delayed_project_count`
- `district_prior_delay_rate`
- `district_prior_average_delay_days`
- `authority_prior_project_count`
- `authority_prior_delay_rate`
- `project_type_prior_delay_rate`

Do not calculate these using the future outcome of the current project.

### 5. Target Fields

#### Primary classification target
`next_stage_delayed_30d`

Definition:
- `1` if the next relevant stage/milestone ultimately exceeds its planned completion by more than 30 days.
- `0` otherwise.

The exact business definition must be fixed before final training and consistently applied.

#### Supporting regression target
`next_stage_delay_days`

Definition:
- Actual delay in days for the next relevant stage/milestone relative to its planned completion date.

This is a future outcome and must never be included as an input feature.

#### Target support fields
- `next_stage_planned_completion_date`
- `next_stage_actual_completion_date`
- `next_stage_delay_days`
- `future_observation_window_end` if a fixed prediction horizon is adopted.

These fields are training/label data, not current-state inputs.

### 6. Optional Parameter-Level Future Outcomes
For parameter-wise modelling, future targets can be maintained separately:
- `future_administrative_delay_days`
- `future_legal_delay_days`
- `future_compensation_delay_days`
- `future_documentation_delay_days`
- `future_notification_delay_days`
- `future_ownership_delay_days`
- `future_rr_delay_days`
- `future_possession_delay_days`
- `future_coordination_delay_days`

These require precise definitions of what milestone/event each target measures.

Do not use vague “future delay until project completion” targets without a defined horizon or milestone.

### 7. Prediction Record
Recommended fields:
- `prediction_id`
- `project_id`
- `snapshot_id`
- `model_version`
- `prediction_timestamp`
- `next_stage`
- `delay_probability`
- `predicted_delay_days`
- `risk_category`
- `confidence_score`
- `data_freshness_days`
- `top_factors`
- `recommendations`

### 8. Audit Record
Recommended fields:
- `audit_id`
- `actor_user_id`
- `project_id`
- `action`
- `timestamp`
- `changed_fields`
- `before_values`
- `after_values`
- `source`
- `request/reference identifier` where applicable

### 9. Notification Record
- `notification_id`
- `user_id`
- `project_id`
- `type`
- `severity`
- `message`
- `created_at`
- `read_at`
- `trigger_prediction_id`

### 10. Model Metadata
- `model_version`
- `model_type`
- `training_dataset_version`
- `feature_schema_version`
- `training_timestamp`
- `validation_metrics`
- `calibration_metrics`
- `status` (candidate/approved/retired)
- `notes`

### 11. Derived Features
Derived values are calculated by the system from observed records, for example:
- Progress percentages.
- Pending balances.
- Days since process start.
- Age of oldest pending item.
- Response-rate percentages.
- Historical rates.
- Data freshness.

Derived features must be reproducible and documented.

### 12. Data Quality Rules
At minimum:
- Non-negative quantities where logically required.
- Completed counts cannot exceed required counts.
- Paid compensation cannot exceed total compensation.
- Pending = required minus completed where that relationship is defined.
- Percentages must remain within valid bounds.
- Snapshot dates must be chronological per project.
- Future dates cannot be silently treated as completed historical observations.
- Duplicate project/snapshot pairs are prohibited.
- Historical target fields must be unavailable to the model at prediction time.

### 13. Leakage Rules
Never use:
- Final project delay.
- Future actual completion date.
- Future compensation outcome.
- Future legal resolution.
- Future possession outcome.
- Any field recorded after the snapshot date.

A historical snapshot should be equivalent to asking:
**“If we had known only this information on that date, what could we have predicted?”**

### 14. Historical Dataset Structure
Recommended conceptual split:

```text
historical_projects
    1 row per completed project

historical_project_snapshots
    many chronological rows per project

operational_projects
    active project identity/current state

operational_project_state_history
    chronological observations for active projects
```

Training data can be derived from historical project histories and snapshots.

### 15. Synthetic Data Requirements
Synthetic data must:
- Be explicitly labelled synthetic.
- Be generated from complete project histories first.
- Produce chronological snapshots from those histories.
- Preserve internally consistent balances and dates.
- Represent realistic distributions and relationships.
- Include both delayed and non-delayed outcomes.
- Avoid deterministic rules that make the target trivially obvious.
- Avoid leakage.
- Be reproducible with a recorded seed/version.
