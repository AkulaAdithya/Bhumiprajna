"""
Pravaah - RBAC Tests (M6)
All routes use the real live server at localhost:8000 via BASE_URL in conftest.
"""

import pytest
import httpx


@pytest.mark.asyncio
async def test_admin_users_blocked_for_district(client: httpx.AsyncClient, district_headers: dict):
    """District officer must NOT access admin user management."""
    resp = await client.get("/admin/users", headers=district_headers)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_admin_can_list_users(client: httpx.AsyncClient, admin_headers: dict):
    """ADMIN can list all users."""
    resp = await client.get("/admin/users", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "users" in data
    assert isinstance(data["users"], list)
    assert data["total"] >= 1


@pytest.mark.asyncio
async def test_audit_blocked_for_district(client: httpx.AsyncClient, district_headers: dict):
    """District officer must NOT access audit trail."""
    resp = await client.get("/audit", headers=district_headers)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_admin_can_read_audit(client: httpx.AsyncClient, admin_headers: dict):
    """ADMIN can read audit trail."""
    resp = await client.get("/audit", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "logs" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_stale_check_blocked_for_district(client: httpx.AsyncClient, district_headers: dict):
    """District officer must NOT trigger stale data check."""
    resp = await client.post("/models/stale-check", headers=district_headers)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_admin_can_trigger_stale_check(client: httpx.AsyncClient, admin_headers: dict):
    """ADMIN can trigger stale-data check."""
    resp = await client.post("/models/stale-check", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "projects_checked" in data
    assert "notifications_created" in data


@pytest.mark.asyncio
async def test_model_approve_blocked_for_district(client: httpx.AsyncClient, district_headers: dict):
    """District officer must NOT approve model versions."""
    resp = await client.post("/models/v1.0.0/approve", headers=district_headers)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_projects_accessible_to_all_roles(client: httpx.AsyncClient, admin_headers: dict, district_headers: dict):
    """Both admin and district officers can list projects."""
    resp_admin = await client.get("/projects", headers=admin_headers)
    assert resp_admin.status_code == 200

    resp_dist = await client.get("/projects", headers=district_headers)
    assert resp_dist.status_code == 200


@pytest.mark.asyncio
async def test_dashboard_accessible_to_all_roles(client: httpx.AsyncClient, admin_headers: dict, district_headers: dict):
    """Dashboard KPIs accessible to all authenticated roles."""
    for headers in [admin_headers, district_headers]:
        resp = await client.get("/dashboard/stats", headers=headers)
        assert resp.status_code == 200


@pytest.mark.asyncio
async def test_geographic_scope_admin_sees_all(client: httpx.AsyncClient, admin_headers: dict, district_headers: dict):
    """Admin sees all projects; district user sees only their scoped projects."""
    admin_resp = await client.get("/projects", headers=admin_headers)
    dist_resp = await client.get("/projects", headers=district_headers)
    admin_count = admin_resp.json()["total"]
    dist_count = dist_resp.json()["total"]
    # District user cannot see MORE projects than admin
    assert dist_count <= admin_count
