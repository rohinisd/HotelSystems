from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from sfms.config import get_settings
from sfms.dependencies import get_current_user, get_db
from sfms.models.schemas import LoginRequest, ProfileUpdate, RegisterRequest, TokenResponse, UserResponse
from sfms.rate_limit import limiter

router = APIRouter(prefix="/auth", tags=["Auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _create_token(user_id: int, email: str, role: str, facility_id: int | None) -> str:
    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "facility_id": facility_id,
        "exp": expire,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/second")
async def login(request: Request, req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text("SELECT id, email, hashed_password, role, facility_id, is_active FROM users WHERE email = :email"),
        {"email": req.email},
    )
    user = result.mappings().first()

    if not user or not pwd_context.verify(req.password, user["hashed_password"]):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")

    if not user["is_active"]:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account is disabled")

    settings = get_settings()
    token = _create_token(user["id"], user["email"], user["role"], user["facility_id"])

    return TokenResponse(
        access_token=token,
        expires_in=settings.jwt_expire_minutes * 60,
        role=user["role"],
        facility_id=user["facility_id"],
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/second")
async def register(request: Request, req: RegisterRequest, db: AsyncSession = Depends(get_db)):
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
               VALUES (:email, :password, :name, :phone, 'player')
               RETURNING id"""
        ),
        {"email": req.email, "password": hashed, "name": req.full_name, "phone": req.phone},
    )
    await db.commit()
    user_id = result.scalar_one()

    settings = get_settings()
    token = _create_token(user_id, req.email, "player", None)

    return TokenResponse(
        access_token=token,
        expires_in=settings.jwt_expire_minutes * 60,
        role="player",
        facility_id=None,
    )


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("10/minute")
async def refresh_token(
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    user_id = int(user["sub"])
    result = await db.execute(
        text("SELECT id, email, role, facility_id, is_active FROM users WHERE id = :id"),
        {"id": user_id},
    )
    row = result.mappings().first()
    if not row or not row["is_active"]:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found or disabled")

    settings = get_settings()
    token = _create_token(row["id"], row["email"], row["role"], row["facility_id"])

    return TokenResponse(
        access_token=token,
        expires_in=settings.jwt_expire_minutes * 60,
        role=row["role"],
        facility_id=row["facility_id"],
    )


@router.get("/me", response_model=UserResponse)
async def get_me(
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    result = await db.execute(
        text("SELECT id, email, full_name, phone, role, facility_id, is_active FROM users WHERE id = :id"),
        {"id": int(user["sub"])},
    )
    row = result.mappings().first()
    if not row:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    return UserResponse(**row)


@router.patch("/me", response_model=UserResponse)
async def update_me(
    req: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    user_id = int(user["sub"])
    updates = req.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No fields to update")

    set_clauses = ", ".join(f"{k} = :{k}" for k in updates)
    updates["id"] = user_id
    result = await db.execute(
        text(f"UPDATE users SET {set_clauses} WHERE id = :id RETURNING id, email, full_name, phone, role, facility_id, is_active"),
        updates,
    )
    await db.commit()
    row = result.mappings().first()
    if not row:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    return UserResponse(**row)
