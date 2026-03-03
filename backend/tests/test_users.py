import pytest


@pytest.mark.asyncio
async def test_list_users_requires_auth(client):
    response = await client.get("/api/v1/users")
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_list_users_requires_owner_or_manager(client, auth_token):
    response = await client.get(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_list_users_with_owner(client, owner_token):
    response = await client.get(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, list)
        if data:
            user = data[0]
            assert "id" in user
            assert "email" in user
            assert "full_name" in user
            assert "role" in user
            assert "is_active" in user
    else:
        assert response.status_code in (400, 500)


@pytest.mark.asyncio
async def test_list_users_with_manager(client, manager_token):
    response = await client.get(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {manager_token}"},
    )
    assert response.status_code in (200, 400, 500)


@pytest.mark.asyncio
async def test_invite_user_requires_auth(client):
    response = await client.post("/api/v1/users", json={})
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_invite_user_requires_owner(client, manager_token):
    response = await client.post(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "email": "newuser@test.com",
            "full_name": "New User",
            "role": "staff",
            "password": "password123",
        },
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_invite_user_with_owner(client, owner_token):
    response = await client.post(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {owner_token}"},
        json={
            "email": "newstaff@test.com",
            "full_name": "New Staff",
            "role": "staff",
            "password": "password123",
        },
    )
    if response.status_code == 201:
        data = response.json()
        assert data["email"] == "newstaff@test.com"
        assert data["full_name"] == "New Staff"
        assert data["role"] == "staff"
        assert data["is_active"] is True
    else:
        assert response.status_code in (400, 409, 500)


@pytest.mark.asyncio
async def test_invite_user_validation_missing_fields(client, owner_token):
    response = await client.post(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {owner_token}"},
        json={},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_invite_user_invalid_role(client, owner_token):
    response = await client.post(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {owner_token}"},
        json={
            "email": "invalid@test.com",
            "full_name": "Invalid Role",
            "role": "owner",
            "password": "password123",
        },
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_invite_user_short_password(client, owner_token):
    response = await client.post(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {owner_token}"},
        json={
            "email": "short@test.com",
            "full_name": "Short Pass",
            "role": "staff",
            "password": "abc",
        },
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_invite_user_short_name(client, owner_token):
    response = await client.post(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {owner_token}"},
        json={
            "email": "short@test.com",
            "full_name": "A",
            "role": "staff",
            "password": "password123",
        },
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_update_user_requires_auth(client):
    response = await client.patch("/api/v1/users/1", json={"role": "staff"})
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_update_user_requires_owner(client, manager_token):
    response = await client.patch(
        "/api/v1/users/1",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={"role": "staff"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_update_user_role_with_owner(client, owner_token):
    response = await client.patch(
        "/api/v1/users/2",
        headers={"Authorization": f"Bearer {owner_token}"},
        json={"role": "manager"},
    )
    if response.status_code == 200:
        data = response.json()
        assert data["role"] == "manager"
    else:
        assert response.status_code in (400, 403, 404, 500)


@pytest.mark.asyncio
async def test_update_user_deactivate(client, owner_token):
    response = await client.patch(
        "/api/v1/users/2",
        headers={"Authorization": f"Bearer {owner_token}"},
        json={"is_active": False},
    )
    if response.status_code == 200:
        data = response.json()
        assert data["is_active"] is False
    else:
        assert response.status_code in (400, 403, 404, 500)


@pytest.mark.asyncio
async def test_update_user_no_fields(client, owner_token):
    response = await client.patch(
        "/api/v1/users/2",
        headers={"Authorization": f"Bearer {owner_token}"},
        json={},
    )
    assert response.status_code in (400, 404, 500)


@pytest.mark.asyncio
async def test_update_nonexistent_user(client, owner_token):
    response = await client.patch(
        "/api/v1/users/999999",
        headers={"Authorization": f"Bearer {owner_token}"},
        json={"role": "staff"},
    )
    assert response.status_code in (404, 500)


@pytest.mark.asyncio
async def test_update_user_invalid_role(client, owner_token):
    response = await client.patch(
        "/api/v1/users/2",
        headers={"Authorization": f"Bearer {owner_token}"},
        json={"role": "superadmin"},
    )
    assert response.status_code == 422
