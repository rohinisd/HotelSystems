from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from hotel_ms.dependencies import get_db
from hotel_ms.models.schemas import HotelResponse, RoomResponse

router = APIRouter(prefix="/hotels", tags=["Hotels"])


@router.get("", response_model=list[HotelResponse])
async def list_hotels(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text("SELECT id, name, address, city, phone, is_active FROM hotel WHERE is_active = TRUE ORDER BY name")
    )
    rows = result.mappings().all()
    return [HotelResponse(**dict(r)) for r in rows]


@router.get("/{hotel_id}/rooms", response_model=list[RoomResponse])
async def list_rooms(hotel_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text(
            """SELECT id, hotel_id, name, room_type, rate_per_night, capacity, is_available
               FROM room WHERE hotel_id = :hotel_id AND is_available = TRUE ORDER BY name"""
        ),
        {"hotel_id": hotel_id},
    )
    rows = result.mappings().all()
    return [RoomResponse(**dict(r)) for r in rows]
