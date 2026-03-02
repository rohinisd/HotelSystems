import pytest


@pytest.mark.asyncio
async def test_login_missing_fields(client):
    response = await client.post("/api/v1/auth/login", json={})
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_register_missing_fields(client):
    response = await client.post("/api/v1/auth/register", json={})
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_register_short_password(client):
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": "test@test.com", "password": "abc", "full_name": "Test"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_me_unauthorized(client):
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 403
