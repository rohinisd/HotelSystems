from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from sfms.dependencies import get_current_user, get_db, require_roles
from sfms.models.schemas import (
    BranchCreate,
    BranchResponse,
    FacilityCreate,
    FacilityResponse,
)

router = APIRouter(prefix="/facilities", tags=["Facilities"])


@router.get("", response_model=list[FacilityResponse])
async def list_facilities(
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    facility_id = user.get("facility_id")
    if facility_id:
        result = await db.execute(
            text("SELECT * FROM facility WHERE id = :id AND is_active = true"),
            {"id": facility_id},
        )
    else:
        result = await db.execute(text("SELECT * FROM facility WHERE is_active = true"))

    rows = result.mappings().all()
    return [FacilityResponse(**r) for r in rows]


@router.post("", response_model=FacilityResponse, status_code=status.HTTP_201_CREATED)
async def create_facility(
    req: FacilityCreate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("owner")),
):
    result = await db.execute(
        text(
            """INSERT INTO facility (name, slug, owner_name, owner_email, owner_phone)
               VALUES (:name, :slug, :owner_name, :owner_email, :owner_phone)
               RETURNING *"""
        ),
        {
            "name": req.name,
            "slug": req.slug,
            "owner_name": req.owner_name,
            "owner_email": req.owner_email,
            "owner_phone": req.owner_phone,
        },
    )
    await db.commit()
    row = result.mappings().first()
    return FacilityResponse(**row)


@router.get("/{facility_id}/branches", response_model=list[BranchResponse])
async def list_branches(
    facility_id: int,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    result = await db.execute(
        text("SELECT * FROM branch WHERE facility_id = :fid AND is_active = true ORDER BY name"),
        {"fid": facility_id},
    )
    rows = result.mappings().all()
    return [BranchResponse(**r) for r in rows]


@router.post("/{facility_id}/branches", response_model=BranchResponse, status_code=status.HTTP_201_CREATED)
async def create_branch(
    facility_id: int,
    request: Request,
    req: BranchCreate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("owner", "manager")),
):
    tenant_id = getattr(request.state, "tenant_id", None)
    if tenant_id is None or tenant_id != facility_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
    result = await db.execute(
        text(
            """INSERT INTO branch (facility_id, name, address, city, state, pincode, phone, opening_time, closing_time)
               VALUES (:fid, :name, :address, :city, :state, :pincode, :phone, :opening, :closing)
               RETURNING *"""
        ),
        {
            "fid": facility_id,
            "name": req.name,
            "address": req.address,
            "city": req.city,
            "state": req.state,
            "pincode": req.pincode,
            "phone": req.phone,
            "opening": req.opening_time,
            "closing": req.closing_time,
        },
    )
    await db.commit()
    row = result.mappings().first()
    return BranchResponse(**row)
