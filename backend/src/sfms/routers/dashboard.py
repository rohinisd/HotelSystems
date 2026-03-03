from __future__ import annotations

import csv
import io
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from sfms.dependencies import get_db, get_tenant_id, require_roles
from sfms.models.schemas import DashboardKPI
from sfms.services.booking_engine import BookingEngine

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/kpis", response_model=list[DashboardKPI])
async def get_kpis(
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("owner", "manager", "staff", "accountant")),
    tenant_id: int | None = Depends(get_tenant_id),
):
    if not tenant_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Tenant context required")
    engine = BookingEngine(db)
    return await engine.get_dashboard_kpis(tenant_id)


@router.get("/revenue-trend")
async def get_revenue_trend(
    days: int = Query(30, ge=7, le=365),
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("owner", "manager", "accountant")),
    tenant_id: int | None = Depends(get_tenant_id),
):
    if not tenant_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Tenant context required")

    result = await db.execute(
        text(
            """SELECT date, SUM(amount) as revenue, COUNT(*) as bookings
               FROM booking
               WHERE facility_id = :fid
                 AND date >= CURRENT_DATE - :days
                 AND status != 'cancelled'
               GROUP BY date
               ORDER BY date"""
        ),
        {"fid": tenant_id, "days": days},
    )
    return [
        {"date": str(r.date), "revenue": float(r.revenue), "bookings": r.bookings}
        for r in result.fetchall()
    ]


@router.get("/utilization")
async def get_utilization(
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("owner", "manager")),
    tenant_id: int | None = Depends(get_tenant_id),
):
    if not tenant_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Tenant context required")

    result = await db.execute(
        text(
            """SELECT c.name as court_name, c.sport,
                      COUNT(b.id) as total_bookings,
                      COALESCE(SUM(b.amount), 0) as total_revenue
               FROM court c
               LEFT JOIN booking b ON c.id = b.court_id
                 AND b.date >= CURRENT_DATE - 30
                 AND b.status != 'cancelled'
               WHERE c.facility_id = :fid AND c.is_active = true
               GROUP BY c.id, c.name, c.sport
               ORDER BY total_bookings DESC"""
        ),
        {"fid": tenant_id},
    )
    return [
        {
            "court_name": r.court_name,
            "sport": r.sport,
            "total_bookings": r.total_bookings,
            "total_revenue": float(r.total_revenue),
        }
        for r in result.fetchall()
    ]


@router.get("/utilization/hourly")
async def get_hourly_utilization(
    days: int = Query(30, ge=7, le=90),
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("owner", "manager")),
    tenant_id: int | None = Depends(get_tenant_id),
):
    if not tenant_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Tenant context required")

    result = await db.execute(
        text(
            """SELECT c.name as court_name,
                      EXTRACT(DOW FROM b.date)::int as day_of_week,
                      EXTRACT(HOUR FROM b.start_time)::int as hour,
                      COUNT(*) as booking_count
               FROM booking b
               JOIN court c ON b.court_id = c.id
               WHERE b.facility_id = :fid
                 AND b.date >= CURRENT_DATE - :days
                 AND b.status != 'cancelled'
               GROUP BY c.name, day_of_week, hour
               ORDER BY c.name, day_of_week, hour"""
        ),
        {"fid": tenant_id, "days": days},
    )
    return [
        {
            "court_name": r.court_name,
            "day_of_week": r.day_of_week,
            "hour": r.hour,
            "booking_count": r.booking_count,
        }
        for r in result.fetchall()
    ]


@router.get("/export/revenue")
async def export_revenue_csv(
    start_date: str = Query(None),
    end_date: str = Query(None),
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("owner", "accountant")),
    tenant_id: int | None = Depends(get_tenant_id),
):
    if not tenant_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Tenant context required")

    query = """SELECT b.id, b.date, b.start_time, b.end_time, c.name as court,
                      c.sport, b.player_name, b.amount, b.status, b.booking_type,
                      p.method as payment_method, p.status as payment_status
               FROM booking b
               JOIN court c ON b.court_id = c.id
               LEFT JOIN payment p ON b.id = p.booking_id
               WHERE b.facility_id = :fid"""
    params: dict = {"fid": tenant_id}

    if start_date:
        query += " AND b.date >= :start"
        params["start"] = start_date
    if end_date:
        query += " AND b.date <= :end"
        params["end"] = end_date

    query += " ORDER BY b.date, b.start_time"
    result = await db.execute(text(query), params)
    rows = result.fetchall()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Date", "Start", "End", "Court", "Sport", "Player", "Amount", "Status", "Type", "Payment Method", "Payment Status"])
    for r in rows:
        writer.writerow([r.id, r.date, r.start_time, r.end_time, r.court, r.sport, r.player_name, r.amount, r.status, r.booking_type, r.payment_method, r.payment_status])

    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=revenue_export.csv"},
    )
