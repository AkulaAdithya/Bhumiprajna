"""
Bhūmi Prājñā - Prediction Pipeline Tests (M6)
Tests: prediction output validity, no data leakage, alerts, analytics, GIS.
Uses live server at localhost:8000.
"""

import pytest
import httpx
import time

SNAPSHOT_PAYLOAD = {
    "snapshot_date": "2025-06-01",
    "current_stage": "Notification",
    "status": "ONGOING",
    "approvals": {"approvals_required": 10, "approvals_completed": 5},
    "legal": {"legal_cases_total": 3, "legal_cases_resolved": 1, "disputed_land_area": 5.0},
    "compensation": {
        "compensation_total_amount": 1000,
        "compensation_paid_amount": 400,
        "beneficiaries_eligible": 500,
        "beneficiaries_compensated": 200,
    },
    "documentation": {
        "documents_required": 20, "documents_submitted": 10, "documents_verified": 5,
    },
    "notifications": {"notifications_required": 8, "notifications_issued": 4},
    "ownership": {
        "parcels_total": 100, "parcels_disputed": 5,
        "ownership_claims_total": 110,
        "ownership_conflicts_pending": 3,
        "ownership_conflicts_resolved": 7,
    },
    "rr": {"rr_families_required": 150, "rr_families_completed": 50},
    "possession": {"land_required_for_possession": 200, "land_acquired_for_possession": 80},
    "stakeholder": {"stakeholder_requests_raised": 15, "stakeholder_responses_received": 6},
    "coordination": {
        "departments_involved": 4,
        "coordination_requests_raised": 10,
        "coordination_requests_resolved": 4,
    },
}


@pytest.mark.asyncio
async def test_project_creation_returns_prediction(client: httpx.AsyncClient, admin_headers: dict):
    """Creating a project must return valid risk_category and delay_probability."""
    payload = {
        "project_name": f"Test Pipeline M6 {int(time.time())}",
        "project_code": f"M6-TST-{int(time.time())}",
        "project_type": "HIGHWAY",  # valid enum value
        "state": "Maharashtra",
        "district": "Pune",
        "land_area": 120.0,
        "affected_families": 350,
        **SNAPSHOT_PAYLOAD,
    }
    resp = await client.post("/projects", json=payload, headers=admin_headers)
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["risk_category"] in ("LOW", "MEDIUM", "HIGH", "CRITICAL")
    assert 0.0 <= data["delay_probability"] <= 1.0
    assert "id" in data  # response key is 'id' not 'project_id'


@pytest.mark.asyncio
async def test_prediction_probability_range(client: httpx.AsyncClient, admin_headers: dict):
    """All existing projects must have delay_probability in [0, 1]."""
    resp = await client.get("/projects", headers=admin_headers)
    assert resp.status_code == 200
    for p in resp.json()["projects"]:
        dp = p.get("delay_probability")
        if dp is not None:
            assert 0.0 <= dp <= 1.0, f"Invalid probability {dp} for project {p['id']}"


@pytest.mark.asyncio
async def test_on_demand_prediction(client: httpx.AsyncClient, admin_headers: dict):
    """On-demand re-prediction must return valid output."""
    projects_resp = await client.get("/projects", headers=admin_headers)
    project_id = projects_resp.json()["projects"][0]["id"]

    resp = await client.post(f"/projects/{project_id}/predict", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["risk_category"] in ("LOW", "MEDIUM", "HIGH", "CRITICAL")
    assert 0.0 <= data["delay_probability"] <= 1.0
    assert "top_factors" in data


@pytest.mark.asyncio
async def test_no_data_leakage_in_prediction_factors(client: httpx.AsyncClient, admin_headers: dict):
    """Top prediction factors must not include any target or date leakage features."""
    projects_resp = await client.get("/projects", headers=admin_headers)
    project_id = projects_resp.json()["projects"][0]["id"]

    resp = await client.post(f"/projects/{project_id}/predict", headers=admin_headers)
    assert resp.status_code == 200
    factors = resp.json().get("top_factors", [])

    forbidden = {"snapshot_date", "delay_probability", "is_delayed", "risk_category", "label"}
    factor_names = {f.get("feature", "").lower() for f in factors}
    leaked = forbidden & factor_names
    assert not leaked, f"Data leakage detected in top_factors: {leaked}"


@pytest.mark.asyncio
async def test_snapshot_creates_audit_log(client: httpx.AsyncClient, admin_headers: dict):
    """Posting a snapshot must create a SNAPSHOT_ADDED audit log entry."""
    projects_resp = await client.get("/projects", headers=admin_headers)
    project_id = projects_resp.json()["projects"][0]["id"]

    from datetime import date, timedelta
    # Use a snapshot date far in the past + unique offset to avoid uniqueness conflicts
    snap_date = (date(2020, 1, 1) + timedelta(days=int(time.time()) % 3000)).isoformat()
    payload = {**SNAPSHOT_PAYLOAD, "snapshot_date": snap_date}
    resp = await client.post(
        f"/projects/{project_id}/snapshots",
        json=payload,
        headers=admin_headers,
    )
    # Snapshot endpoint returns 201
    assert resp.status_code == 201, resp.text
    assert resp.json()["risk_category"] in ("LOW", "MEDIUM", "HIGH", "CRITICAL")

    audit_resp = await client.get("/audit", headers=admin_headers)
    actions = [log["action"] for log in audit_resp.json()["logs"]]
    assert "SNAPSHOT_ADDED" in actions


@pytest.mark.asyncio
async def test_analytics_overview_shape(client: httpx.AsyncClient, admin_headers: dict):
    """Analytics overview must return expected structure."""
    resp = await client.get("/analytics/overview", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "total_ongoing" in data
    assert "risk_distribution" in data
    assert set(data["risk_distribution"].keys()) == {"CRITICAL", "HIGH", "MEDIUM", "LOW", "NO_PREDICTION"}
    assert "stage_distribution" in data
    assert "state_comparison" in data


@pytest.mark.asyncio
async def test_analytics_trends_shape(client: httpx.AsyncClient, admin_headers: dict):
    """Analytics trends must return weekly_trends list."""
    resp = await client.get("/analytics/trends?days=90", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "weekly_trends" in data
    assert isinstance(data["weekly_trends"], list)
    for w in data["weekly_trends"]:
        assert "week_start" in w
        assert "avg_delay_probability" in w


@pytest.mark.asyncio
async def test_gis_projects_valid_coords(client: httpx.AsyncClient, admin_headers: dict):
    """GIS projects must have valid lat/lon and risk categories."""
    resp = await client.get("/gis/projects", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "features" in data
    for feat in data["features"]:
        assert -90 <= feat["lat"] <= 90
        assert -180 <= feat["lon"] <= 180
        assert feat["risk_category"] in ("LOW", "MEDIUM", "HIGH", "CRITICAL", "NO_PREDICTION")


@pytest.mark.asyncio
async def test_gis_heatmap_intensity(client: httpx.AsyncClient, admin_headers: dict):
    """GIS heatmap intensity must be in [0, 1]."""
    resp = await client.get("/gis/heatmap", headers=admin_headers)
    assert resp.status_code == 200
    for pt in resp.json()["heatmap_points"]:
        assert 0.0 <= pt["risk_intensity"] <= 1.0


@pytest.mark.asyncio
async def test_model_versions_have_metrics(client: httpx.AsyncClient, admin_headers: dict):
    """Model versions endpoint must have metrics with pr_auc."""
    resp = await client.get("/models", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1
    assert data["active_version"] is not None
    assert data["versions"][0]["metrics"]["pr_auc"] is not None


@pytest.mark.asyncio
async def test_notifications_endpoint(client: httpx.AsyncClient, admin_headers: dict):
    """Notifications endpoint must return total and unread counts."""
    resp = await client.get("/notifications", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "total" in data
    assert "unread" in data
    assert "notifications" in data
    assert isinstance(data["notifications"], list)
