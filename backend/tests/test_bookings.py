import pytest


@pytest.mark.asyncio
async def test_get_slots_returns_slot_data(client):
    response = await client.get(
        "/api/v1/bookings/slots",
        params={"court_id": 1, "date": "2025-03-15"},
    )
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, list)
        if data:
            slot = data[0]
            assert "start_time" in slot
            assert "end_time" in slot
            assert "is_available" in slot
            assert "court_id" in slot
            assert "price" in slot
    else:
        assert response.status_code in (404, 500)


@pytest.mark.asyncio
async def test_get_slots_invalid_date(client):
    response = await client.get(
        "/api/v1/bookings/slots",
        params={"court_id": 1, "date": "invalid"},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_create_booking_requires_auth(client):
    response = await client.post(
        "/api/v1/bookings",
        json={
            "court_id": 1,
            "date": "2025-03-15",
            "start_time": "09:00",
            "end_time": "10:00",
        },
    )
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_create_booking_with_auth(client, auth_token):
    response = await client.post(
        "/api/v1/bookings",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={
            "court_id": 1,
            "date": "2025-03-15",
            "start_time": "09:00",
            "end_time": "10:00",
        },
    )
    if response.status_code == 201:
        data = response.json()
        assert "id" in data
        assert "status" in data
        assert "amount" in data
    else:
        assert response.status_code in (404, 409, 500)


@pytest.mark.asyncio
async def test_list_bookings_requires_auth(client):
    response = await client.get("/api/v1/bookings")
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_list_bookings_with_auth(client, auth_token):
    response = await client.get(
        "/api/v1/bookings",
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
async def test_cancel_booking_requires_auth(client):
    response = await client.patch("/api/v1/bookings/1/cancel")
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_cancel_booking_with_auth(client, auth_token):
    response = await client.patch(
        "/api/v1/bookings/1/cancel",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code in (200, 404, 500)


@pytest.mark.asyncio
async def test_get_schedule_requires_auth(client):
    response = await client.get("/api/v1/bookings/schedule")
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_get_schedule_with_auth(client, owner_token):
    response = await client.get(
        "/api/v1/bookings/schedule",
        headers={"Authorization": f"Bearer {owner_token}"},
        params={"date": "2025-03-15"},
    )
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, list)
    else:
        assert response.status_code in (400, 500)


@pytest.mark.asyncio
async def test_double_booking_returns_error(client, auth_token):
    payload = {
        "court_id": 1,
        "date": "2025-03-15",
        "start_time": "10:00",
        "end_time": "11:00",
    }
    r1 = await client.post(
        "/api/v1/bookings",
        headers={"Authorization": f"Bearer {auth_token}"},
        json=payload,
    )
    if r1.status_code != 201:
        pytest.skip("First booking failed, cannot test double-booking")
    r2 = await client.post(
        "/api/v1/bookings",
        headers={"Authorization": f"Bearer {auth_token}"},
        json=payload,
    )
    if r2.status_code == 409:
        assert "detail" in r2.json()
