import os

os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/sfms_test")
os.environ.setdefault("JWT_SECRET", "test-secret-key-for-testing-only")
os.environ.setdefault("APP_ENV", "test")

from datetime import datetime, timedelta, timezone

import pytest
from httpx import ASGITransport, AsyncClient
from jose import jwt

from sfms.config import get_settings
from sfms.main import create_app


def _create_token(user_id: int = 1, role: str = "player", facility_id: int | None = None) -> str:
    settings = get_settings()
    payload = {
        "sub": str(user_id),
        "email": "test@test.com",
        "role": role,
        "facility_id": facility_id,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=60),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


@pytest.fixture
def app():
    return create_app()


@pytest.fixture
async def client(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest.fixture
def auth_token():
    return _create_token(user_id=1, role="player", facility_id=None)


@pytest.fixture
def owner_token():
    return _create_token(user_id=1, role="owner", facility_id=1)


@pytest.fixture
def manager_token():
    return _create_token(user_id=1, role="manager", facility_id=1)


@pytest.fixture
def staff_token():
    return _create_token(user_id=1, role="staff", facility_id=1)


@pytest.fixture
def accountant_token():
    return _create_token(user_id=1, role="accountant", facility_id=1)
