import pytest


@pytest.mark.asyncio
async def test_health_endpoint(client):
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "turfstack-api"


@pytest.mark.asyncio
async def test_health_db_endpoint(client):
    response = await client.get("/api/v1/health/db")
    if response.status_code == 200:
        data = response.json()
        assert data["status"] == "healthy"
        assert data["database"] == "connected"
    else:
        assert response.status_code == 500
