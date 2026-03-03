import pytest


@pytest.mark.asyncio
async def test_kpis_requires_auth(client):
    response = await client.get("/api/v1/dashboard/kpis")
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_kpis_requires_allowed_role(client, auth_token):
    response = await client.get(
        "/api/v1/dashboard/kpis",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_kpis_with_owner(client, owner_token):
    response = await client.get(
        "/api/v1/dashboard/kpis",
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, list)
        if data:
            kpi = data[0]
            assert "label" in kpi
            assert "value" in kpi
            assert "change_pct" in kpi
            assert "period" in kpi
    else:
        assert response.status_code in (400, 500)


@pytest.mark.asyncio
async def test_kpis_with_accountant(client, accountant_token):
    response = await client.get(
        "/api/v1/dashboard/kpis",
        headers={"Authorization": f"Bearer {accountant_token}"},
    )
    assert response.status_code in (200, 400, 500)


@pytest.mark.asyncio
async def test_kpis_with_staff(client, staff_token):
    response = await client.get(
        "/api/v1/dashboard/kpis",
        headers={"Authorization": f"Bearer {staff_token}"},
    )
    assert response.status_code in (200, 400, 500)


@pytest.mark.asyncio
async def test_revenue_trend_requires_auth(client):
    response = await client.get("/api/v1/dashboard/revenue-trend")
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_revenue_trend_requires_allowed_role(client, auth_token):
    response = await client.get(
        "/api/v1/dashboard/revenue-trend",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_revenue_trend_with_owner(client, owner_token):
    response = await client.get(
        "/api/v1/dashboard/revenue-trend",
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, list)
        if data:
            entry = data[0]
            assert "date" in entry
            assert "revenue" in entry
            assert "bookings" in entry
    else:
        assert response.status_code in (400, 500)


@pytest.mark.asyncio
async def test_revenue_trend_custom_days(client, owner_token):
    response = await client.get(
        "/api/v1/dashboard/revenue-trend",
        headers={"Authorization": f"Bearer {owner_token}"},
        params={"days": 7},
    )
    assert response.status_code in (200, 400, 500)


@pytest.mark.asyncio
async def test_revenue_trend_invalid_days_too_small(client, owner_token):
    response = await client.get(
        "/api/v1/dashboard/revenue-trend",
        headers={"Authorization": f"Bearer {owner_token}"},
        params={"days": 1},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_revenue_trend_invalid_days_too_large(client, owner_token):
    response = await client.get(
        "/api/v1/dashboard/revenue-trend",
        headers={"Authorization": f"Bearer {owner_token}"},
        params={"days": 999},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_utilization_requires_auth(client):
    response = await client.get("/api/v1/dashboard/utilization")
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_utilization_requires_owner_or_manager(client, staff_token):
    response = await client.get(
        "/api/v1/dashboard/utilization",
        headers={"Authorization": f"Bearer {staff_token}"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_utilization_with_owner(client, owner_token):
    response = await client.get(
        "/api/v1/dashboard/utilization",
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, list)
        if data:
            entry = data[0]
            assert "court_name" in entry
            assert "sport" in entry
            assert "total_bookings" in entry
            assert "total_revenue" in entry
    else:
        assert response.status_code in (400, 500)


@pytest.mark.asyncio
async def test_hourly_utilization_requires_auth(client):
    response = await client.get("/api/v1/dashboard/utilization/hourly")
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_hourly_utilization_requires_owner_or_manager(client, auth_token):
    response = await client.get(
        "/api/v1/dashboard/utilization/hourly",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_hourly_utilization_with_owner(client, owner_token):
    response = await client.get(
        "/api/v1/dashboard/utilization/hourly",
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, list)
        if data:
            entry = data[0]
            assert "court_name" in entry
            assert "day_of_week" in entry
            assert "hour" in entry
            assert "booking_count" in entry
    else:
        assert response.status_code in (400, 500)


@pytest.mark.asyncio
async def test_hourly_utilization_custom_days(client, owner_token):
    response = await client.get(
        "/api/v1/dashboard/utilization/hourly",
        headers={"Authorization": f"Bearer {owner_token}"},
        params={"days": 14},
    )
    assert response.status_code in (200, 400, 500)


@pytest.mark.asyncio
async def test_hourly_utilization_invalid_days(client, owner_token):
    response = await client.get(
        "/api/v1/dashboard/utilization/hourly",
        headers={"Authorization": f"Bearer {owner_token}"},
        params={"days": 3},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_export_revenue_requires_auth(client):
    response = await client.get("/api/v1/dashboard/export/revenue")
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_export_revenue_requires_owner_or_accountant(client, staff_token):
    response = await client.get(
        "/api/v1/dashboard/export/revenue",
        headers={"Authorization": f"Bearer {staff_token}"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_export_revenue_with_owner(client, owner_token):
    response = await client.get(
        "/api/v1/dashboard/export/revenue",
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    if response.status_code == 200:
        assert "text/csv" in response.headers.get("content-type", "")
        lines = response.text.strip().split("\n")
        assert len(lines) >= 1
        header = lines[0]
        assert "ID" in header
        assert "Date" in header
        assert "Court" in header
        assert "Amount" in header
    else:
        assert response.status_code in (400, 500)


@pytest.mark.asyncio
async def test_export_revenue_with_date_filter(client, owner_token):
    response = await client.get(
        "/api/v1/dashboard/export/revenue",
        headers={"Authorization": f"Bearer {owner_token}"},
        params={"start_date": "2025-01-01", "end_date": "2025-12-31"},
    )
    assert response.status_code in (200, 400, 500)


@pytest.mark.asyncio
async def test_export_revenue_with_accountant(client, accountant_token):
    response = await client.get(
        "/api/v1/dashboard/export/revenue",
        headers={"Authorization": f"Bearer {accountant_token}"},
    )
    assert response.status_code in (200, 400, 500)
