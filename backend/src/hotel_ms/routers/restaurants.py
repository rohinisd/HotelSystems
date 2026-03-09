from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from hotel_ms.dependencies import get_current_user, get_db
from hotel_ms.models.schemas import (
    ReservationCreate,
    ReservationResponse,
    RestaurantCustomizeUpdate,
    RestaurantResponse,
    RestaurantTableResponse,
)

router = APIRouter(prefix="/restaurants", tags=["Restaurants"])


@router.get("", response_model=list[RestaurantResponse])
async def list_restaurants(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text(
            """SELECT id, name, slug, address, city, phone, email, logo_url, primary_color,
                      secondary_color, cover_image_url, tagline, is_active
               FROM restaurant WHERE is_active = TRUE ORDER BY name"""
        )
    )
    rows = result.mappings().all()
    return [RestaurantResponse(**dict(r)) for r in rows]


@router.get("/by-slug/{slug}", response_model=RestaurantResponse)
async def get_restaurant_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text(
            """SELECT id, name, slug, address, city, phone, email, logo_url, primary_color,
                      secondary_color, cover_image_url, tagline, is_active
               FROM restaurant WHERE slug = :slug AND is_active = TRUE"""
        ),
        {"slug": slug},
    )
    row = result.mappings().first()
    if not row:
        raise HTTPException(404, "Restaurant not found")
    return RestaurantResponse(**dict(row))


@router.get("/{restaurant_id}", response_model=RestaurantResponse)
async def get_restaurant(restaurant_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text(
            """SELECT id, name, slug, address, city, phone, email, logo_url, primary_color,
                      secondary_color, cover_image_url, tagline, is_active
               FROM restaurant WHERE id = :id AND is_active = TRUE"""
        ),
        {"id": restaurant_id},
    )
    row = result.mappings().first()
    if not row:
        raise HTTPException(404, "Restaurant not found")
    return RestaurantResponse(**dict(row))


@router.get("/{restaurant_id}/tables", response_model=list[RestaurantTableResponse])
async def list_tables(restaurant_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text(
            """SELECT id, restaurant_id, name, capacity, min_party, max_party, is_active
               FROM restaurant_table WHERE restaurant_id = :rid AND is_active = TRUE ORDER BY name"""
        ),
        {"rid": restaurant_id},
    )
    rows = result.mappings().all()
    return [RestaurantTableResponse(**dict(r)) for r in rows]


@router.patch("/{restaurant_id}/customize", response_model=RestaurantResponse)
async def customize_restaurant(
    restaurant_id: int,
    body: RestaurantCustomizeUpdate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    rid = user.get("restaurant_id")
    if rid is not None and rid != restaurant_id and user.get("role") not in ("owner", "admin", "manager"):
        raise HTTPException(403, "Not allowed to customize this restaurant")
    updates = body.model_dump(exclude_unset=True)
    if not updates:
        result = await db.execute(
            text(
                """SELECT id, name, slug, address, city, phone, email, logo_url, primary_color,
                          secondary_color, cover_image_url, tagline, is_active
                   FROM restaurant WHERE id = :id"""
            ),
            {"id": restaurant_id},
        )
        row = result.mappings().first()
        if not row:
            raise HTTPException(404, "Restaurant not found")
        return RestaurantResponse(**dict(row))
    set_clause = ", ".join(f"{k} = :{k}" for k in updates)
    updates["id"] = restaurant_id
    await db.execute(
        text(f"UPDATE restaurant SET {set_clause}, updated_at = NOW() WHERE id = :id"),
        updates,
    )
    await db.commit()
    result = await db.execute(
        text(
            """SELECT id, name, slug, address, city, phone, email, logo_url, primary_color,
                      secondary_color, cover_image_url, tagline, is_active
               FROM restaurant WHERE id = :id"""
        ),
        {"id": restaurant_id},
    )
    row = result.mappings().first()
    return RestaurantResponse(**dict(row))


@router.post("/{restaurant_id}/reservations", response_model=ReservationResponse, status_code=201)
async def create_reservation(
    restaurant_id: int,
    body: ReservationCreate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        text(
            """INSERT INTO reservation (restaurant_id, table_id, reservation_date, reservation_time,
               party_size, guest_name, guest_email, guest_phone, notes, status)
               VALUES (:restaurant_id, :table_id, :reservation_date, :reservation_time,
               :party_size, :guest_name, :guest_email, :guest_phone, :notes, 'confirmed')
               RETURNING id, restaurant_id, table_id, reservation_date, reservation_time,
               party_size, status, guest_name, guest_email, guest_phone, notes, created_at"""
        ),
        {
            "restaurant_id": restaurant_id,
            "table_id": body.table_id,
            "reservation_date": body.reservation_date,
            "reservation_time": body.reservation_time,
            "party_size": body.party_size,
            "guest_name": body.guest_name,
            "guest_email": body.guest_email,
            "guest_phone": body.guest_phone,
            "notes": body.notes,
        },
    )
    await db.commit()
    row = result.mappings().first()
    if not row:
        raise HTTPException(500, "Failed to create reservation")
    out = dict(row)
    if out.get("created_at"):
        out["created_at"] = str(out["created_at"])
    return ReservationResponse(**out)


@router.get("/{restaurant_id}/reservations", response_model=list[ReservationResponse])
async def list_reservations(
    restaurant_id: int,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    if user.get("restaurant_id") != restaurant_id and user.get("role") not in ("owner", "admin", "manager", "staff"):
        raise HTTPException(403, "Not allowed")
    result = await db.execute(
        text(
            """SELECT id, restaurant_id, table_id, reservation_date, reservation_time, party_size,
                      status, guest_name, guest_email, guest_phone, notes, created_at
               FROM reservation WHERE restaurant_id = :rid ORDER BY reservation_date DESC, reservation_time DESC"""
        ),
        {"rid": restaurant_id},
    )
    rows = result.mappings().all()
    out = []
    for r in rows:
        d = dict(r)
        if d.get("created_at"):
            d["created_at"] = str(d["created_at"])
        out.append(ReservationResponse(**d))
    return out
