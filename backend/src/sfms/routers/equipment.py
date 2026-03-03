from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from sfms.dependencies import get_current_user, get_db, get_tenant_id, require_roles
from sfms.models.schemas import EquipmentCreate, EquipmentResponse, EquipmentUpdate

router = APIRouter(prefix="/equipment", tags=["Equipment"])


@router.get("")
async def list_equipment(
    branch_id: int | None = Query(None),
    category: str | None = Query(None),
    is_rentable: bool | None = Query(None),
    condition: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
    tenant_id: int | None = Depends(get_tenant_id),
):
    where = "WHERE e.is_active = true"
    params: dict = {}

    if tenant_id:
        where += " AND e.facility_id = :fid"
        params["fid"] = tenant_id
    if branch_id:
        where += " AND e.branch_id = :bid"
        params["bid"] = branch_id
    if category:
        where += " AND e.category = :cat"
        params["cat"] = category
    if is_rentable is not None:
        where += " AND e.is_rentable = :rentable"
        params["rentable"] = is_rentable
    if condition:
        where += " AND e.condition = :cond"
        params["cond"] = condition

    count_result = await db.execute(text(f"SELECT COUNT(*) FROM equipment e {where}"), params)
    total = count_result.scalar_one()

    params["lim"] = limit
    params["off"] = offset
    result = await db.execute(
        text(f"""
            SELECT e.*, b.name AS branch_name
            FROM equipment e
            LEFT JOIN branch b ON b.id = e.branch_id
            {where}
            ORDER BY e.category, e.name
            LIMIT :lim OFFSET :off
        """),
        params,
    )
    items = [EquipmentResponse(**r) for r in result.mappings().all()]
    return {"items": items, "total": total}


@router.get("/categories")
async def list_categories(
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
    tenant_id: int | None = Depends(get_tenant_id),
):
    where = "WHERE is_active = true"
    params: dict = {}
    if tenant_id:
        where += " AND facility_id = :fid"
        params["fid"] = tenant_id

    result = await db.execute(
        text(f"SELECT DISTINCT category FROM equipment {where} ORDER BY category"),
        params,
    )
    return [row[0] for row in result.fetchall()]


@router.post("", response_model=EquipmentResponse, status_code=status.HTTP_201_CREATED)
async def create_equipment(
    req: EquipmentCreate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("owner", "manager")),
    tenant_id: int | None = Depends(get_tenant_id),
):
    if not tenant_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Tenant context required")

    avail = req.available_quantity if req.available_quantity is not None else req.total_quantity

    result = await db.execute(
        text("""
            INSERT INTO equipment
                (facility_id, branch_id, name, category, brand, total_quantity,
                 available_quantity, condition, rental_rate, is_rentable, notes)
            VALUES
                (:fid, :bid, :name, :cat, :brand, :total, :avail,
                 :cond, :rate, :rentable, :notes)
            RETURNING *, NULL AS branch_name
        """),
        {
            "fid": tenant_id,
            "bid": req.branch_id,
            "name": req.name,
            "cat": req.category,
            "brand": req.brand,
            "total": req.total_quantity,
            "avail": avail,
            "cond": req.condition,
            "rate": req.rental_rate,
            "rentable": req.is_rentable,
            "notes": req.notes,
        },
    )
    await db.commit()
    row = result.mappings().first()
    return EquipmentResponse(**row)


@router.put("/{equipment_id}", response_model=EquipmentResponse)
async def update_equipment(
    equipment_id: int,
    req: EquipmentUpdate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("owner", "manager")),
    tenant_id: int | None = Depends(get_tenant_id),
):
    updates = req.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No fields to update")

    set_clauses = ", ".join(f"{k} = :{k}" for k in updates)
    set_clauses += ", updated_at = NOW()"
    updates["id"] = equipment_id
    updates["fid"] = tenant_id

    result = await db.execute(
        text(f"""
            UPDATE equipment SET {set_clauses}
            WHERE id = :id AND facility_id = :fid
            RETURNING *, NULL AS branch_name
        """),
        updates,
    )
    await db.commit()
    row = result.mappings().first()
    if not row:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Equipment not found")
    return EquipmentResponse(**row)


@router.delete("/{equipment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_equipment(
    equipment_id: int,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("owner", "manager")),
    tenant_id: int | None = Depends(get_tenant_id),
):
    result = await db.execute(
        text("UPDATE equipment SET is_active = false, updated_at = NOW() WHERE id = :id AND facility_id = :fid RETURNING id"),
        {"id": equipment_id, "fid": tenant_id},
    )
    await db.commit()
    if not result.first():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Equipment not found")
