from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from sfms.dependencies import get_current_user, get_db, get_tenant_id, require_roles
from sfms.models.schemas import CourtCreate, CourtResponse, CourtUpdate, PricingRuleCreate, PricingRuleResponse

router = APIRouter(prefix="/courts", tags=["Courts"])


@router.get("")
async def list_courts(
    branch_id: int | None = Query(None),
    sport: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
    tenant_id: int | None = Depends(get_tenant_id),
):
    where = "WHERE is_active = true"
    params: dict = {}

    if tenant_id:
        where += " AND facility_id = :fid"
        params["fid"] = tenant_id
    if branch_id:
        where += " AND branch_id = :bid"
        params["bid"] = branch_id
    if sport:
        where += " AND sport = :sport"
        params["sport"] = sport

    count_result = await db.execute(text(f"SELECT COUNT(*) FROM court {where}"), params)
    total = count_result.scalar_one()

    params["lim"] = limit
    params["off"] = offset
    result = await db.execute(
        text(f"SELECT * FROM court {where} ORDER BY branch_id, name LIMIT :lim OFFSET :off"),
        params,
    )
    items = [CourtResponse(**r) for r in result.mappings().all()]
    return {"items": items, "total": total}


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


@router.post("/{court_id}/pricing", response_model=PricingRuleResponse, status_code=status.HTTP_201_CREATED)
async def create_pricing_rule(
    court_id: int,
    req: PricingRuleCreate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("owner", "manager")),
    tenant_id: int | None = Depends(get_tenant_id),
):
    if not tenant_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Tenant context required")

    result = await db.execute(
        text(
            """INSERT INTO pricing_rule (court_id, facility_id, day_of_week, start_time, end_time, rate, label)
               VALUES (:cid, :fid, :dow, :start, :end, :rate, :label)
               RETURNING *"""
        ),
        {
            "cid": court_id,
            "fid": tenant_id,
            "dow": req.day_of_week,
            "start": req.start_time,
            "end": req.end_time,
            "rate": req.rate,
            "label": req.label,
        },
    )
    await db.commit()
    row = result.mappings().first()
    return PricingRuleResponse(**row)


@router.delete("/{court_id}/pricing/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pricing_rule(
    court_id: int,
    rule_id: int,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("owner", "manager")),
    tenant_id: int | None = Depends(get_tenant_id),
):
    await db.execute(
        text("UPDATE pricing_rule SET is_active = false WHERE id = :id AND court_id = :cid AND facility_id = :fid"),
        {"id": rule_id, "cid": court_id, "fid": tenant_id},
    )
    await db.commit()
