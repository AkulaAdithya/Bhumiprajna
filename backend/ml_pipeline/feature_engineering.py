"""
Pravaah - Feature Engineering Pipeline
Constructs features from snapshot data for ML training.

Strict leakage rules from data_dictionary.md:
- NEVER use final project delay, future actual completion, future compensation outcome,
  future legal resolution, future possession outcome, or any post-snapshot field.
- A snapshot should answer: "What could we predict from ONLY this information on that date?"
"""

import pandas as pd
import numpy as np
from typing import List, Tuple

# Feature columns used by the model (input features ONLY)
FEATURE_COLUMNS = [
    # Project characteristics
    "land_area", "affected_families",
    "project_type_encoded", "current_stage_encoded",

    # Approval progress
    "approvals_required", "approvals_completed", "approvals_pending",
    "approval_progress_pct", "oldest_pending_approval_days",

    # Legal
    "legal_cases_total", "legal_cases_pending", "legal_cases_resolved",
    "disputed_land_area", "oldest_pending_case_days",
    "legal_resolution_rate",

    # Compensation
    "compensation_total_amount", "compensation_paid_amount", "compensation_pending_amount",
    "beneficiaries_eligible", "beneficiaries_compensated", "beneficiaries_pending",
    "compensation_progress_pct",

    # Documentation
    "documents_required", "documents_submitted", "documents_verified",
    "documents_incomplete", "documentation_progress_pct",
    "verification_rate",

    # Notifications
    "notifications_required", "notifications_issued", "notifications_pending",
    "notification_progress_pct",

    # Ownership
    "parcels_total", "parcels_disputed",
    "ownership_conflicts_pending", "ownership_conflicts_resolved",
    "ownership_dispute_rate",

    # R&R
    "rr_families_required", "rr_families_completed", "rr_families_pending",
    "rr_progress_pct",

    # Possession
    "land_required_for_possession", "land_acquired_for_possession",
    "possession_progress_pct",

    # Stakeholder
    "stakeholder_requests_raised", "stakeholder_responses_received",
    "stakeholder_requests_pending", "average_response_time_days",
    "stakeholder_response_rate",

    # Coordination
    "departments_involved", "coordination_requests_raised",
    "coordination_requests_resolved", "coordination_requests_pending",
    "average_coordination_response_days",
    "coordination_resolution_rate",

    # Temporal
    "days_in_current_stage", "total_project_days",

    # Derived risk indicators
    "pending_actions_total",
    "overall_progress_score",
    "bottleneck_score",
]

# Target columns (NEVER used as features)
TARGET_COLUMNS = [
    "next_stage_delayed_30d",
    "next_stage_delay_days",
    "next_stage_planned_completion_date",
    "next_stage_actual_completion_date",
]

# Columns that encode project/stage info
PROJECT_TYPE_MAP = {
    "HIGHWAY": 0, "RAILWAY": 1, "IRRIGATION": 2, "INDUSTRIAL": 3,
    "URBAN_DEVELOPMENT": 4, "POWER": 5, "MINING": 6, "DEFENSE": 7, "OTHER": 8,
}

STAGE_MAP = {
    "Initial Assessment / SIA": 0, "Notification": 1, "Objection / Hearing": 2,
    "Land & Ownership Verification": 3, "Award / Valuation": 4,
    "Compensation Disbursement": 5, "Rehabilitation & Resettlement": 6,
    "Possession": 7, "Acquisition Completion": 8,
}


def build_features(snapshots_df: pd.DataFrame, projects_df: pd.DataFrame = None) -> pd.DataFrame:
    """
    Build feature matrix from snapshot data.
    Adds derived features. Does NOT include target columns in the feature set.
    """
    df = snapshots_df.copy()

    # Encode categoricals
    if "project_type" in df.columns:
        df["project_type_encoded"] = df["project_type"].map(PROJECT_TYPE_MAP).fillna(8).astype(int)
    elif projects_df is not None:
        proj_type_map = projects_df.set_index("historical_project_id")["project_type"].to_dict()
        df["project_type_encoded"] = df["historical_project_id"].map(proj_type_map).map(PROJECT_TYPE_MAP).fillna(8).astype(int)
    else:
        df["project_type_encoded"] = 8

    df["current_stage_encoded"] = df["current_stage"].map(STAGE_MAP).fillna(0).astype(int)

    # Add project characteristics from projects_df if available
    if projects_df is not None and "land_area" not in df.columns:
        proj_info = projects_df.set_index("historical_project_id")[["land_area", "affected_families"]].to_dict()
        df["land_area"] = df["historical_project_id"].map(proj_info.get("land_area", {})).fillna(100)
        df["affected_families"] = df["historical_project_id"].map(proj_info.get("affected_families", {})).fillna(100)

    # Derived features (computed from CURRENT observable state only)
    df["legal_resolution_rate"] = safe_divide(df["legal_cases_resolved"], df["legal_cases_total"])
    df["verification_rate"] = safe_divide(df["documents_verified"], df["documents_submitted"])
    df["ownership_dispute_rate"] = safe_divide(df["parcels_disputed"], df["parcels_total"])
    df["stakeholder_response_rate"] = safe_divide(df["stakeholder_responses_received"], df["stakeholder_requests_raised"])
    df["coordination_resolution_rate"] = safe_divide(df["coordination_requests_resolved"], df["coordination_requests_raised"])

    # Aggregate risk indicators
    df["pending_actions_total"] = (
        df["approvals_pending"].fillna(0) +
        df["legal_cases_pending"].fillna(0) +
        df["beneficiaries_pending"].fillna(0) +
        df["documents_incomplete"].fillna(0) +
        df["notifications_pending"].fillna(0) +
        df["ownership_conflicts_pending"].fillna(0) +
        df["rr_families_pending"].fillna(0) +
        df["stakeholder_requests_pending"].fillna(0) +
        df["coordination_requests_pending"].fillna(0)
    )

    # Overall progress score (average of all progress percentages)
    progress_cols = [
        "approval_progress_pct", "compensation_progress_pct",
        "documentation_progress_pct", "notification_progress_pct",
        "rr_progress_pct", "possession_progress_pct",
    ]
    available_progress = [c for c in progress_cols if c in df.columns]
    if available_progress:
        df["overall_progress_score"] = df[available_progress].mean(axis=1)
    else:
        df["overall_progress_score"] = 0.0

    # Bottleneck score: identify the most lagging parameter
    if available_progress:
        df["bottleneck_score"] = 100 - df[available_progress].min(axis=1)
    else:
        df["bottleneck_score"] = 0.0

    # Fill NaN in features
    for col in FEATURE_COLUMNS:
        if col in df.columns:
            df[col] = df[col].fillna(0)

    return df


def prepare_training_data(snapshots_df: pd.DataFrame, projects_df: pd.DataFrame = None) -> Tuple[pd.DataFrame, pd.Series, pd.Series]:
    """
    Prepare X (features), y_class (binary target), y_reg (delay days).
    Only includes snapshots where target is known.
    """
    df = build_features(snapshots_df, projects_df)

    # Filter to snapshots with known targets
    valid = df["next_stage_delayed_30d"].notna()
    df_valid = df[valid].copy()

    if len(df_valid) == 0:
        raise ValueError("No snapshots with valid targets found!")

    # Ensure all feature columns exist
    for col in FEATURE_COLUMNS:
        if col not in df_valid.columns:
            df_valid[col] = 0

    X = df_valid[FEATURE_COLUMNS].copy()
    y_class = df_valid["next_stage_delayed_30d"].astype(int)
    y_reg = df_valid["next_stage_delay_days"].fillna(0).astype(float)

    return X, y_class, y_reg


def leakage_check(X: pd.DataFrame, target_cols: List[str] = None) -> List[str]:
    """
    Verify that NO target/future columns are present in the feature set.
    Returns list of violations (should be empty).
    """
    if target_cols is None:
        target_cols = TARGET_COLUMNS

    violations = []
    forbidden_patterns = [
        "next_stage_delayed", "next_stage_delay_days",
        "actual_completion", "future_", "final_delay",
        "final_status", "total_duration_days",
    ]

    for col in X.columns:
        col_lower = col.lower()
        for pattern in forbidden_patterns:
            if pattern in col_lower:
                violations.append(f"LEAKAGE: '{col}' matches forbidden pattern '{pattern}'")

        if col in target_cols:
            violations.append(f"LEAKAGE: target column '{col}' found in features")

    return violations


def safe_divide(numerator: pd.Series, denominator: pd.Series) -> pd.Series:
    """Safe division avoiding divide-by-zero."""
    return np.where(denominator > 0, numerator / denominator, 0.0)


if __name__ == "__main__":
    from synthetic_data import generate_synthetic_data

    projects_df, snapshots_df = generate_synthetic_data(200)
    X, y_class, y_reg = prepare_training_data(snapshots_df, projects_df)

    print(f"Feature matrix: {X.shape}")
    print(f"Classification target distribution:\n{y_class.value_counts()}")
    print(f"Regression target stats:\n{y_reg.describe()}")

    violations = leakage_check(X)
    if violations:
        print(f"\n⚠️ LEAKAGE VIOLATIONS:")
        for v in violations:
            print(f"  {v}")
    else:
        print(f"\n✅ No leakage detected in {len(X.columns)} features")
