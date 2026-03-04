from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from sfms.dependencies import get_current_user, get_db, get_tenant_id, require_roles
from sfms.models.schemas import BookingCreateRequest, BookingResponse, SlotResponse
from sfms.services.booking_engine import BookingEngine
from sfms.services.exceptions import BookingNotFoundError, SlotUnavailableError

router = APIRouter(prefix="/bookings", tags=["Bookings"])


@router.get("/slots", response_model=list[SlotResponse])
async def get_available_slots(
    court_id: int = Query(...),
    date: str = Query(..., description="YYYY-MM-DD"),
    db: AsyncSession = Depends(get_db),
):
    """Get available slots for a court on a specific date. Public endpoint."""
    engine = BookingEngine(db)
    try:
        target_date = __import__("datetime").date.fromisoformat(date)
    except ValueError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid date format. Use YYYY-MM-DD")
    slots = await engine.get_available_slots(court_id, target_date)
    return slots


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_booking(
    req: BookingCreateRequest,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
    tenant_id: int | None = Depends(get_tenant_id),
):
    engine = BookingEngine(db)
    # For players, use the first available facility or the one from JWT
    facility_id = tenant_id or user.get("facility_id")
    if not facility_id:
        court_result = await db.execute(
            __import__("sqlalchemy").text("SELECT facility_id FROM court WHERE id = :cid"),
            {"cid": req.court_id},
        )
        row = court_result.scalar_one_or_none()
        if not row:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Court not found")
        facility_id = row

    try:
        booking = await engine.create(
            tenant_id=facility_id,
            court_id=req.court_id,
            booking_date=req.date,
            start_time=req.start_time,
            end_time=req.end_time,
            player_id=int(user["sub"]),
            booking_type=req.booking_type.value,
            player_name=req.player_name,
            player_phone=req.player_phone,
            notes=req.notes,
            booking_source=req.booking_source,
        )
        return booking
    except SlotUnavailableError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, str(e))


@router.post("/block", status_code=status.HTTP_201_CREATED)
async def block_slot(
    req: BookingCreateRequest,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("owner", "manager")),
    tenant_id: int | None = Depends(get_tenant_id),
):
    """Block a slot so it can't be booked."""
    if not tenant_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant context required")
    engine = BookingEngine(db)
    try:
        booking = await engine.create(
            tenant_id=tenant_id,
            court_id=req.court_id,
            booking_date=req.date,
            start_time=req.start_time,
            end_time=req.end_time,
            player_id=int(user["sub"]),
            booking_type="blocked",
            player_name="BLOCKED",
            notes=req.notes or "Blocked by management",
        )
        return booking
    except SlotUnavailableError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.delete("/block/{booking_id}")
async def unblock_slot(
    booking_id: int,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("owner", "manager")),
    tenant_id: int | None = Depends(get_tenant_id),
):
    """Unblock a previously blocked slot."""
    if not tenant_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant context required")

    result = await db.execute(
        text("SELECT id, booking_type FROM booking WHERE id = :id AND facility_id = :fid"),
        {"id": booking_id, "fid": tenant_id},
    )
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    if row["booking_type"] != "blocked":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only blocked slots can be unblocked")

    await db.execute(
        text("UPDATE booking SET status = 'cancelled' WHERE id = :id"),
        {"id": booking_id},
    )
    await db.commit()
    return {"id": booking_id, "status": "unblocked"}


@router.get("")
async def list_bookings(
    date: str | None = Query(None),
    court_id: int | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
    tenant_id: int | None = Depends(get_tenant_id),
):
    engine = BookingEngine(db)
    player_id = None
    if user.get("role") == "player":
        player_id = int(user["sub"])

    return await engine.list_bookings(
        tenant_id=tenant_id,
        booking_date=date,
        court_id=court_id,
        player_id=player_id,
        status=status_filter,
        limit=limit,
        offset=offset,
    )


@router.patch("/{booking_id}/cancel")
async def cancel_booking(
    booking_id: int,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
    tenant_id: int | None = Depends(get_tenant_id),
):
    engine = BookingEngine(db)
    try:
        result = await engine.cancel(
            booking_id=booking_id,
            cancelled_by=int(user["sub"]),
            tenant_id=tenant_id,
        )
        return result
    except BookingNotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e))


@router.get("/schedule")
async def get_schedule(
    date: str = Query(default=None, description="YYYY-MM-DD, defaults to today"),
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("owner", "manager", "staff")),
    tenant_id: int | None = Depends(get_tenant_id),
):
    if not tenant_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Tenant context required")

    if date:
        try:
            schedule_date = __import__("datetime").date.fromisoformat(date)
        except ValueError:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid date format")
    else:
        schedule_date = __import__("datetime").date.today()

    engine = BookingEngine(db)
    return await engine.get_schedule(tenant_id, schedule_date)
