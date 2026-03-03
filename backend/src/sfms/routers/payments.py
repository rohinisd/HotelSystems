from __future__ import annotations

import hashlib
import hmac

import structlog
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from sfms.config import get_settings
from sfms.dependencies import get_current_user, get_db, get_tenant_id, require_roles
from sfms.rate_limit import limiter
from sfms.services.payment_service import PaymentService

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/payments", tags=["Payments"])


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


@router.post("/order/{booking_id}")
@limiter.limit("5/second")
async def create_payment_order(
    request: Request,
    booking_id: int,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    service = PaymentService(db)
    try:
        return await service.create_order(booking_id)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))


@router.post("/verify")
@limiter.limit("5/second")
async def verify_payment(
    request: Request,
    req: VerifyPaymentRequest,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    service = PaymentService(db)
    try:
        return await service.capture_payment(
            req.razorpay_order_id, req.razorpay_payment_id, req.razorpay_signature
        )
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))


@router.post("/cash/{booking_id}")
@limiter.limit("10/minute")
async def record_cash(
    request: Request,
    booking_id: int,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("owner", "manager", "staff")),
    tenant_id: int | None = Depends(get_tenant_id),
):
    if not tenant_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Tenant context required")
    service = PaymentService(db)
    try:
        return await service.record_cash_payment(booking_id, tenant_id)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))


@router.post("/upi/{booking_id}")
@limiter.limit("10/minute")
async def record_upi(
    request: Request,
    booking_id: int,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("owner", "manager", "staff")),
    tenant_id: int | None = Depends(get_tenant_id),
):
    if not tenant_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Tenant context required")
    service = PaymentService(db)
    try:
        return await service.record_upi_payment(booking_id, tenant_id)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))


@router.post("/refund/{payment_id}")
@limiter.limit("5/minute")
async def refund_payment(
    request: Request,
    payment_id: int,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("owner", "manager")),
):
    service = PaymentService(db)
    try:
        return await service.initiate_refund(payment_id)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))


@router.post("/webhook")
@limiter.limit("30/second")
async def razorpay_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Razorpay webhook handler -- no auth, verified via webhook secret."""
    settings = get_settings()

    if not settings.razorpay_webhook_secret:
        logger.warning("webhook_rejected", reason="webhook secret not configured")
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Webhook not configured")

    raw_body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")

    expected = hmac.new(
        settings.razorpay_webhook_secret.encode(),
        raw_body,
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(expected, signature):
        logger.warning("webhook_signature_invalid")
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid webhook signature")

    body = await request.json()
    event = body.get("event")

    if event == "payment.captured":
        payload = body.get("payload", {}).get("payment", {}).get("entity", {})
        order_id = payload.get("order_id")
        payment_id = payload.get("id")

        if order_id and payment_id:
            service = PaymentService(db)
            try:
                await service.capture_payment_from_webhook(order_id, payment_id)
                logger.info("webhook_payment_captured", order_id=order_id)
            except ValueError as e:
                logger.warning("webhook_capture_failed", order_id=order_id, error=str(e))

    return {"status": "ok"}
