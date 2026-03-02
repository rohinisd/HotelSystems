"""
Production Smoke Test for SFMS
Tests the full booking flow against the live API.
"""
import json
import sys
import time
import urllib.request
import urllib.error

API = "https://sfms-api.fly.dev"
RESULTS = []


def req(method, path, body=None, token=None):
    url = f"{API}{path}"
    data = json.dumps(body).encode() if body else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=30) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        try:
            body = e.read().decode()
            return e.code, json.loads(body) if body else {"error": str(e)}
        except Exception:
            return e.code, {"error": str(e)}
    except Exception as e:
        return 0, str(e)


def test(name, passed, detail=""):
    status = "PASS" if passed else "FAIL"
    RESULTS.append((name, passed))
    print(f"  [{status}] {name}" + (f" -- {detail}" if detail and not passed else ""))


def main():
    ts = int(time.time())
    test_email = f"smoketest_{ts}@test.com"
    test_password = "Test1234!"

    print("\n=== SFMS Production Smoke Test ===\n")
    print(f"API: {API}")
    print(f"Test user: {test_email}\n")

    # 1. Health check
    print("[Step 1] Health Check")
    code, data = req("GET", "/api/v1/health")
    test("Health endpoint returns 200", code == 200)
    test("Health status is healthy", isinstance(data, dict) and data.get("status") == "healthy")

    # 2. Register a new user
    print("\n[Step 2] User Registration")
    code, data = req("POST", "/api/v1/auth/register", {
        "email": test_email,
        "password": test_password,
        "full_name": "Smoke Test User",
        "phone": "9876543210"
    })
    test("Register returns 200/201", code in (200, 201), f"code={code}, data={data}")
    token = data.get("access_token", "") if isinstance(data, dict) else ""
    test("Register returns access_token", bool(token), f"token={'present' if token else 'missing'}")

    # 3. Login with the registered user
    print("\n[Step 3] Login")
    code, data = req("POST", "/api/v1/auth/login", {
        "email": test_email,
        "password": test_password,
    })
    test("Login returns 200", code == 200, f"code={code}, data={data}")
    token = data.get("access_token", "") if isinstance(data, dict) else ""
    test("Login returns access_token", bool(token))

    if not token:
        print("\n  FATAL: No token, cannot continue tests.\n")
        return summarize()

    # 4. Get current user profile
    print("\n[Step 4] Get Profile (/me)")
    code, data = req("GET", "/api/v1/auth/me", token=token)
    test("GET /me returns 200", code == 200, f"code={code}")
    test("Profile has email", isinstance(data, dict) and data.get("email") == test_email)
    user_id = data.get("id") if isinstance(data, dict) else None

    # 5. List facilities
    print("\n[Step 5] List Facilities")
    code, data = req("GET", "/api/v1/facilities", token=token)
    test("GET /facilities returns 200", code == 200, f"code={code}, data={data}")
    facilities = data if isinstance(data, list) else []
    test("Facilities list is returned", isinstance(data, list), f"type={type(data)}")

    facility_id = None
    if facilities:
        facility_id = facilities[0].get("id")
        print(f"  (Found existing facility: id={facility_id})")

    # 6. List courts
    print("\n[Step 6] List Courts")
    code, data = req("GET", "/api/v1/courts", token=token)
    test("GET /courts returns 200", code == 200, f"code={code}, data={data}")
    courts = data if isinstance(data, list) else []
    test("Courts list is returned", isinstance(data, list))

    court_id = None
    if courts:
        court_id = courts[0].get("id")
        court_name = courts[0].get("name", "?")
        print(f"  (Found court: id={court_id}, name={court_name})")

    # 7. Get available slots
    if court_id:
        print("\n[Step 7] Get Available Slots")
        from datetime import date, timedelta
        tomorrow = (date.today() + timedelta(days=1)).isoformat()
        code, data = req("GET", f"/api/v1/bookings/slots?court_id={court_id}&date={tomorrow}", token=token)
        test("GET /slots returns 200", code == 200, f"code={code}")
        slots = data if isinstance(data, list) else []
        test("Slots list returned", isinstance(data, list))
        available_slots = [s for s in slots if s.get("is_available")]
        test("Has available slots", len(available_slots) > 0, f"available={len(available_slots)}, total={len(slots)}")

        # 8. Create a booking
        if available_slots:
            print("\n[Step 8] Create Booking")
            slot = available_slots[0]
            code, data = req("POST", "/api/v1/bookings", {
                "court_id": court_id,
                "date": tomorrow,
                "start_time": slot["start_time"],
                "end_time": slot["end_time"],
                "booking_type": "online",
                "player_name": "Smoke Test Player",
                "player_phone": "9876543210",
            }, token=token)
            test("POST /bookings returns 200/201", code in (200, 201), f"code={code}, data={data}")
            booking_id = data.get("id") if isinstance(data, dict) else None
            test("Booking has ID", booking_id is not None, f"booking_id={booking_id}")

            # 9. List bookings
            if booking_id:
                print("\n[Step 9] List Bookings")
                code, data = req("GET", f"/api/v1/bookings?date={tomorrow}", token=token)
                test("GET /bookings returns 200", code == 200)
                test("Bookings list has our booking", any(
                    b.get("id") == booking_id for b in (data if isinstance(data, list) else [])
                ))

                # 10. Cancel booking
                print("\n[Step 10] Cancel Booking")
                code, data = req("PATCH", f"/api/v1/bookings/{booking_id}/cancel", token=token)
                test("PATCH /cancel returns 200", code == 200, f"code={code}, data={data}")
                test("Booking status is cancelled", isinstance(data, dict) and data.get("status") == "cancelled")
        else:
            print("\n  SKIP: No available slots to book")
    else:
        print("\n  SKIP: No courts found, skipping slots/booking tests")

    # 11. Dashboard KPIs
    print("\n[Step 11] Dashboard KPIs")
    code, data = req("GET", "/api/v1/dashboard/kpis", token=token)
    test("GET /dashboard/kpis returns 200", code == 200, f"code={code}, data={data}")

    # 12. Revenue Trend
    print("\n[Step 12] Revenue Trend")
    code, data = req("GET", "/api/v1/dashboard/revenue-trend", token=token)
    test("GET /revenue-trend returns 200", code == 200, f"code={code}, data={data}")

    # 13. Utilization
    print("\n[Step 13] Utilization")
    code, data = req("GET", "/api/v1/dashboard/utilization", token=token)
    test("GET /utilization returns 200", code == 200, f"code={code}, data={data}")

    # 14. API Docs accessible
    print("\n[Step 14] API Docs")
    try:
        r = urllib.request.urlopen(f"{API}/api/docs", timeout=15)
        test("Swagger docs accessible", r.status == 200)
    except Exception as e:
        test("Swagger docs accessible", False, str(e))

    return summarize()


def summarize():
    print("\n" + "=" * 50)
    passed = sum(1 for _, p in RESULTS if p)
    total = len(RESULTS)
    failed = total - passed
    print(f"Results: {passed}/{total} passed, {failed} failed")
    if failed:
        print("\nFailed tests:")
        for name, p in RESULTS:
            if not p:
                print(f"  - {name}")
    print("=" * 50)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
