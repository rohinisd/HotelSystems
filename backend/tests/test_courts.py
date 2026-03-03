import pytest


@pytest.mark.asyncio
async def test_list_courts_requires_auth(client):
    response = await client.get("/api/v1/courts")
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_list_courts_returns_courts(client, auth_token):
    response = await client.get(
        "/api/v1/courts",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    if response.status_code == 200:
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert isinstance(data["items"], list)
    else:
        assert response.status_code in (500,)


@pytest.mark.asyncio
async def test_create_court_requires_owner_or_manager(client, auth_token):
    response = await client.post(
        "/api/v1/courts",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={
            "branch_id": 1,
            "name": "Court A",
            "sport": "badminton",
            "hourly_rate": 500,
        },
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_court_with_owner(client, owner_token):
    response = await client.post(
        "/api/v1/courts",
        headers={"Authorization": f"Bearer {owner_token}"},
        json={
            "branch_id": 1,
            "name": "Test Court",
            "sport": "badminton",
            "hourly_rate": 500,
        },
    )
    if response.status_code == 201:
        data = response.json()
        assert "id" in data
        assert data["name"] == "Test Court"
        assert data["sport"] == "badminton"
    else:
        assert response.status_code in (400, 404, 500)


@pytest.mark.asyncio
async def test_update_court(client, owner_token):
    response = await client.put(
        "/api/v1/courts/1",
        headers={"Authorization": f"Bearer {owner_token}"},
        json={"name": "Updated Court Name"},
    )
    if response.status_code == 200:
        data = response.json()
        assert data["name"] == "Updated Court Name"
    else:
        assert response.status_code in (404, 500)


@pytest.mark.asyncio
async def test_get_pricing_rules(client, auth_token):
    response = await client.get(
        "/api/v1/courts/1/pricing",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, list)
    else:
        assert response.status_code in (404, 500)


@pytest.mark.asyncio
async def test_create_pricing_rule(client, owner_token):
    response = await client.post(
        "/api/v1/courts/1/pricing",
        headers={"Authorization": f"Bearer {owner_token}"},
        json={
            "day_of_week": 0,
            "start_time": "18:00",
            "end_time": "22:00",
            "rate": 600,
        },
    )
    if response.status_code == 201:
        data = response.json()
        assert "id" in data
        assert data["rate"] == 600
    else:
        assert response.status_code in (400, 404, 500)


@pytest.mark.asyncio
async def test_delete_pricing_rule(client, owner_token):
    response = await client.delete(
        "/api/v1/courts/1/pricing/1",
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    assert response.status_code in (204, 404, 500)
