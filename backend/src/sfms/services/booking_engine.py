from __future__ import annotations

from datetime import date, time

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from sfms.services.exceptions import BookingNotFoundError, SlotUnavailableError
from sfms.services.slot_generator import SlotGenerator


class BookingEngine:
    """Core booking logic: availability, creation, cancellation, dashboard queries."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.slot_gen = SlotGenerator()

    async def get_available_slots(self, court_id: int, target_date: date) -> list[dict]:
        court = await self._get_court(court_id)
        branch = await self._get_branch(court["branch_id"])
        rules = await self._get_pricing_rules(court_id)

        slots = self.slot_gen.generate_slots(
            court_id=court_id,
            target_date=target_date,
            opening=branch["opening_time"],
            closing=branch["closing_time"],
            duration_minutes=court["slot_duration_minutes"],
            hourly_rate=float(court["hourly_rate"]),
            pricing_rules=[dict(r) for r in rules],
        )

        booked = await self.db.execute(
            text(
                """SELECT start_time, end_time FROM booking
                   WHERE court_id = :court_id AND date = :date AND status != 'cancelled'"""
            ),
            {"court_id": court_id, "date": target_date},
        )
        booked_ranges = [(r.start_time, r.end_time) for r in booked.fetchall()]

        for slot in slots:
            st = time.fromisoformat(slot["start_time"])
            et = time.fromisoformat(slot["end_time"])
            for b_start, b_end in booked_ranges:
                if st < b_end and b_start < et:
                    slot["is_available"] = False
                    break

        return slots

    async def create(
        self,
        tenant_id: int,
        court_id: int,
        booking_date: date,
        start_time: time,
        end_time: time,
        player_id: int | None,
        booking_type: str,
        player_name: str | None = None,
        player_phone: str | None = None,
        notes: str | None = None,
    ) -> dict:
        async with self.db.begin_nested():
            conflict = await self.db.execute(
                text(
                    """SELECT id FROM booking
                       WHERE court_id = :court_id
                         AND date = :date
                         AND status != 'cancelled'
                         AND start_time < :end_time
                         AND end_time > :start_time
                       FOR UPDATE"""
                ),
                {
                    "court_id": court_id,
                    "date": booking_date,
                    "start_time": start_time,
                    "end_time": end_time,
                },
            )

            if conflict.fetchone():
                raise SlotUnavailableError("This slot is no longer available")

            price = await self._get_slot_price(court_id, booking_date, start_time, end_time)

            result = await self.db.execute(
                text(
                    """INSERT INTO booking
                       (facility_id, court_id, player_id, date, start_time, end_time,
                        status, booking_type, amount, player_name, player_phone, notes, created_by)
                       VALUES (:facility_id, :court_id, :player_id, :date, :start_time,
                               :end_time, 'confirmed', :booking_type, :amount,
                               :player_name, :player_phone, :notes, :created_by)
                       RETURNING id, status, amount, created_at"""
                ),
                {
                    "facility_id": tenant_id,
                    "court_id": court_id,
                    "player_id": player_id,
                    "date": booking_date,
                    "start_time": start_time,
                    "end_time": end_time,
                    "booking_type": booking_type,
                    "amount": price,
                    "player_name": player_name,
                    "player_phone": player_phone,
                    "notes": notes,
                    "created_by": player_id,
                },
            )
            booking = result.mappings().first()

        await self.db.commit()

        return {
            "id": booking["id"],
            "status": booking["status"],
            "amount": float(booking["amount"]),
            "created_at": booking["created_at"],
        }

    async def cancel(self, booking_id: int, cancelled_by: int, tenant_id: int | None) -> dict:
        params: dict = {"id": booking_id, "by": cancelled_by}
        query = """UPDATE booking
                   SET status = 'cancelled', cancelled_by = :by, cancelled_at = NOW()
                   WHERE id = :id AND status = 'confirmed'"""
        if tenant_id:
            query += " AND facility_id = :fid"
            params["fid"] = tenant_id
        query += " RETURNING id, status, amount"

        result = await self.db.execute(text(query), params)
        await self.db.commit()
        row = result.mappings().first()
        if not row:
            raise BookingNotFoundError("Booking not found or already cancelled")
        return dict(row)

    async def list_bookings(
        self,
        tenant_id: int | None,
        booking_date: str | None = None,
        court_id: int | None = None,
        player_id: int | None = None,
        status: str | None = None,
    ) -> list[dict]:
        query = """SELECT b.*, c.name as court_name, br.name as branch_name,
                          p.id as payment_id, p.status as payment_status, p.method as payment_method
                   FROM booking b
                   JOIN court c ON b.court_id = c.id
                   JOIN branch br ON c.branch_id = br.id
                   LEFT JOIN payment p ON b.id = p.booking_id AND p.status = 'captured'
                   WHERE 1=1"""
        params: dict = {}

        if tenant_id:
            query += " AND b.facility_id = :fid"
            params["fid"] = tenant_id
        if booking_date:
            query += " AND b.date = :date"
            params["date"] = booking_date
        if court_id:
            query += " AND b.court_id = :cid"
            params["cid"] = court_id
        if player_id:
            query += " AND b.player_id = :pid"
            params["pid"] = player_id
        if status:
            query += " AND b.status = :status"
            params["status"] = status

        query += " ORDER BY b.date, b.start_time"

        result = await self.db.execute(text(query), params)
        return [dict(r) for r in result.mappings().all()]

    async def get_schedule(self, tenant_id: int, schedule_date: date) -> list[dict]:
        result = await self.db.execute(
            text(
                """SELECT b.*, c.name as court_name, c.sport, br.name as branch_name,
                          u.full_name as player_full_name
                   FROM booking b
                   JOIN court c ON b.court_id = c.id
                   JOIN branch br ON c.branch_id = br.id
                   LEFT JOIN users u ON b.player_id = u.id
                   WHERE b.facility_id = :fid AND b.date = :date AND b.status != 'cancelled'
                   ORDER BY c.name, b.start_time"""
            ),
            {"fid": tenant_id, "date": schedule_date},
        )
        return [dict(r) for r in result.mappings().all()]

    async def get_dashboard_kpis(self, facility_id: int) -> list[dict]:
        today_rev = await self.db.execute(
            text(
                """SELECT COALESCE(SUM(amount), 0) as total
                   FROM booking WHERE facility_id = :fid AND date = CURRENT_DATE AND status != 'cancelled'"""
            ),
            {"fid": facility_id},
        )
        revenue_today = float(today_rev.scalar_one())

        today_count = await self.db.execute(
            text(
                """SELECT COUNT(*) FROM booking
                   WHERE facility_id = :fid AND date = CURRENT_DATE AND status != 'cancelled'"""
            ),
            {"fid": facility_id},
        )
        bookings_today = today_count.scalar_one()

        month_rev = await self.db.execute(
            text(
                """SELECT COALESCE(SUM(amount), 0)
                   FROM booking WHERE facility_id = :fid
                   AND date >= date_trunc('month', CURRENT_DATE) AND status != 'cancelled'"""
            ),
            {"fid": facility_id},
        )
        revenue_mtd = float(month_rev.scalar_one())

        court_count = await self.db.execute(
            text("SELECT COUNT(*) FROM court WHERE facility_id = :fid AND is_active = true"),
            {"fid": facility_id},
        )
        total_courts = court_count.scalar_one()

        booked_slots = await self.db.execute(
            text(
                """SELECT COUNT(*) FROM booking
                   WHERE facility_id = :fid AND date = CURRENT_DATE AND status != 'cancelled'"""
            ),
            {"fid": facility_id},
        )
        total_booked = booked_slots.scalar_one()
        total_possible = total_courts * 17  # ~17 hours of operation
        utilization = round((total_booked / total_possible * 100) if total_possible > 0 else 0, 1)

        return [
            {"label": "Today's Revenue", "value": f"₹{revenue_today:,.0f}", "change_pct": 0.0, "period": "today"},
            {"label": "Today's Bookings", "value": str(bookings_today), "change_pct": 0.0, "period": "today"},
            {"label": "Revenue MTD", "value": f"₹{revenue_mtd:,.0f}", "change_pct": 0.0, "period": "mtd"},
            {"label": "Utilization", "value": f"{utilization}%", "change_pct": 0.0, "period": "today"},
        ]

    # --- Private helpers ---

    async def _get_court(self, court_id: int) -> dict:
        result = await self.db.execute(
            text("SELECT * FROM court WHERE id = :id"), {"id": court_id}
        )
        row = result.mappings().first()
        if not row:
            raise ValueError(f"Court {court_id} not found")
        return dict(row)

    async def _get_branch(self, branch_id: int) -> dict:
        result = await self.db.execute(
            text("SELECT * FROM branch WHERE id = :id"), {"id": branch_id}
        )
        row = result.mappings().first()
        if not row:
            raise ValueError(f"Branch {branch_id} not found")
        return dict(row)

    async def _get_pricing_rules(self, court_id: int) -> list:
        result = await self.db.execute(
            text(
                """SELECT * FROM pricing_rule
                   WHERE court_id = :cid AND is_active = true
                   ORDER BY day_of_week NULLS LAST, start_time"""
            ),
            {"cid": court_id},
        )
        return result.mappings().all()

    async def _get_slot_price(
        self, court_id: int, target_date: date, start_time: time, end_time: time
    ) -> float:
        court = await self._get_court(court_id)
        rules = await self._get_pricing_rules(court_id)
        duration = court["slot_duration_minutes"]
        rate = float(court["hourly_rate"])

        slots = self.slot_gen.generate_slots(
            court_id=court_id,
            target_date=target_date,
            opening=start_time,
            closing=end_time,
            duration_minutes=duration,
            hourly_rate=rate,
            pricing_rules=[dict(r) for r in rules],
        )
        if slots:
            return slots[0]["price"]
        return rate * duration / 60
