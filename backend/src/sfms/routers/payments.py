from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from sfms.dependencies import get_current_user, get_db, get_tenant_id, require_roles
from sfms.services.payment_service import PaymentService

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/order/{booking_id}")
async def create_payment_order(
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
async def verify_payment(
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    body = await request.json()
    order_id = body.get("razorpay_order_id")
    payment_id = body.get("razorpay_payment_id")
    signature = body.get("razorpay_signature")

    if not all([order_id, payment_id, signature]):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Missing payment fields")

    service = PaymentService(db)
    try:
        return await service.capture_payment(order_id, payment_id, signature)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))


@router.post("/cash/{booking_id}")
async def record_cash(
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
async def record_upi(
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
async def refund_payment(
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
async def razorpay_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Razorpay webhook handler -- no auth, verified via signature."""
    body = await request.json()
    event = body.get("event")

    if event == "payment.captured":
        payload = body.get("payload", {}).get("payment", {}).get("entity", {})
        order_id = payload.get("order_id")
        payment_id = payload.get("id")
        signature = request.headers.get("X-Razorpay-Signature", "")

        if order_id and payment_id:
            service = PaymentService(db)
            try:
                await service.capture_payment(order_id, payment_id, signature)
            except ValueError:
                pass

    return {"status": "ok"}
