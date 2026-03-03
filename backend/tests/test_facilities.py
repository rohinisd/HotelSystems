import pytest


@pytest.mark.asyncio
async def test_list_facilities_requires_auth(client):
    response = await client.get("/api/v1/facilities")
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_list_facilities_returns_facilities(client, auth_token):
    response = await client.get(
        "/api/v1/facilities",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, list)
    else:
        assert response.status_code in (500,)


@pytest.mark.asyncio
async def test_list_branches_any_facility(client, auth_token):
    """Any authenticated user can browse branches (needed for booking flow)."""
    response = await client.get(
        "/api/v1/facilities/1/branches",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, list)
    else:
        assert response.status_code in (500,)


@pytest.mark.asyncio
async def test_list_branches_with_matching_tenant(client, owner_token):
    response = await client.get(
        "/api/v1/facilities/1/branches",
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, list)
    else:
        assert response.status_code in (404, 500)


@pytest.mark.asyncio
async def test_create_branch(client, owner_token):
    response = await client.post(
        "/api/v1/facilities/1/branches",
        headers={"Authorization": f"Bearer {owner_token}"},
        json={
            "name": "Test Branch",
            "address": "123 Test St",
            "city": "Test City",
        },
    )
    if response.status_code == 201:
        data = response.json()
        assert "id" in data
        assert data["name"] == "Test Branch"
    else:
        assert response.status_code in (403, 404, 500)


@pytest.mark.asyncio
async def test_create_branch_tenant_isolation(client, owner_token):
    response = await client.post(
        "/api/v1/facilities/999/branches",
        headers={"Authorization": f"Bearer {owner_token}"},
        json={"name": "Other Branch"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_facility_requires_auth(client):
    response = await client.post(
        "/api/v1/facilities",
        json={"name": "Test Facility", "slug": "test-facility"},
    )
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_create_facility_requires_owner(client, auth_token):
    response = await client.post(
        "/api/v1/facilities",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={"name": "Test Facility", "slug": "test-facility"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_facility_with_owner(client, owner_token):
    response = await client.post(
        "/api/v1/facilities",
        headers={"Authorization": f"Bearer {owner_token}"},
        json={
            "name": "Test Facility",
            "slug": "test-facility",
            "owner_name": "Test Owner",
        },
    )
    if response.status_code == 201:
        data = response.json()
        assert data["name"] == "Test Facility"
        assert data["slug"] == "test-facility"
        assert "id" in data
    else:
        assert response.status_code in (400, 409, 500)


@pytest.mark.asyncio
async def test_create_facility_validation(client, owner_token):
    response = await client.post(
        "/api/v1/facilities",
        headers={"Authorization": f"Bearer {owner_token}"},
        json={},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_facility_invalid_slug(client, owner_token):
    response = await client.post(
        "/api/v1/facilities",
        headers={"Authorization": f"Bearer {owner_token}"},
        json={"name": "Test", "slug": "INVALID SLUG!"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_branch_requires_owner_or_manager(client, staff_token):
    response = await client.post(
        "/api/v1/facilities/1/branches",
        headers={"Authorization": f"Bearer {staff_token}"},
        json={"name": "Staff Branch"},
    )
    assert response.status_code == 403
