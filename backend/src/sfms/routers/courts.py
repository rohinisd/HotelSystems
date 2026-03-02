from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from sfms.dependencies import get_current_user, get_db, get_tenant_id, require_roles
from sfms.models.schemas import CourtCreate, CourtResponse, CourtUpdate, PricingRuleResponse

router = APIRouter(prefix="/courts", tags=["Courts"])


@router.get("", response_model=list[CourtResponse])
async def list_courts(
    branch_id: int | None = Query(None),
    sport: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
    tenant_id: int | None = Depends(get_tenant_id),
):
    query = "SELECT * FROM court WHERE is_active = true"
    params: dict = {}

    if tenant_id:
        query += " AND facility_id = :fid"
        params["fid"] = tenant_id

    if branch_id:
        query += " AND branch_id = :bid"
        params["bid"] = branch_id

    if sport:
        query += " AND sport = :sport"
        params["sport"] = sport

    query += " ORDER BY branch_id, name"
    result = await db.execute(text(query), params)
    rows = result.mappings().all()
    return [CourtResponse(**r) for r in rows]


@router.post("", response_model=CourtResponse, status_code=status.HTTP_201_CREATED)
async def create_court(
    req: CourtCreate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("owner", "manager")),
    tenant_id: int | None = Depends(get_tenant_id),
):
    if not tenant_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Tenant context required")

    result = await db.execute(
        text(
            """INSERT INTO court (branch_id, facility_id, name, sport, surface_type,
                                  hourly_rate, peak_hour_rate, slot_duration_minutes, is_indoor)
               VALUES (:bid, :fid, :name, :sport, :surface, :rate, :peak, :duration, :indoor)
               RETURNING *"""
        ),
        {
            "bid": req.branch_id,
            "fid": tenant_id,
            "name": req.name,
            "sport": req.sport,
            "surface": req.surface_type,
            "rate": req.hourly_rate,
            "peak": req.peak_hour_rate,
            "duration": req.slot_duration_minutes,
            "indoor": req.is_indoor,
        },
    )
    await db.commit()
    row = result.mappings().first()
    return CourtResponse(**row)


@router.put("/{court_id}", response_model=CourtResponse)
async def update_court(
    court_id: int,
    req: CourtUpdate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("owner", "manager")),
    tenant_id: int | None = Depends(get_tenant_id),
):
    updates = req.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No fields to update")

    set_clauses = ", ".join(f"{k} = :{k}" for k in updates)
    updates["id"] = court_id
    updates["fid"] = tenant_id

    result = await db.execute(
        text(f"UPDATE court SET {set_clauses} WHERE id = :id AND facility_id = :fid RETURNING *"),
        updates,
    )
    await db.commit()
    row = result.mappings().first()
    if not row:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Court not found")
    return CourtResponse(**row)


@router.get("/{court_id}/pricing", response_model=list[PricingRuleResponse])
async def get_pricing_rules(
    court_id: int,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    result = await db.execute(
        text("SELECT * FROM pricing_rule WHERE court_id = :cid AND is_active = true ORDER BY day_of_week, start_time"),
        {"cid": court_id},
    )
    rows = result.mappings().all()
    return [PricingRuleResponse(**r) for r in rows]
