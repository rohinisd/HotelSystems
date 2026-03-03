from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from sfms.dependencies import get_db, get_tenant_id, require_roles
from sfms.models.schemas import UserResponse

router = APIRouter(prefix="/users", tags=["Users"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class InviteUserRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=255)
    phone: str | None = Field(None, max_length=20)
    role: str = Field(..., pattern=r"^(manager|staff|accountant)$")
    password: str = Field(..., min_length=6, max_length=100)


class UpdateUserRoleRequest(BaseModel):
    role: str | None = Field(None, pattern=r"^(manager|staff|accountant|player)$")
    is_active: bool | None = None


@router.get("", response_model=list[UserResponse])
async def list_facility_users(
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("owner", "manager")),
    tenant_id: int | None = Depends(get_tenant_id),
):
    if not tenant_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Tenant context required")
    result = await db.execute(
        text("SELECT id, email, full_name, phone, role, facility_id, is_active FROM users WHERE facility_id = :fid ORDER BY id"),
        {"fid": tenant_id},
    )
    return [UserResponse(**r) for r in result.mappings().all()]


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def invite_user(
    req: InviteUserRequest,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("owner")),
    tenant_id: int | None = Depends(get_tenant_id),
):
    if not tenant_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Tenant context required")

    existing = await db.execute(
        text("SELECT id FROM users WHERE email = :email"),
        {"email": req.email},
    )
    if existing.first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")

    hashed = pwd_context.hash(req.password)
    result = await db.execute(
        text(
            """INSERT INTO users (facility_id, email, hashed_password, full_name, phone, role)
               VALUES (:fid, :email, :password, :name, :phone, :role)
               RETURNING id, email, full_name, phone, role, facility_id, is_active"""
        ),
        {
            "fid": tenant_id,
            "email": req.email,
            "password": hashed,
            "name": req.full_name,
            "phone": req.phone,
            "role": req.role,
        },
    )
    await db.commit()
    return UserResponse(**result.mappings().first())


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    req: UpdateUserRoleRequest,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("owner")),
    tenant_id: int | None = Depends(get_tenant_id),
):
    if not tenant_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Tenant context required")

    target = await db.execute(
        text("SELECT id, role FROM users WHERE id = :id AND facility_id = :fid"),
        {"id": user_id, "fid": tenant_id},
    )
    row = target.mappings().first()
    if not row:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found in this facility")
    if row["role"] == "owner":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Cannot modify the owner account")

    updates = req.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No fields to update")

    set_clauses = ", ".join(f"{k} = :{k}" for k in updates)
    updates["id"] = user_id
    updates["fid"] = tenant_id
    result = await db.execute(
        text(f"UPDATE users SET {set_clauses} WHERE id = :id AND facility_id = :fid RETURNING id, email, full_name, phone, role, facility_id, is_active"),
        updates,
    )
    await db.commit()
    return UserResponse(**result.mappings().first())
