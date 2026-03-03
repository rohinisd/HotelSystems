from __future__ import annotations

import hashlib
import hmac

import razorpay
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from sfms.config import get_settings


class PaymentService:
    """Razorpay payment integration: orders, capture, cash, refunds."""

    def __init__(self, db: AsyncSession):
        self.db = db
        settings = get_settings()
        self.key_id = settings.razorpay_key_id
        self.key_secret = settings.razorpay_key_secret
        if self.key_id and self.key_secret:
            self.client = razorpay.Client(auth=(self.key_id, self.key_secret))
        else:
            self.client = None

    async def create_order(self, booking_id: int) -> dict:
        result = await self.db.execute(
            text("SELECT id, amount, facility_id FROM booking WHERE id = :id AND status = 'confirmed'"),
            {"id": booking_id},
        )
        row = result.mappings().first()
        if not row:
            raise ValueError("Booking not found or not in confirmed state")

        if not self.client:
            raise ValueError("Razorpay not configured")

        amount_paise = int(float(row["amount"]) * 100)
        order = self.client.order.create({
            "amount": amount_paise,
            "currency": "INR",
            "receipt": f"booking_{booking_id}",
            "notes": {"booking_id": str(booking_id), "facility_id": str(row["facility_id"])},
        })

        await self.db.execute(
            text(
                """INSERT INTO payment (facility_id, booking_id, amount, currency, status, method, razorpay_order_id)
                   VALUES (:fid, :bid, :amount, 'INR', 'pending', 'razorpay', :order_id)
                   ON CONFLICT DO NOTHING"""
            ),
            {
                "fid": row["facility_id"],
                "bid": booking_id,
                "amount": float(row["amount"]),
                "order_id": order["id"],
            },
        )
        await self.db.commit()

        return {
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "key_id": self.key_id,
            "booking_id": booking_id,
        }

    def verify_signature(self, order_id: str, payment_id: str, signature: str) -> bool:
        message = f"{order_id}|{payment_id}"
        expected = hmac.new(
            self.key_secret.encode(), message.encode(), hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected, signature)

    async def capture_payment(self, order_id: str, payment_id: str, signature: str) -> dict:
        if not self.verify_signature(order_id, payment_id, signature):
            raise ValueError("Invalid payment signature")

        await self.db.execute(
            text(
                """UPDATE payment
                   SET status = 'captured', razorpay_payment_id = :pid,
                       razorpay_signature = :sig, paid_at = NOW()
                   WHERE razorpay_order_id = :oid AND status = 'pending'"""
            ),
            {"pid": payment_id, "sig": signature, "oid": order_id},
        )
        await self.db.commit()
        return {"status": "captured", "payment_id": payment_id}

    async def capture_payment_from_webhook(self, order_id: str, payment_id: str) -> dict:
        """Capture payment from a webhook event (signature already verified at HTTP layer)."""
        await self.db.execute(
            text(
                """UPDATE payment
                   SET status = 'captured', razorpay_payment_id = :pid, paid_at = NOW()
                   WHERE razorpay_order_id = :oid AND status = 'pending'"""
            ),
            {"pid": payment_id, "oid": order_id},
        )
        await self.db.commit()
        return {"status": "captured", "payment_id": payment_id}

    async def record_cash_payment(self, booking_id: int, facility_id: int) -> dict:
        existing = await self.db.execute(
            text("SELECT id FROM payment WHERE booking_id = :bid AND status = 'captured'"),
            {"bid": booking_id},
        )
        if existing.first():
            raise ValueError("Payment already recorded for this booking")

        await self.db.execute(
            text(
                """INSERT INTO payment (facility_id, booking_id, amount, currency, status, method, paid_at)
                   SELECT :fid, :bid, amount, 'INR', 'captured', 'cash', NOW()
                   FROM booking WHERE id = :bid"""
            ),
            {"fid": facility_id, "bid": booking_id},
        )
        await self.db.commit()
        return {"status": "captured", "method": "cash", "booking_id": booking_id}

    async def record_upi_payment(self, booking_id: int, facility_id: int) -> dict:
        existing = await self.db.execute(
            text("SELECT id FROM payment WHERE booking_id = :bid AND status = 'captured'"),
            {"bid": booking_id},
        )
        if existing.first():
            raise ValueError("Payment already recorded for this booking")

        await self.db.execute(
            text(
                """INSERT INTO payment (facility_id, booking_id, amount, currency, status, method, paid_at)
                   SELECT :fid, :bid, amount, 'INR', 'captured', 'upi', NOW()
                   FROM booking WHERE id = :bid"""
            ),
            {"fid": facility_id, "bid": booking_id},
        )
        await self.db.commit()
        return {"status": "captured", "method": "upi", "booking_id": booking_id}

    async def initiate_refund(self, payment_id: int) -> dict:
        result = await self.db.execute(
            text("SELECT razorpay_payment_id, amount, method FROM payment WHERE id = :id AND status = 'captured'"),
            {"id": payment_id},
        )
        row = result.mappings().first()
        if not row:
            raise ValueError("Payment not found or not refundable")

        if row["method"] == "razorpay" and row["razorpay_payment_id"] and self.client:
            refund = self.client.payment.refund(row["razorpay_payment_id"], {
                "amount": int(float(row["amount"]) * 100),
            })
            refund_id = refund.get("id", "manual")
        else:
            refund_id = "manual_refund"

        await self.db.execute(
            text("UPDATE payment SET status = 'refunded' WHERE id = :id"),
            {"id": payment_id},
        )
        await self.db.commit()
        return {"refund_id": refund_id, "status": "refunded"}
