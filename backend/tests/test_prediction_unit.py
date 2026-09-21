"""
Bhumi Prajna - Prediction Service Unit Tests
Tests that predictions differ for substantially different project profiles.
Does NOT require a live server.
"""
import pytest
import numpy as np
import pandas as pd

from app.ml.prediction_service import PredictionService


@pytest.fixture(scope="module")
def svc():
    s = PredictionService()
    s.load()
    return s


PROFILE_LOW_RISK = {
    "project_type": "HIGHWAY", "current_stage": "Possession",
    "land_area": 500.0, "affected_families": 1000,
    "approvals_required": 20, "approvals_completed": 19, "approvals_pending": 1,
    "approval_progress_pct": 95.0, "oldest_pending_approval_days": 2,
    "legal_cases_total": 5, "legal_cases_pending": 0, "legal_cases_resolved": 5,
    "disputed_land_area": 0.0, "oldest_pending_case_days": 0,
    "compensation_total_amount": 500000, "compensation_paid_amount": 490000,
    "compensation_pending_amount": 10000, "beneficiaries_eligible": 1000,
    "beneficiaries_compensated": 990, "beneficiaries_pending": 10,
    "compensation_progress_pct": 98.0, "documents_required": 50,
    "documents_submitted": 50, "documents_verified": 50, "documents_incomplete": 0,
    "documentation_progress_pct": 100.0, "notifications_required": 30,
    "notifications_issued": 30, "notifications_pending": 0,
    "notification_progress_pct": 100.0, "parcels_total": 200, "parcels_disputed": 0,
    "ownership_conflicts_pending": 0, "ownership_conflicts_resolved": 10,
    "rr_families_required": 200, "rr_families_completed": 198,
    "rr_families_pending": 2, "rr_progress_pct": 99.0,
    "land_required_for_possession": 500, "land_acquired_for_possession": 490,
    "possession_progress_pct": 98.0, "stakeholder_requests_raised": 20,
    "stakeholder_responses_received": 20, "stakeholder_requests_pending": 0,
    "average_response_time_days": 3, "departments_involved": 3,
    "coordination_requests_raised": 15, "coordination_requests_resolved": 15,
    "coordination_requests_pending": 0, "average_coordination_response_days": 2,
    "days_in_current_stage": 10, "total_project_days": 300,
}

PROFILE_HIGH_RISK = {
    "project_type": "MINING", "current_stage": "Initial Assessment / SIA",
    "land_area": 2000.0, "affected_families": 5000,
    "approvals_required": 30, "approvals_completed": 2, "approvals_pending": 28,
    "approval_progress_pct": 6.7, "oldest_pending_approval_days": 180,
    "legal_cases_total": 50, "legal_cases_pending": 45, "legal_cases_resolved": 5,
    "disputed_land_area": 500.0, "oldest_pending_case_days": 365,
    "compensation_total_amount": 2000000, "compensation_paid_amount": 50000,
    "compensation_pending_amount": 1950000, "beneficiaries_eligible": 5000,
    "beneficiaries_compensated": 100, "beneficiaries_pending": 4900,
    "compensation_progress_pct": 2.5, "documents_required": 200,
    "documents_submitted": 20, "documents_verified": 5, "documents_incomplete": 180,
    "documentation_progress_pct": 2.5, "notifications_required": 100,
    "notifications_issued": 5, "notifications_pending": 95,
    "notification_progress_pct": 5.0, "parcels_total": 1000, "parcels_disputed": 300,
    "ownership_conflicts_pending": 200, "ownership_conflicts_resolved": 10,
    "rr_families_required": 1000, "rr_families_completed": 10,
    "rr_families_pending": 990, "rr_progress_pct": 1.0,
    "land_required_for_possession": 2000, "land_acquired_for_possession": 50,
    "possession_progress_pct": 2.5, "stakeholder_requests_raised": 100,
    "stakeholder_responses_received": 5, "stakeholder_requests_pending": 95,
    "average_response_time_days": 90, "departments_involved": 10,
    "coordination_requests_raised": 80, "coordination_requests_resolved": 5,
    "coordination_requests_pending": 75, "average_coordination_response_days": 60,
    "days_in_current_stage": 400, "total_project_days": 400,
}

PROFILE_MID_RISK = {
    "project_type": "IRRIGATION", "current_stage": "Compensation Disbursement",
    "land_area": 300.0, "affected_families": 500,
    "approvals_required": 15, "approvals_completed": 10, "approvals_pending": 5,
    "approval_progress_pct": 66.7, "oldest_pending_approval_days": 30,
    "legal_cases_total": 10, "legal_cases_pending": 4, "legal_cases_resolved": 6,
    "disputed_land_area": 50.0, "oldest_pending_case_days": 60,
    "compensation_total_amount": 300000, "compensation_paid_amount": 180000,
    "compensation_pending_amount": 120000, "beneficiaries_eligible": 500,
    "beneficiaries_compensated": 300, "beneficiaries_pending": 200,
    "compensation_progress_pct": 60.0, "documents_required": 80,
    "documents_submitted": 60, "documents_verified": 40, "documents_incomplete": 20,
    "documentation_progress_pct": 50.0, "notifications_required": 40,
    "notifications_issued": 25, "notifications_pending": 15,
    "notification_progress_pct": 62.5, "parcels_total": 300, "parcels_disputed": 30,
    "ownership_conflicts_pending": 15, "ownership_conflicts_resolved": 20,
    "rr_families_required": 100, "rr_families_completed": 50,
    "rr_families_pending": 50, "rr_progress_pct": 50.0,
    "land_required_for_possession": 300, "land_acquired_for_possession": 150,
    "possession_progress_pct": 50.0, "stakeholder_requests_raised": 30,
    "stakeholder_responses_received": 20, "stakeholder_requests_pending": 10,
    "average_response_time_days": 15, "departments_involved": 5,
    "coordination_requests_raised": 25, "coordination_requests_resolved": 15,
    "coordination_requests_pending": 10, "average_coordination_response_days": 12,
    "days_in_current_stage": 90, "total_project_days": 600,
}


def test_models_loaded(svc):
    assert svc._loaded
    assert svc.classifier is not None
    assert svc.calibrated_classifier is not None
    assert svc.feature_columns is not None
    assert len(svc.feature_columns) == 60


def test_calibration_validation_detects_degenerate(svc):
    n_cols = len(svc.feature_columns)
    sentinels = np.array([np.zeros(n_cols), np.full(n_cols, 0.5), np.full(n_cols, 1.0)], dtype="float64")
    X_sent = pd.DataFrame(sentinels, columns=svc.feature_columns)
    cal_probs = svc.calibrated_classifier.predict_proba(X_sent)[:, 1]
    variance = float(np.var(cal_probs))
    if variance < 0.01:
        assert not svc._use_calibrated, f"Degenerate calibration (var={variance:.6f}) not detected"
    else:
        assert svc._use_calibrated


def test_predictions_differ_across_profiles(svc):
    r_low = svc.predict(PROFILE_LOW_RISK)
    r_high = svc.predict(PROFILE_HIGH_RISK)
    r_mid = svc.predict(PROFILE_MID_RISK)
    probs = [r_low["delay_probability"], r_high["delay_probability"], r_mid["delay_probability"]]
    assert len(set(probs)) == 3, f"All 3 projects returned same probability: {probs}"


def test_prediction_output_range(svc):
    for p in [PROFILE_LOW_RISK, PROFILE_HIGH_RISK, PROFILE_MID_RISK]:
        r = svc.predict(p)
        assert 0.0 <= r["delay_probability"] <= 1.0


def test_risk_ordering(svc):
    r_low = svc.predict(PROFILE_LOW_RISK)
    r_high = svc.predict(PROFILE_HIGH_RISK)
    assert r_low["delay_probability"] < r_high["delay_probability"], (
        f"low={r_low['delay_probability']} should < high={r_high['delay_probability']}"
    )


def test_risk_category_valid(svc):
    valid = {"LOW", "MEDIUM", "HIGH", "CRITICAL"}
    for p in [PROFILE_LOW_RISK, PROFILE_HIGH_RISK, PROFILE_MID_RISK]:
        r = svc.predict(p)
        assert r["risk_category"] in valid


def test_feature_vector_length(svc):
    fv = svc._build_feature_vector(PROFILE_MID_RISK)
    assert len(fv) == len(svc.feature_columns)


def test_feature_vector_no_none(svc):
    fv = svc._build_feature_vector(PROFILE_HIGH_RISK)
    assert all(v is not None for v in fv)
    assert all(isinstance(v, (int, float)) for v in fv)
