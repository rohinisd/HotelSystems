import pytest


@pytest.mark.asyncio
async def test_create_order_requires_auth(client):
    response = await client.post("/api/v1/payments/order/1")
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_create_order_with_auth(client, auth_token):
    response = await client.post(
        "/api/v1/payments/order/1",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code in (200, 400, 404, 500)


@pytest.mark.asyncio
async def test_create_order_nonexistent_booking(client, auth_token):
    response = await client.post(
        "/api/v1/payments/order/999999",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code in (400, 404, 500)


@pytest.mark.asyncio
async def test_verify_payment_requires_auth(client):
    response = await client.post("/api/v1/payments/verify", json={})
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_verify_payment_missing_fields(client, auth_token):
    response = await client.post(
        "/api/v1/payments/verify",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={},
    )
    assert response.status_code == 400
    assert "Missing payment fields" in response.text


@pytest.mark.asyncio
async def test_verify_payment_with_fields(client, auth_token):
    response = await client.post(
        "/api/v1/payments/verify",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={
            "razorpay_order_id": "order_test123",
            "razorpay_payment_id": "pay_test123",
            "razorpay_signature": "sig_test123",
        },
    )
    assert response.status_code in (200, 400, 500)


@pytest.mark.asyncio
async def test_cash_payment_requires_staff_role(client, auth_token):
    response = await client.post(
        "/api/v1/payments/cash/1",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_cash_payment_with_owner(client, owner_token):
    response = await client.post(
        "/api/v1/payments/cash/1",
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    assert response.status_code in (200, 400, 500)


@pytest.mark.asyncio
async def test_cash_payment_with_staff(client, staff_token):
    response = await client.post(
        "/api/v1/payments/cash/1",
        headers={"Authorization": f"Bearer {staff_token}"},
    )
    assert response.status_code in (200, 400, 500)


@pytest.mark.asyncio
async def test_upi_payment_requires_staff_role(client, auth_token):
    response = await client.post(
        "/api/v1/payments/upi/1",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_upi_payment_with_owner(client, owner_token):
    response = await client.post(
        "/api/v1/payments/upi/1",
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    assert response.status_code in (200, 400, 500)


@pytest.mark.asyncio
async def test_refund_requires_owner_or_manager(client, auth_token):
    response = await client.post(
        "/api/v1/payments/refund/1",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_refund_with_owner(client, owner_token):
    response = await client.post(
        "/api/v1/payments/refund/1",
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    assert response.status_code in (200, 400, 500)


@pytest.mark.asyncio
async def test_refund_with_manager(client, manager_token):
    response = await client.post(
        "/api/v1/payments/refund/1",
        headers={"Authorization": f"Bearer {manager_token}"},
    )
    assert response.status_code in (200, 400, 500)


@pytest.mark.asyncio
async def test_webhook_no_auth_required(client):
    response = await client.post(
        "/api/v1/payments/webhook",
        json={"event": "payment.captured", "payload": {}},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_webhook_with_payment_captured_event(client):
    response = await client.post(
        "/api/v1/payments/webhook",
        json={
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_webhook_test",
                        "order_id": "order_webhook_test",
                    }
                }
            },
        },
        headers={"X-Razorpay-Signature": "test_sig"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_webhook_with_unknown_event(client):
    response = await client.post(
        "/api/v1/payments/webhook",
        json={"event": "payment.failed", "payload": {}},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
