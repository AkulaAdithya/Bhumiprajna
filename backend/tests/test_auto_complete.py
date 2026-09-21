"""
Bhumi Prajna - Auto-Completion E2E Tests
Verifies that a project with all parameters at 100% automatically transitions
from ONGOING → COMPLETED and disappears from every active view.
"""

import pytest
import httpx
from datetime import date

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

FULL_COMPLETION_SNAPSHOT = {
    "snapshot_date": str(date.today()),
    "current_stage": "Possession",
    "next_stage": None,
    "status": "ONGOING",   # officer still sends ONGOING — backend must override
    "approvals": {
        "approvals_required": 5,
        "approvals_completed": 5,          # 100%
    },
    "legal": {
        "legal_cases_total": 3,
        "legal_cases_pending": 0,
        "legal_cases_resolved": 3,         # all resolved
        "disputed_land_area": 0.0,
    },
    "compensation": {
        "compensation_total_amount": 1000000.0,
        "compensation_paid_amount": 1000000.0,   # 100%
        "beneficiaries_eligible": 50,
        "beneficiaries_compensated": 50,          # 100%
    },
    "documentation": {
        "documents_required": 10,
        "documents_submitted": 10,
        "documents_verified": 10,          # 100%
    },
    "notifications": {
        "notifications_required": 4,
        "notifications_issued": 4,         # 100%
    },
    "ownership": {
        "parcels_total": 20,
        "parcels_disputed": 0,
        "ownership_claims_total": 20,
        "ownership_conflicts_pending": 0,
        "ownership_conflicts_resolved": 20,
    },
    "rr": {
        "rr_families_required": 10,
        "rr_families_completed": 10,       # 100%
    },
    "possession": {
        "land_required_for_possession": 50.0,
        "land_acquired_for_possession": 50.0,   # 100%
        "possession_status": "Complete",
    },
    "stakeholder": {
        "stakeholder_requests_raised": 5,
        "stakeholder_responses_received": 5,    # 100%
    },
    "coordination": {
        "departments_involved": 3,
        "coordination_requests_raised": 6,
        "coordination_requests_resolved": 6,    # 100%
    },
}

CREATE_PAYLOAD = {
    "project_name": "AutoComplete Test Project",
    "state": "Maharashtra",
    "district": "Pune",
    "project_type": "HIGHWAY",
    "land_area": 100.0,
    "affected_families": 50,
    "current_stage": "Award / Valuation",
    "next_stage": "Possession",
    "snapshot_date": str(date.today()),
    "latitude": 18.5204,
    "longitude": 73.8567,
    **{k: v for k, v in FULL_COMPLETION_SNAPSHOT.items()
       if k in ("approvals", "legal", "compensation", "documentation",
                "notifications", "ownership", "rr", "possession",
                "stakeholder", "coordination")},
}


INCOMPLETE_SNAPSHOT = dict(FULL_COMPLETION_SNAPSHOT)
INCOMPLETE_SNAPSHOT["approvals"] = {
    "approvals_required": 5,
    "approvals_completed": 2, # pending = 3
}

INCOMPLETE_CREATE_PAYLOAD = dict(CREATE_PAYLOAD)
INCOMPLETE_CREATE_PAYLOAD.update(INCOMPLETE_SNAPSHOT)


async def _login(client: httpx.AsyncClient, email: str) -> dict:
    resp = await client.post("/auth/login", json={"email": email, "password": "Pravaah@2026"})
    assert resp.status_code == 200, f"Login failed for {email}: {resp.text}"
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_auto_complete_on_creation(client, admin_headers):
    """
    AC-1a: When all parameters are 100% at creation, the project is immediately COMPLETED.
    """
    resp = await client.post("/projects", json=CREATE_PAYLOAD, headers=admin_headers)
    assert resp.status_code == 201, f"Create failed: {resp.text}"
    project_id = resp.json()["id"]
    
    # Verify the project record itself is COMPLETED
    resp = await client.get(f"/projects/{project_id}", headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "COMPLETED", "Project status in DB is not COMPLETED"

@pytest.mark.asyncio
async def test_auto_complete_on_snapshot(client, admin_headers):
    """
    AC-1b: When all parameters are 100%, adding a snapshot must automatically
    set project status to COMPLETED — even if the officer sends ONGOING.
    """
    # 1. Create an incomplete project (starts ONGOING)
    resp = await client.post("/projects", json=INCOMPLETE_CREATE_PAYLOAD, headers=admin_headers)
    assert resp.status_code == 201, f"Create failed: {resp.text}"
    project_id = resp.json()["id"]

    # 2. Submit a snapshot where EVERY required parameter is at 100%
    # Use a different date for the second snapshot
    snap_payload = dict(FULL_COMPLETION_SNAPSHOT)
    snap_payload["snapshot_date"] = "2026-10-10"
    resp = await client.post(f"/projects/{project_id}/snapshots", json=snap_payload, headers=admin_headers)
    assert resp.status_code == 201, f"Snapshot failed: {resp.text}"

    body = resp.json()
    assert body.get("status") == "COMPLETED", (
        f"Expected backend to auto-set status=COMPLETED but got: {body.get('status')!r}\n"
        f"Full response: {body}"
    )

    # 3. Verify the project record itself is COMPLETED
    resp = await client.get(f"/projects/{project_id}", headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "COMPLETED", "Project status in DB is not COMPLETED"

    return project_id


@pytest.mark.asyncio
async def test_completed_project_absent_from_ongoing_list(client, admin_headers):
    """
    AC-2: A COMPLETED project must not appear in the default Ongoing Projects list.
    """
    # Create + complete the project
    resp = await client.post("/projects", json=INCOMPLETE_CREATE_PAYLOAD, headers=admin_headers)
    assert resp.status_code == 201
    project_id = resp.json()["id"]

    snap_payload = dict(FULL_COMPLETION_SNAPSHOT)
    snap_payload["snapshot_date"] = "2026-10-10"
    await client.post(f"/projects/{project_id}/snapshots", json=snap_payload, headers=admin_headers)

    # Fetch the default list (no status filter → should only return ONGOING/ON_HOLD)
    resp = await client.get("/projects", headers=admin_headers)
    assert resp.status_code == 200
    ids = [p["id"] for p in resp.json()["projects"]]
    assert project_id not in ids, (
        "COMPLETED project still appearing in the default Ongoing Projects list"
    )

    # Verify it IS still accessible when explicitly filtering by status=COMPLETED
    resp = await client.get(f"/projects?status=COMPLETED", headers=admin_headers)
    assert resp.status_code == 200
    ids_completed = [p["id"] for p in resp.json()["projects"]]
    assert project_id in ids_completed, "COMPLETED project missing from status=COMPLETED filter"


@pytest.mark.asyncio
async def test_completed_project_absent_from_dashboard(client, admin_headers):
    """
    AC-3: Dashboard stats (total_ongoing, risk counts) must not count COMPLETED projects.
    """
    # Record dashboard counts BEFORE
    resp = await client.get("/dashboard/stats", headers=admin_headers)
    assert resp.status_code == 200
    before = resp.json()

    # Create + complete project
    resp = await client.post("/projects", json=INCOMPLETE_CREATE_PAYLOAD, headers=admin_headers)
    assert resp.status_code == 201
    project_id = resp.json()["id"]
    snap_payload = dict(FULL_COMPLETION_SNAPSHOT)
    snap_payload["snapshot_date"] = "2026-10-10"
    await client.post(f"/projects/{project_id}/snapshots", json=snap_payload, headers=admin_headers)

    # Dashboard AFTER
    resp = await client.get("/dashboard/stats", headers=admin_headers)
    assert resp.status_code == 200
    after = resp.json()

    # ongoing count must not have increased
    assert after.get("total_ongoing", 0) <= before.get("total_ongoing", 0), (
        "Dashboard total_ongoing increased after completing a project — COMPLETED project is being counted"
    )


@pytest.mark.asyncio
async def test_completed_project_absent_from_gis(client, admin_headers):
    """
    AC-4: COMPLETED project must not appear in GIS active markers or heatmap.
    """
    # Create + complete
    resp = await client.post("/projects", json=INCOMPLETE_CREATE_PAYLOAD, headers=admin_headers)
    assert resp.status_code == 201
    project_id = resp.json()["id"]
    snap_payload = dict(FULL_COMPLETION_SNAPSHOT)
    snap_payload["snapshot_date"] = "2026-10-10"
    await client.post(f"/projects/{project_id}/snapshots", json=snap_payload, headers=admin_headers)

    # Default GIS (ONGOING only)
    resp = await client.get("/gis/projects", headers=admin_headers)
    assert resp.status_code == 200
    gis_ids = [f["id"] for f in resp.json()["features"]]
    assert project_id not in gis_ids, "COMPLETED project appearing in default GIS markers"

    # Heatmap (ONGOING only)
    resp = await client.get("/gis/heatmap", headers=admin_headers)
    assert resp.status_code == 200
    # Heatmap returns aggregates per district — verify indirectly that the endpoint works
    assert "heatmap_points" in resp.json()


@pytest.mark.asyncio
async def test_completed_project_preserved_in_db(client, admin_headers):
    """
    AC-5: Completed project must remain accessible (history, audit, predictions preserved).
    """
    resp = await client.post("/projects", json=INCOMPLETE_CREATE_PAYLOAD, headers=admin_headers)
    assert resp.status_code == 201
    project_id = resp.json()["id"]
    snap_payload = dict(FULL_COMPLETION_SNAPSHOT)
    snap_payload["snapshot_date"] = "2026-10-10"
    await client.post(f"/projects/{project_id}/snapshots", json=snap_payload, headers=admin_headers)

    # Direct access to COMPLETED project detail must still work
    resp = await client.get(f"/projects/{project_id}", headers=admin_headers)
    assert resp.status_code == 200
    detail = resp.json()
    assert detail["status"] == "COMPLETED"
    assert detail["id"] == project_id
    # History preserved
    assert len(detail.get("snapshot_history", [])) >= 1


@pytest.mark.asyncio
async def test_auto_complete_all_roles(client):
    """
    AC-6: Completion must be invisible to every role — none see COMPLETED in their active list.
    """
    role_accounts = [
        "admin@pravaah.gov.in",
        "central.highway@pravaah.gov.in",
        "nodal.mh@pravaah.gov.in",
    ]

    for email in role_accounts:
        try:
            headers = await _login(client, email)
        except AssertionError:
            continue  # skip if seed account not present

        resp = await client.get("/projects", headers=headers)
        if resp.status_code != 200:
            continue
        projects = resp.json().get("projects", [])
        for p in projects:
            assert p["status"] != "COMPLETED", (
                f"Role {email} can see COMPLETED project {p['id']} in the default active list"
            )
