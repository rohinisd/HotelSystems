# SFMS Implementation Plan

## Complete Architecture, Design Decisions & Phased Roadmap

**Author:** Girish Hiremath | **Date:** March 2, 2026 | **Version:** 1.0

---

## 1. Architecture Overview

### 1.1 System Architecture

```
                    ┌──────────────────────────────────┐
                    │         Vercel (CDN Edge)         │
  Players ─────────│  Next.js 15 + Tailwind + shadcn   │
  Managers          │  Razorpay Checkout (client-side)  │
  Owners            └──────────────┬───────────────────┘
                                   │ NEXT_PUBLIC_API_URL
                                   ▼
                    ┌──────────────────────────────────┐
                    │     Render / Fly.io (Backend)     │
                    │  FastAPI + SQLAlchemy + structlog  │
                    │  Razorpay SDK (server-side)       │
                    └──────────────┬───────────────────┘
                                   │ DATABASE_URL
                                   ▼
                    ┌──────────────────────────────────┐
                    │   Supabase / Neon (PostgreSQL)    │
                    │  Multi-tenant, row-level isolation │
                    │  Exclusion constraints (no overlap)│
                    └──────────────────────────────────┘
```

### 1.2 Tech Stack Decisions

| Layer | Choice | Why |
|---|---|---|
| **Frontend** | Next.js 15 (stable) + App Router | SSR, file-based routing, React 19, edge-ready |
| **UI Kit** | shadcn/ui + Tailwind CSS | Accessible primitives, copy-paste ownership, no vendor lock |
| **Charts** | Recharts | React-native, responsive, lightweight |
| **Backend** | FastAPI + Pydantic v2 | Async-native, auto OpenAPI docs, type-safe |
| **ORM** | SQLAlchemy 2.0 (async) | Industry standard, Alembic migrations, asyncpg driver |
| **Database** | PostgreSQL 16 | Exclusion constraints for overlap prevention, JSONB, GiST |
| **Auth** | JWT (HS256) + bcrypt | Stateless, no session store needed for MVP |
| **Payments** | Razorpay | Indian market leader, UPI/cards/wallets, good test sandbox |
| **Hosting (FE)** | Vercel | Free tier, automatic previews, edge CDN |
| **Hosting (BE)** | Render (primary) / Fly.io (alt) | Docker support, managed Postgres option, free tier |
| **Hosting (DB)** | Supabase or Neon | Free serverless Postgres, connection pooling |
| **Project Structure** | Python Project Blueprint pattern | pyproject.toml hub, src-layout, structlog, ruff, mypy |
| **CI/CD** | GitHub Actions | PR checks, lint, test, deploy automation |

### 1.3 Key Design Decisions

#### Multi-Tenancy: Row-Level Isolation

**Decision:** Every tenant-scoped table includes `facility_id`. Every query filters by it.

**Why not schema-per-tenant?** For the MVP scale (3-5 facilities), row-level isolation is simpler, has zero migration overhead, and a single connection pool serves all tenants. Schema-per-tenant is overkill until 100+ tenants.

**How:** The JWT carries `facility_id`. The `TenantMiddleware` extracts it into `request.state.tenant_id`. Every service method receives and filters by it.

#### Booking Concurrency: Two-Layer Safety

**Decision:** Application-level `SELECT ... FOR UPDATE` + PostgreSQL `EXCLUDE USING gist` constraint.

**Why both?** The app lock handles 99% of concurrent requests gracefully with a user-friendly error. The DB constraint is the final safety net if the app lock is somehow bypassed (e.g., direct DB access, race between two app instances).

#### Slot Generation: Computed, Not Stored

**Decision:** Slots are generated on-the-fly from `opening_time`, `closing_time`, and `slot_duration_minutes`. They are not stored in a table.

**Why?** Storing 365 days x 17 hours x 5 courts = 31,025 rows per court per year is wasteful. Computing slots and overlaying existing bookings is O(slots + bookings), which is fast for a single day view.

#### Pricing: Rule-Based with Day Override

**Decision:** `pricing_rule` table with optional `day_of_week`. First matching rule wins. Day-specific rules override generic rules.

**Why?** Flexible enough for peak/off-peak/weekend without a full pricing engine. Owners can add rules via the dashboard.

#### Auth: JWT in Memory (MVP)

**Decision:** Store JWT in `localStorage` for MVP simplicity. Migrate to httpOnly cookies post-MVP.

**Why?** In-memory tokens (React state) are lost on page refresh. For MVP, `localStorage` with short expiry (60min) is pragmatic. Post-MVP, add refresh tokens + httpOnly cookies for XSS protection.

---

## 2. Skills Created (Reused from FPnA Insights PRO)

| # | Skill | Reused From | What Changed |
|---|---|---|---|
| 1 | `sfms-project-structure` | fpna (general patterns) + Python Blueprint | Monorepo layout, pyproject.toml, structlog, src-layout, naming |
| 2 | `sfms-fastapi-backend` | `fpna-fastapi-backend` | Domain: booking/payments/courts. Added TenantMiddleware, multi-tenant DI |
| 3 | `sfms-nextjs-frontend` | `fpna-nextjs-dashboard` | Domain: booking flow + facility dashboards. INR formatting, slot grid |
| 4 | `sfms-data-layer` | `fpna-data-layer` | Entirely new schema: facility, branch, court, booking, payment, pricing_rule |
| 5 | `sfms-security-auth` | `fpna-security-auth` | Multi-tenant RBAC (5 roles), tenant middleware, Razorpay webhook verification |
| 6 | `sfms-booking-engine` | NEW | Slot generation, availability, concurrency control, cancellation policy |
| 7 | `sfms-payments-razorpay` | NEW | Razorpay order/capture/refund, webhook, cash recording, frontend checkout |
| 8 | `sfms-devops-deploy` | `fpna-devops-deploy` | Same patterns, adapted for SFMS naming and Razorpay env vars |

### Patterns Carried Forward from FPnA

- Application factory pattern (`create_app()`)
- Pydantic Settings with `@lru_cache`
- Centralized API client (`lib/api.ts`)
- KPI card with loading skeletons
- Dashboard layout (collapsible sidebar)
- Multi-stage Docker builds
- GitHub Actions CI with real Postgres
- `.env.example` secrets management
- Error boundaries in Next.js
- Health check endpoints (excluded from auth)

---

## 3. Phased Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

**Goal:** Deployable skeleton with auth, basic CRUD, and database.

```
Deliverables:
├── Project scaffolding (monorepo, pyproject.toml, configs)
├── Database schema + seed data (Postgres in Docker)
├── Auth system (login, register, JWT, roles)
├── Facility/Branch/Court CRUD APIs
├── Health check endpoints
├── Frontend: Login page + dashboard shell (sidebar, topbar)
├── Docker Compose for local dev
└── Git repo with .gitignore, .env.example
```

| Task | Skill Used | Estimate |
|---|---|---|
| Scaffold monorepo structure | `sfms-project-structure` | 2 hrs |
| Create DB schema + seed SQL | `sfms-data-layer` | 3 hrs |
| Docker Compose + Postgres | `sfms-devops-deploy` | 1 hr |
| Auth endpoints (login/register) | `sfms-security-auth` | 4 hrs |
| Tenant middleware | `sfms-security-auth` | 2 hrs |
| Facility/Branch/Court CRUD | `sfms-fastapi-backend` | 4 hrs |
| Frontend: Login + shell | `sfms-nextjs-frontend` | 4 hrs |
| Alembic initial migration | `sfms-data-layer` | 1 hr |

**Phase 1 Exit Criteria:**
- [ ] `docker compose up` starts Postgres + backend + frontend
- [ ] Can login and see empty dashboard
- [ ] CRUD endpoints work via `/api/docs`
- [ ] All 5 roles can authenticate

---

### Phase 2: Booking Engine (Week 3-4)

**Goal:** Players can browse courts and book slots. Staff can create walk-ins.

```
Deliverables:
├── Slot generation service
├── Availability checking with overlap detection
├── Booking creation (online + walk-in)
├── Booking cancellation with policy enforcement
├── Pricing rules engine
├── Frontend: Sport/branch selector → slot grid → checkout
├── Frontend: Manager booking view (today's schedule)
└── Concurrency safety (FOR UPDATE + exclusion constraint)
```

| Task | Skill Used | Estimate |
|---|---|---|
| Slot generator service | `sfms-booking-engine` | 3 hrs |
| Availability check + overlap | `sfms-booking-engine` | 3 hrs |
| Booking CRUD API | `sfms-fastapi-backend` | 4 hrs |
| Pricing rules engine | `sfms-booking-engine` | 3 hrs |
| Concurrency locks | `sfms-booking-engine` | 2 hrs |
| DB exclusion constraint | `sfms-data-layer` | 1 hr |
| Frontend: Booking flow (3 pages) | `sfms-nextjs-frontend` | 8 hrs |
| Frontend: Schedule timeline | `sfms-nextjs-frontend` | 4 hrs |
| Walk-in booking support | `sfms-booking-engine` | 2 hrs |

**Phase 2 Exit Criteria:**
- [ ] Player can browse available slots for any court/date
- [ ] Player can create a booking (status = confirmed)
- [ ] Staff can create walk-in booking
- [ ] Double-booking is impossible (verify with concurrent requests)
- [ ] Pricing varies by time-of-day and day-of-week
- [ ] Manager sees today's schedule as a timeline

---

### Phase 3: Payments (Week 5)

**Goal:** Online payments via Razorpay. Cash payments recorded by staff.

```
Deliverables:
├── Razorpay order creation API
├── Payment verification (signature check)
├── Webhook handler for async confirmation
├── Cash payment recording
├── Refund on cancellation
├── Frontend: Razorpay Checkout integration
├── Frontend: Payment confirmation page
└── Frontend: Cash payment button for staff
```

| Task | Skill Used | Estimate |
|---|---|---|
| Razorpay SDK setup + order API | `sfms-payments-razorpay` | 3 hrs |
| Payment verification endpoint | `sfms-payments-razorpay` | 2 hrs |
| Webhook handler | `sfms-payments-razorpay` | 3 hrs |
| Cash payment endpoint | `sfms-payments-razorpay` | 1 hr |
| Refund flow | `sfms-payments-razorpay` | 2 hrs |
| Frontend: Checkout integration | `sfms-payments-razorpay` | 4 hrs |
| Frontend: Confirmation page | `sfms-nextjs-frontend` | 2 hrs |
| Sandbox end-to-end testing | `sfms-payments-razorpay` | 3 hrs |

**Phase 3 Exit Criteria:**
- [ ] Player completes Razorpay payment in test mode
- [ ] Payment status updates to 'captured' via webhook
- [ ] Staff can record cash payment
- [ ] Cancellation triggers refund for Razorpay payments
- [ ] All payment methods (card, UPI, netbanking) work in sandbox

---

### Phase 4: Dashboards & Reports (Week 6)

**Goal:** Owner/Manager dashboards with KPIs, charts, and exports.

```
Deliverables:
├── Dashboard KPI endpoints (revenue, bookings, utilization)
├── Revenue trend API (daily/weekly/monthly)
├── Court utilization API
├── Revenue export (CSV)
├── Frontend: KPI cards with trends
├── Frontend: Revenue vs Target chart
├── Frontend: Utilization heatmap
├── Frontend: Export button
└── Role-based dashboard views
```

| Task | Skill Used | Estimate |
|---|---|---|
| Dashboard aggregation queries | `sfms-booking-engine` | 4 hrs |
| Revenue trend endpoint | `sfms-fastapi-backend` | 2 hrs |
| Utilization endpoint | `sfms-fastapi-backend` | 2 hrs |
| CSV export endpoint | `sfms-fastapi-backend` | 2 hrs |
| Frontend: KPI cards | `sfms-nextjs-frontend` | 3 hrs |
| Frontend: Revenue chart | `sfms-nextjs-frontend` | 3 hrs |
| Frontend: Utilization chart | `sfms-nextjs-frontend` | 3 hrs |
| Role-based view filtering | `sfms-security-auth` | 2 hrs |

**Phase 4 Exit Criteria:**
- [ ] Owner sees: revenue YTD/MTD, booking count, utilization %
- [ ] Manager sees: today's bookings, quick actions, court status
- [ ] Charts render with real data from bookings
- [ ] Revenue CSV downloads correctly
- [ ] Staff sees simplified view (today only)

---

### Phase 5: Polish & Deploy (Week 7)

**Goal:** Production deployment, UI polish, SMS notifications.

```
Deliverables:
├── SMS notification (booking confirmation)
├── Responsive UI audit (mobile-first)
├── Loading states, error boundaries, empty states
├── Production Docker builds
├── Vercel deployment (frontend)
├── Render deployment (backend)
├── Supabase/Neon database provisioning
├── GitHub Actions CI/CD pipeline
└── .env.example + deployment docs
```

| Task | Skill Used | Estimate |
|---|---|---|
| SMS integration (optional) | `sfms-fastapi-backend` | 3 hrs |
| Mobile responsiveness audit | `sfms-nextjs-frontend` | 4 hrs |
| Loading/error/empty states | `sfms-nextjs-frontend` | 3 hrs |
| Production Dockerfiles | `sfms-devops-deploy` | 2 hrs |
| Vercel deploy | `sfms-devops-deploy` | 1 hr |
| Render/Fly.io deploy | `sfms-devops-deploy` | 2 hrs |
| Database provisioning + seed | `sfms-data-layer` | 2 hrs |
| CI/CD pipeline | `sfms-devops-deploy` | 3 hrs |

**Phase 5 Exit Criteria:**
- [ ] App is live on Vercel + Render
- [ ] Health endpoints return healthy
- [ ] Can complete full booking flow on production
- [ ] Razorpay live keys configured
- [ ] CI runs on every PR

---

### Phase 6: Beta & Iterate (Week 8)

**Goal:** Beta test with 1-2 real facilities. Gather feedback. Fix issues.

```
Deliverables:
├── Beta facility onboarding (seed their data)
├── User acceptance testing
├── Performance monitoring
├── Bug fixes from beta feedback
├── Documentation for facility onboarding
└── v1.1 feature backlog prioritization
```

| Task | Skill Used | Estimate |
|---|---|---|
| Facility onboarding scripts | `sfms-data-layer` | 3 hrs |
| Beta testing + bug fixes | All skills | 8 hrs |
| Performance profiling | `sfms-devops-deploy` | 2 hrs |
| Onboarding documentation | - | 3 hrs |
| v1.1 backlog grooming | - | 2 hrs |

**Phase 6 Exit Criteria:**
- [ ] 1-2 facilities using the system daily
- [ ] No critical bugs in 48 hours
- [ ] Feedback collected and prioritized
- [ ] v1.1 roadmap defined

---

## 4. Post-MVP Roadmap (Phase 2+)

| Feature | Priority | Effort | Phase |
|---|---|---|---|
| Tournament management | Medium | 2 weeks | v1.1 |
| Recurring bookings (weekly/monthly) | High | 1 week | v1.1 |
| Player mobile app (React Native) | Medium | 4 weeks | v1.2 |
| Inventory management (equipment) | Low | 2 weeks | v1.2 |
| HR/Payroll for facility staff | Low | 3 weeks | v2.0 |
| AI utilization forecasting | Medium | 2 weeks | v2.0 |
| Multi-language support (Telugu, Hindi) | Medium | 1 week | v1.1 |
| WhatsApp notifications | High | 1 week | v1.1 |
| Membership/subscription plans | High | 2 weeks | v1.1 |
| Coach scheduling | Low | 2 weeks | v2.0 |

---

## 5. API Endpoint Summary (MVP)

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/login` | Public | Login, returns JWT |
| POST | `/api/v1/auth/register` | Public | Player self-registration |
| POST | `/api/v1/auth/refresh` | Bearer | Refresh token |

### Facilities
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/facilities` | Bearer | List user's facilities |
| POST | `/api/v1/facilities` | Owner | Create facility |
| GET | `/api/v1/facilities/{id}/branches` | Bearer | List branches |
| POST | `/api/v1/facilities/{id}/branches` | Owner/Manager | Create branch |

### Courts
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/courts?branch_id=` | Bearer | List courts |
| POST | `/api/v1/courts` | Owner/Manager | Create court |
| PUT | `/api/v1/courts/{id}` | Owner/Manager | Update court |
| GET | `/api/v1/courts/{id}/pricing` | Bearer | Get pricing rules |

### Bookings
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/bookings/slots?court_id=&date=` | Public | Available slots |
| POST | `/api/v1/bookings` | Bearer | Create booking |
| GET | `/api/v1/bookings` | Bearer | List bookings (filtered) |
| PATCH | `/api/v1/bookings/{id}/cancel` | Bearer | Cancel booking |
| GET | `/api/v1/bookings/schedule?date=` | Staff+ | Today's schedule |

### Payments
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/payments/order/{booking_id}` | Bearer | Create Razorpay order |
| POST | `/api/v1/payments/verify` | Bearer | Verify payment |
| POST | `/api/v1/payments/cash/{booking_id}` | Staff+ | Record cash payment |
| POST | `/api/v1/payments/refund/{payment_id}` | Manager+ | Initiate refund |
| POST | `/api/v1/payments/webhook` | Razorpay | Async payment events |

### Dashboard
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/dashboard/kpis` | Manager+ | Revenue, bookings, utilization |
| GET | `/api/v1/dashboard/revenue-trend` | Manager+ | Daily/weekly/monthly trend |
| GET | `/api/v1/dashboard/utilization` | Manager+ | Court utilization by time |
| GET | `/api/v1/dashboard/export/revenue` | Accountant+ | CSV export |

### Health
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/health` | Public | Service health |
| GET | `/api/v1/health/db` | Public | Database connectivity |

**Total: ~25 endpoints**

---

## 6. Data Model (Entity Relationship)

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ Facility │────<│  Branch   │────<│  Court   │
│ (tenant) │     │          │     │          │
└────┬─────┘     └──────────┘     └────┬─────┘
     │                                  │
     │    ┌──────────┐                  │
     │───<│  Users   │                  │
     │    │ (RBAC)   │            ┌─────┴─────┐
     │    └────┬─────┘            │  Pricing  │
     │         │                  │   Rule    │
     │         │                  └───────────┘
     │    ┌────┴─────┐
     │───<│ Booking  │───< ┌──────────┐
     │    │          │     │ Payment  │
     │    └──────────┘     └──────────┘
     │
```

### Tables: 7 core + indexes

| Table | Row-Level Tenant? | Key Columns |
|---|---|---|
| `facility` | IS the tenant | name, slug, subscription_plan |
| `branch` | Yes (via facility_id) | name, address, opening/closing time |
| `court` | Yes | sport, hourly_rate, peak_hour_rate, slot_duration |
| `users` | Yes (nullable for players) | email, role, facility_id |
| `booking` | Yes | court_id, date, start/end time, status, amount |
| `payment` | Yes | booking_id, razorpay IDs, status, method |
| `pricing_rule` | Yes | court_id, day_of_week, time range, rate |

---

## 7. Cost Estimate (Production)

| Service | Plan | Monthly Cost |
|---|---|---|
| Vercel (frontend) | Hobby (free) | $0 |
| Render (backend) | Free / Starter ($7) | $0-7 |
| Supabase (database) | Free (500 MB) | $0 |
| Razorpay | 2% per transaction | Variable |
| Domain name | .in domain | ~$10/year |
| SMS (optional) | MSG91 / Twilio | $5-20 |
| **Total** | | **$0-27/mo** + txn fees |

---

## 8. Risk Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Double-booking race condition | Medium | High | FOR UPDATE lock + DB exclusion constraint |
| Razorpay webhook failures | Low | Medium | Idempotent handler + retry logic |
| Free tier limits hit | Medium | Medium | Monitor usage, upgrade path clear |
| Multi-tenant data leak | Low | Critical | Middleware + every query filters facility_id |
| Payment disputes | Low | Medium | Audit trail: payment table tracks all state changes |

---

## 9. Getting Started (Day 1)

```bash
# 1. Clone and set up
git init
git remote add origin <your-repo>

# 2. Create .env from template
cp .config/.env.example .env

# 3. Start everything
cd docker && docker compose up -d

# 4. Verify
curl http://localhost:8001/api/v1/health
open http://localhost:3000

# 5. Start coding (Phase 1)
# Backend: cd backend && pip install -e ".[dev]"
# Frontend: cd frontend && npm install && npm run dev
```

---

*This plan is designed to be executed phase-by-phase. Each phase has clear exit criteria. Skills provide the guardrails for consistent, production-quality code across all phases.*
