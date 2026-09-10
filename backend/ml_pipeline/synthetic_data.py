"""
Pravaah - Synthetic Data Generator
Generates complete project histories first, then derives chronological snapshots.
All data is clearly labelled synthetic and reproducible with a fixed seed.

Rules from data_dictionary.md:
- Generate complete project histories FIRST
- Derive chronological snapshots from those histories
- Preserve internally consistent balances and dates
- Include both delayed and non-delayed outcomes
- Avoid deterministic rules that make the target trivially obvious
- Avoid leakage
- Reproducible with recorded seed
"""

import uuid
import random
from datetime import date, timedelta
from typing import List, Dict, Any, Tuple

import numpy as np
import pandas as pd

# Fixed seed for reproducibility
SEED = 42
SEED_VERSION = "v1.0-synthetic"

STAGES = [
    "Initial Assessment / SIA",
    "Notification",
    "Objection / Hearing",
    "Land & Ownership Verification",
    "Award / Valuation",
    "Compensation Disbursement",
    "Rehabilitation & Resettlement",
    "Possession",
    "Acquisition Completion",
]

PROJECT_TYPES = ["HIGHWAY", "RAILWAY", "IRRIGATION", "INDUSTRIAL", "URBAN_DEVELOPMENT", "POWER", "MINING", "DEFENSE", "OTHER"]

STATES_DISTRICTS = {
    "Maharashtra": ["Pune", "Mumbai", "Nagpur", "Nashik", "Thane"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai"],
    "Karnataka": ["Bengaluru Urban", "Mysuru", "Hubli-Dharwad"],
    "Uttar Pradesh": ["Lucknow", "Noida", "Varanasi"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara"],
    "Rajasthan": ["Jaipur", "Jodhpur"],
    "Madhya Pradesh": ["Bhopal", "Indore"],
    "Telangana": ["Hyderabad", "Warangal"],
    "Kerala": ["Thiruvananthapuram", "Kochi"],
    "West Bengal": ["Kolkata"],
    "Delhi": ["New Delhi"],
    "Bihar": ["Patna"],
    "Jharkhand": ["Ranchi"],
}

# Approximate district coordinates for GIS
DISTRICT_COORDS = {
    "Pune": (18.52, 73.86), "Mumbai": (19.08, 72.88), "Nagpur": (21.15, 79.09),
    "Nashik": (20.00, 73.79), "Thane": (19.22, 72.98),
    "Chennai": (13.08, 80.27), "Coimbatore": (11.02, 76.96), "Madurai": (9.93, 78.12),
    "Bengaluru Urban": (12.97, 77.59), "Mysuru": (12.30, 76.64), "Hubli-Dharwad": (15.36, 75.12),
    "Lucknow": (26.85, 80.95), "Noida": (28.54, 77.39), "Varanasi": (25.32, 82.97),
    "Ahmedabad": (23.02, 72.57), "Surat": (21.17, 72.83), "Vadodara": (22.31, 73.18),
    "Jaipur": (26.91, 75.79), "Jodhpur": (26.24, 73.02),
    "Bhopal": (23.26, 77.41), "Indore": (22.72, 75.86),
    "Hyderabad": (17.39, 78.49), "Warangal": (17.98, 79.59),
    "Thiruvananthapuram": (8.52, 76.94), "Kochi": (9.93, 76.27),
    "Kolkata": (22.57, 88.36), "New Delhi": (28.61, 77.21),
    "Patna": (25.61, 85.14), "Ranchi": (23.34, 85.31),
}


def generate_synthetic_data(n_projects: int = 200, seed: int = SEED) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Generate synthetic project histories and derive chronological snapshots.
    
    Returns:
        (projects_df, snapshots_df) — both clearly labelled synthetic.
    """
    rng = np.random.RandomState(seed)
    random.seed(seed)

    projects = []
    all_snapshots = []

    for i in range(n_projects):
        project = _generate_project_history(i, rng)
        projects.append(project["meta"])
        all_snapshots.extend(project["snapshots"])

    projects_df = pd.DataFrame(projects)
    snapshots_df = pd.DataFrame(all_snapshots)

    # Label synthetic
    projects_df["is_synthetic"] = True
    projects_df["seed_version"] = SEED_VERSION
    snapshots_df["is_synthetic"] = True

    return projects_df, snapshots_df


def _generate_project_history(idx: int, rng: np.random.RandomState) -> Dict[str, Any]:
    """Generate a complete project history with chronological consistency."""

    project_id = str(uuid.uuid4())

    # Pick location
    state = rng.choice(list(STATES_DISTRICTS.keys()))
    district = rng.choice(STATES_DISTRICTS[state])
    coords = DISTRICT_COORDS.get(district, (20.0, 78.0))
    lat = coords[0] + rng.uniform(-0.3, 0.3)
    lon = coords[1] + rng.uniform(-0.3, 0.3)

    project_type = rng.choice(PROJECT_TYPES)
    land_area = round(rng.uniform(5, 500), 1)
    affected_families = int(rng.uniform(10, 2000))

    # Project timeline
    start_date = date(2020, 1, 1) + timedelta(days=int(rng.uniform(0, 1200)))

    # Determine delay profile — NOT deterministic from inputs
    # Use a stochastic profile with correlations (not trivially predictable)
    base_delay_tendency = rng.beta(2, 3)  # Most projects have moderate delays
    noise = rng.normal(0, 0.15)
    delay_tendency = np.clip(base_delay_tendency + noise, 0, 1)

    # Generate stage durations
    stage_planned_days = []
    stage_actual_days = []
    for stage_idx, stage_name in enumerate(STAGES):
        planned = int(rng.uniform(30, 120))
        stage_planned_days.append(planned)

        # Actual duration influenced by delay tendency + stage-specific factors
        stage_factor = 1.0
        if stage_name in ("Objection / Hearing", "Land & Ownership Verification"):
            stage_factor += rng.uniform(0, 0.4)  # Legal stages more variable
        if stage_name == "Compensation Disbursement":
            stage_factor += rng.uniform(0, 0.3) if land_area > 100 else 0
        if stage_name == "Rehabilitation & Resettlement" and affected_families > 500:
            stage_factor += rng.uniform(0, 0.3)

        delay_multiplier = 1.0 + delay_tendency * stage_factor * rng.uniform(0.3, 1.5)
        actual = int(planned * delay_multiplier + rng.normal(0, 10))
        actual = max(planned // 2, actual)  # Can't be too fast either
        stage_actual_days.append(actual)

    # Determine how far the project got
    completion_prob = rng.uniform(0.6, 1.0)  # Most historical projects complete
    if rng.random() < 0.85:
        stages_completed = len(STAGES)  # Completed
        final_status = "COMPLETED"
    else:
        stages_completed = rng.randint(2, len(STAGES))
        final_status = rng.choice(["COMPLETED", "CANCELLED"])

    total_duration = sum(stage_actual_days[:stages_completed])

    # Build project meta
    project_meta = {
        "historical_project_id": project_id,
        "project_name": f"LA-{state[:2].upper()}-{district[:3].upper()}-{idx+1:04d}",
        "state": state,
        "district": district,
        "project_type": project_type,
        "land_area": land_area,
        "affected_families": affected_families,
        "final_status": final_status,
        "total_duration_days": total_duration,
        "latitude": round(lat, 4),
        "longitude": round(lon, 4),
        "start_date": start_date,
    }

    # Generate chronological snapshots
    snapshots = _generate_snapshots(
        project_id, project_meta, stage_planned_days, stage_actual_days,
        stages_completed, start_date, rng
    )

    return {"meta": project_meta, "snapshots": snapshots}


def _generate_snapshots(
    project_id: str, meta: Dict, planned_days: List[int], actual_days: List[int],
    stages_completed: int, start_date: date, rng: np.random.RandomState
) -> List[Dict]:
    """Generate 5-10 chronological snapshots per project."""

    snapshots = []
    total_duration = sum(actual_days[:stages_completed])
    n_snapshots = rng.randint(5, 11)

    # Snapshot dates spread across project timeline
    snapshot_offsets = sorted(rng.choice(range(1, max(total_duration, 60)), size=min(n_snapshots, max(total_duration-1, 5)), replace=False))

    land_area = meta["land_area"]
    affected_families = meta["affected_families"]

    # Pre-compute cumulative stage boundaries
    stage_cumulative = [0]
    for d in actual_days[:stages_completed]:
        stage_cumulative.append(stage_cumulative[-1] + d)

    # Pre-compute planned boundaries
    planned_cumulative = [0]
    for d in planned_days[:stages_completed]:
        planned_cumulative.append(planned_cumulative[-1] + d)

    # Base parameter totals (consistent across snapshots)
    approvals_total = int(rng.uniform(3, 15))
    legal_cases_total = int(rng.uniform(0, 20))
    compensation_total = round(land_area * rng.uniform(0.5, 5.0), 2)  # Crore
    docs_total = int(rng.uniform(5, 30))
    notif_total = int(rng.uniform(2, 10))
    parcels_total = int(rng.uniform(5, 100))
    rr_families_total = int(rng.uniform(0, affected_families))
    stakeholder_total = int(rng.uniform(3, 25))
    dept_count = int(rng.uniform(2, 8))
    coord_total = int(rng.uniform(3, 20))

    for offset in snapshot_offsets:
        snapshot_date = start_date + timedelta(days=int(offset))
        progress_frac = offset / max(total_duration, 1)

        # Determine current stage
        current_stage_idx = 0
        for s_idx in range(stages_completed):
            if offset >= stage_cumulative[s_idx]:
                current_stage_idx = s_idx
        current_stage_idx = min(current_stage_idx, len(STAGES) - 1)
        current_stage = STAGES[current_stage_idx]
        next_stage = STAGES[current_stage_idx + 1] if current_stage_idx + 1 < len(STAGES) else None

        # Progress within current stage
        stage_start = stage_cumulative[current_stage_idx]
        stage_end = stage_cumulative[min(current_stage_idx + 1, len(stage_cumulative) - 1)]
        stage_progress = (offset - stage_start) / max(stage_end - stage_start, 1)
        stage_progress = np.clip(stage_progress, 0, 1)

        # Days in current stage
        days_in_stage = offset - stage_start

        # Compute parameter progress with noise (NOT linearly deterministic)
        noise_fn = lambda base: np.clip(base + rng.normal(0, 0.08), 0, 1)

        # Approvals progress (faster in early stages)
        app_progress = noise_fn(min(progress_frac * 1.3, 1.0))
        app_completed = min(int(approvals_total * app_progress), approvals_total)
        app_pending = approvals_total - app_completed

        # Legal (slower resolution)
        legal_progress = noise_fn(progress_frac * 0.8)
        legal_resolved = min(int(legal_cases_total * legal_progress), legal_cases_total)
        legal_pending = legal_cases_total - legal_resolved

        # Compensation (mid-to-late stage)
        comp_progress = noise_fn(max(0, (progress_frac - 0.2) * 1.25))
        comp_paid = round(compensation_total * comp_progress, 2)
        comp_pending = round(compensation_total - comp_paid, 2)
        ben_compensated = min(int(meta["affected_families"] * comp_progress), meta["affected_families"])

        # Documentation
        doc_progress = noise_fn(progress_frac * 1.1)
        docs_submitted = min(int(docs_total * doc_progress), docs_total)
        docs_verified = min(int(docs_submitted * noise_fn(0.7)), docs_submitted)
        docs_incomplete = docs_total - docs_submitted

        # Notifications
        notif_progress = noise_fn(min(progress_frac * 1.4, 1.0))
        notif_issued = min(int(notif_total * notif_progress), notif_total)

        # Ownership
        ownership_progress = noise_fn(progress_frac * 0.9)
        parcels_disputed = max(0, int(parcels_total * (1 - ownership_progress) * rng.uniform(0.1, 0.4)))
        ownership_resolved = min(int(parcels_disputed * ownership_progress * 2), parcels_disputed)

        # R&R
        rr_progress = noise_fn(max(0, (progress_frac - 0.3) * 1.4))
        rr_completed = min(int(rr_families_total * rr_progress), rr_families_total)

        # Possession
        poss_progress = noise_fn(max(0, (progress_frac - 0.4) * 1.5))
        land_acquired = round(land_area * poss_progress, 1)

        # Stakeholder
        sth_progress = noise_fn(progress_frac)
        sth_responded = min(int(stakeholder_total * sth_progress), stakeholder_total)

        # Coordination
        coord_progress = noise_fn(progress_frac * 0.85)
        coord_resolved = min(int(coord_total * coord_progress), coord_total)

        # Compute target: next_stage_delayed_30d
        # Only computable if we know the next stage completion
        next_stage_delayed_30d = None
        next_stage_delay_days = None
        next_planned_date = None
        next_actual_date = None

        if next_stage is not None and current_stage_idx + 1 < stages_completed:
            # Planned completion of next stage
            planned_end_idx = min(current_stage_idx + 2, len(planned_cumulative) - 1)
            actual_end_idx = min(current_stage_idx + 2, len(stage_cumulative) - 1)

            next_planned_date = start_date + timedelta(days=planned_cumulative[planned_end_idx])
            next_actual_date = start_date + timedelta(days=stage_cumulative[actual_end_idx])

            delay = (next_actual_date - next_planned_date).days
            next_stage_delay_days = max(0, delay)
            next_stage_delayed_30d = 1 if delay > 30 else 0

        snapshot = {
            "snapshot_id": str(uuid.uuid4()),
            "historical_project_id": project_id,
            "snapshot_date": snapshot_date,
            "current_stage": current_stage,
            "next_stage": next_stage,

            # Approvals
            "approvals_required": approvals_total,
            "approvals_completed": app_completed,
            "approvals_pending": app_pending,
            "approval_progress_pct": round(app_completed / max(approvals_total, 1) * 100, 1),
            "oldest_pending_approval_days": int(rng.uniform(5, 90)) if app_pending > 0 else 0,

            # Legal
            "legal_cases_total": legal_cases_total,
            "legal_cases_pending": legal_pending,
            "legal_cases_resolved": legal_resolved,
            "disputed_land_area": round(land_area * max(0, 0.1 * (1 - legal_progress)), 1),
            "oldest_pending_case_days": int(rng.uniform(10, 180)) if legal_pending > 0 else 0,

            # Compensation
            "compensation_total_amount": compensation_total,
            "compensation_paid_amount": comp_paid,
            "compensation_pending_amount": comp_pending,
            "beneficiaries_eligible": meta["affected_families"],
            "beneficiaries_compensated": ben_compensated,
            "beneficiaries_pending": meta["affected_families"] - ben_compensated,
            "compensation_progress_pct": round(comp_paid / max(compensation_total, 0.01) * 100, 1),

            # Documentation
            "documents_required": docs_total,
            "documents_submitted": docs_submitted,
            "documents_verified": docs_verified,
            "documents_incomplete": docs_incomplete,
            "documentation_progress_pct": round(docs_verified / max(docs_total, 1) * 100, 1),

            # Notifications
            "notifications_required": notif_total,
            "notifications_issued": notif_issued,
            "notifications_pending": notif_total - notif_issued,
            "notification_progress_pct": round(notif_issued / max(notif_total, 1) * 100, 1),

            # Ownership
            "parcels_total": parcels_total,
            "parcels_disputed": parcels_disputed,
            "ownership_conflicts_pending": max(0, parcels_disputed - ownership_resolved),
            "ownership_conflicts_resolved": ownership_resolved,

            # R&R
            "rr_families_required": rr_families_total,
            "rr_families_completed": rr_completed,
            "rr_families_pending": rr_families_total - rr_completed,
            "rr_progress_pct": round(rr_completed / max(rr_families_total, 1) * 100, 1),

            # Possession
            "land_required_for_possession": land_area,
            "land_acquired_for_possession": land_acquired,
            "possession_progress_pct": round(land_acquired / max(land_area, 0.1) * 100, 1),

            # Stakeholder
            "stakeholder_requests_raised": stakeholder_total,
            "stakeholder_responses_received": sth_responded,
            "stakeholder_requests_pending": stakeholder_total - sth_responded,
            "average_response_time_days": round(rng.uniform(3, 30), 1),

            # Coordination
            "departments_involved": dept_count,
            "coordination_requests_raised": coord_total,
            "coordination_requests_resolved": coord_resolved,
            "coordination_requests_pending": coord_total - coord_resolved,
            "average_coordination_response_days": round(rng.uniform(5, 45), 1),

            # Temporal
            "days_in_current_stage": days_in_stage,
            "total_project_days": offset,

            # Targets (future outcome — NEVER used as input features)
            "next_stage_delayed_30d": next_stage_delayed_30d,
            "next_stage_delay_days": next_stage_delay_days,
            "next_stage_planned_completion_date": next_planned_date,
            "next_stage_actual_completion_date": next_actual_date,
        }

        snapshots.append(snapshot)

    return snapshots


if __name__ == "__main__":
    projects_df, snapshots_df = generate_synthetic_data(200)
    print(f"Generated {len(projects_df)} projects, {len(snapshots_df)} snapshots")
    print(f"\nTarget distribution:")
    print(snapshots_df["next_stage_delayed_30d"].value_counts(dropna=False))
    print(f"\nStages: {snapshots_df['current_stage'].nunique()}")
    print(f"States: {snapshots_df['historical_project_id'].nunique()}")
