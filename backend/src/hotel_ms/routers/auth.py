from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from hotel_ms.config import get_settings
from hotel_ms.dependencies import get_current_user, get_db
from hotel_ms.models.schemas import GoogleAuthRequest, LoginRequest, RegisterRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return {"email": user.get("email"), "role": user.get("role"), "restaurant_id": user.get("restaurant_id")}

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _create_token(user_id: int, email: str, role: str, restaurant_id: int | None) -> str:
    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "restaurant_id": restaurant_id,
        "exp": expire,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text(
            "SELECT id, email, hashed_password, role, restaurant_id, is_active FROM users WHERE email = :email"
        ),
        {"email": req.email},
    )
    user = result.mappings().first()

    if not user or not pwd_context.verify(req.password, user["hashed_password"]):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")

    if not user["is_active"]:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account is disabled")

    settings = get_settings()
    token = _create_token(user["id"], user["email"], user["role"], user["restaurant_id"])

    return TokenResponse(
        access_token=token,
        expires_in=settings.jwt_expire_minutes * 60,
        role=user["role"],
        restaurant_id=user["restaurant_id"],
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
               RETURNING id, email, role, restaurant_id"""
        ),
        {"email": req.email, "password": hashed, "name": req.full_name, "phone": req.phone},
    )
    await db.commit()
    row = result.mappings().first()
    if not row:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Registration failed")

    settings = get_settings()
    token = _create_token(row["id"], row["email"], row["role"], row["restaurant_id"])

    return TokenResponse(
        access_token=token,
        expires_in=settings.jwt_expire_minutes * 60,
        role=row["role"],
        restaurant_id=row["restaurant_id"],
    )


@router.post("/google", response_model=TokenResponse)
async def google_auth(body: GoogleAuthRequest, db: AsyncSession = Depends(get_db)):
    """Verify Google ID token and sign in or create user. Requires GOOGLE_CLIENT_ID to be set."""
    settings = get_settings()
    if not settings.google_client_id:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Google Sign-In is not configured")

    try:
        decoded = id_token.verify_oauth2_token(
            body.credential,
            google_requests.Request(),
            settings.google_client_id,
        )
    except Exception:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid Google token")

    email = decoded.get("email")
    name = (decoded.get("name") or decoded.get("given_name") or email or "User").strip()
    if not email:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Google account has no email")

    result = await db.execute(
        text(
            "SELECT id, email, role, restaurant_id, is_active FROM users WHERE email = :email"
        ),
        {"email": email},
    )
    user = result.mappings().first()

    if user:
        if not user["is_active"]:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Account is disabled")
        user_id, role, restaurant_id = user["id"], user["role"], user["restaurant_id"]
    else:
        # Create new user (no password; Google-only login). Use a random hash so password login is impossible.
        placeholder_password = secrets.token_urlsafe(32)
        hashed = pwd_context.hash(placeholder_password)
        await db.execute(
            text(
                """INSERT INTO users (email, hashed_password, full_name, role)
                   VALUES (:email, :password, :name, 'guest')
                   RETURNING id, role, restaurant_id"""
            ),
            {"email": email, "password": hashed, "name": name},
        )
        await db.commit()
        r = await db.execute(
            text("SELECT id, role, restaurant_id FROM users WHERE email = :email"),
            {"email": email},
        )
        row = r.mappings().first()
        user_id, role, restaurant_id = row["id"], row["role"], row["restaurant_id"]

    token = _create_token(user_id, email, role, restaurant_id)
    return TokenResponse(
        access_token=token,
        expires_in=settings.jwt_expire_minutes * 60,
        role=role,
        restaurant_id=restaurant_id,
    )
