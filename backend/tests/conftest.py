"""
Bhumi Prajna - Test Fixtures (conftest.py)
Uses real HTTP against the live dev server (localhost:8000).
This avoids asyncpg event-loop conflicts when using ASGITransport.
"""

import pytest
import pytest_asyncio
import httpx

BASE_URL = "http://localhost:8000/api/v1"
ADMIN_EMAIL = "admin@pravaah.gov.in"
ADMIN_PASSWORD = "Pravaah@2026"
DISTRICT_EMAIL = "district.pune@pravaah.gov.in"
DISTRICT_PASSWORD = "Pravaah@2026"


@pytest_asyncio.fixture
async def client():
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=30.0) as c:
        yield c


@pytest_asyncio.fixture
async def admin_headers(client: httpx.AsyncClient):
    resp = await client.post("/auth/login", json={
        "email": ADMIN_EMAIL, "password": ADMIN_PASSWORD,
    })
    assert resp.status_code == 200, f"Admin login failed: {resp.text}"
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


@pytest_asyncio.fixture
async def district_headers(client: httpx.AsyncClient):
    resp = await client.post("/auth/login", json={
        "email": DISTRICT_EMAIL, "password": DISTRICT_PASSWORD,
    })
    if resp.status_code != 200:
        pytest.skip("District officer seed user not present")
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}
