from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from hotel_ms.config import get_settings
from hotel_ms.dependencies import get_db
from hotel_ms.models.schemas import LoginRequest, RegisterRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["Auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _create_token(user_id: int, email: str, role: str, hotel_id: int | None) -> str:
    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "hotel_id": hotel_id,
        "exp": expire,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text(
            "SELECT id, email, hashed_password, role, hotel_id, is_active FROM users WHERE email = :email"
        ),
        {"email": req.email},
    )
    user = result.mappings().first()

    if not user or not pwd_context.verify(req.password, user["hashed_password"]):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")

    if not user["is_active"]:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account is disabled")

    settings = get_settings()
    token = _create_token(user["id"], user["email"], user["role"], user["hotel_id"])

    return TokenResponse(
        access_token=token,
        expires_in=settings.jwt_expire_minutes * 60,
        role=user["role"],
        hotel_id=user["hotel_id"],
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(
        text("SELECT id FROM users WHERE email = :email"),
        {"email": req.email},
    )
    if existing.first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")

    hashed = pwd_context.hash(req.password)
    result = await db.execute(
        text(
            """INSERT INTO users (email, hashed_password, full_name, phone, role)
               VALUES (:email, :password, :name, :phone, 'guest')
               RETURNING id, email, role, hotel_id"""
        ),
        {"email": req.email, "password": hashed, "name": req.full_name, "phone": req.phone},
    )
    await db.commit()
    row = result.mappings().first()
    if not row:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Registration failed")

    settings = get_settings()
    token = _create_token(row["id"], row["email"], row["role"], row["hotel_id"])

    return TokenResponse(
        access_token=token,
        expires_in=settings.jwt_expire_minutes * 60,
        role=row["role"],
        hotel_id=row["hotel_id"],
    )
