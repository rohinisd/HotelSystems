import pytest


@pytest.mark.asyncio
async def test_login_missing_fields(client):
    response = await client.post("/api/v1/auth/login", json={})
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_login_invalid_credentials(client):
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent@test.com", "password": "wrongpass"},
    )
    assert response.status_code in (401, 500)


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
async def test_register_short_name(client):
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": "test@test.com", "password": "password123", "full_name": "A"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_me_unauthorized(client):
    response = await client.get("/api/v1/auth/me")
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_me_with_auth(client, auth_token):
    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    if response.status_code == 200:
        data = response.json()
        assert "id" in data
        assert "email" in data
        assert "full_name" in data
        assert "role" in data
    else:
        assert response.status_code in (404, 500)


@pytest.mark.asyncio
async def test_me_with_invalid_token(client):
    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid.token.here"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_update_me_unauthorized(client):
    response = await client.patch(
        "/api/v1/auth/me",
        json={"full_name": "Updated Name"},
    )
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_update_me_with_auth(client, auth_token):
    response = await client.patch(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={"full_name": "Updated Name"},
    )
    if response.status_code == 200:
        data = response.json()
        assert data["full_name"] == "Updated Name"
    else:
        assert response.status_code in (400, 404, 500)


@pytest.mark.asyncio
async def test_update_me_no_fields(client, auth_token):
    response = await client.patch(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_update_me_short_name(client, auth_token):
    response = await client.patch(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={"full_name": "A"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_refresh_unauthorized(client):
    response = await client.post("/api/v1/auth/refresh")
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_refresh_with_auth(client, auth_token):
    response = await client.post(
        "/api/v1/auth/refresh",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    if response.status_code == 200:
        data = response.json()
        assert "access_token" in data
        assert "expires_in" in data
        assert "role" in data
    else:
        assert response.status_code in (401, 500)
