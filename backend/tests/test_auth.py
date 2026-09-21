"""
Bhumi Prajna - Auth Tests (M6)
Tests: login, bad credentials, JWT tamper, unauthenticated access, /me endpoint.
Runs against the live dev server at localhost:8000.
"""

import pytest
import httpx


@pytest.mark.asyncio
async def test_health(client: httpx.AsyncClient):
    resp = await client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert data["app"] == "Bhumi Prajna"


@pytest.mark.asyncio
async def test_login_success(client: httpx.AsyncClient):
    resp = await client.post("/auth/login", json={
        "email": "admin@pravaah.gov.in",
        "password": "Pravaah@2026",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["role"] == "ADMIN"


@pytest.mark.asyncio
async def test_login_wrong_password(client: httpx.AsyncClient):
    resp = await client.post("/auth/login", json={
        "email": "admin@pravaah.gov.in",
        "password": "wrongpassword",
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_login_unknown_email(client: httpx.AsyncClient):
    resp = await client.post("/auth/login", json={
        "email": "nobody@nowhere.com",
        "password": "anything",
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_protected_route_no_token(client: httpx.AsyncClient):
    """Unauthenticated access to protected route must return 401 or 403."""
    resp = await client.get("/projects")
    assert resp.status_code in (401, 403)


@pytest.mark.asyncio
async def test_protected_route_bad_token(client: httpx.AsyncClient):
    """Malformed token must return 401 or 403."""
    resp = await client.get("/projects", headers={
        "Authorization": "Bearer totally.invalid.token"
    })
    assert resp.status_code in (401, 403)


@pytest.mark.asyncio
async def test_me_endpoint(client: httpx.AsyncClient, admin_headers: dict):
    resp = await client.get("/auth/me", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "admin@pravaah.gov.in"
    assert data["role"] == "ADMIN"
    assert data["is_active"] is True


@pytest.mark.asyncio
async def test_security_headers_present(client: httpx.AsyncClient):
    """Security headers must be present on all responses."""
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert "x-content-type-options" in resp.headers
    assert resp.headers["x-content-type-options"] == "nosniff"
    assert "x-frame-options" in resp.headers
    assert resp.headers["x-frame-options"] == "DENY"
    assert "x-request-id" in resp.headers
