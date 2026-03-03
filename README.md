# TurfStack

All-in-one sports facility management platform. Online bookings, walk-in management, Razorpay payments, and revenue analytics for pickleball, cricket, badminton and more.

**Live:** [turfstack.vercel.app](https://turfstack.vercel.app)

## Architecture

```
┌──────────────────┐     API calls      ┌───────────────────┐     asyncpg      ┌─────────────┐
│  Vercel (Next.js) │ ────────────────► │  Fly.io (FastAPI)  │ ──────────────► │ Fly Postgres │
│  frontend/        │                   │  backend/          │                 │ (internal)   │
└──────────────────┘                   └───────────────────┘                 └─────────────┘
```

## Tech Stack

| Layer    | Technology                                       |
|----------|--------------------------------------------------|
| Frontend | Next.js 15, Tailwind CSS, shadcn/ui, Sonner      |
| Backend  | FastAPI, SQLAlchemy (async), Pydantic v2          |
| Database | PostgreSQL with `btree_gist` exclusion constraint |
| Payments | Razorpay (online), Cash, UPI                     |
| Auth     | JWT (HS256) with role-based access control        |
| Hosting  | Vercel (frontend), Fly.io (backend + DB)          |

## Features

- **Multi-role dashboard** — Owner, Manager, Staff, Accountant, Player views
- **Real-time slot booking** — DB-level constraint prevents double-bookings
- **Payment processing** — Razorpay checkout, cash/UPI recording, refunds
- **Court management** — CRUD, custom pricing rules, activate/deactivate
- **Schedule timeline** — Visual grid (courts × hourly slots)
- **Team management** — Invite staff, assign roles, activate/deactivate
- **Revenue analytics** — KPIs, trend charts, utilization heatmap
- **Branch management** — Multi-location support
- **Rate limiting** — Brute-force protection on auth and payment endpoints
- **Token refresh** — Seamless session renewal with 401 interceptor

## Local Development

### Prerequisites

- Python 3.12+
- Node.js 18+
- PostgreSQL 16+ (or Docker)

### Backend

```bash
cd backend
python -m venv .venv
.venv/bin/activate          # or .venv\Scripts\activate on Windows
pip install -e .

# Set up environment
cp .env.example .env        # Edit DATABASE_URL, JWT_SECRET, etc.

# Initialize database
psql -d sfms -f ../db/init.sql
psql -d sfms -f ../db/seed.sql

# Run
uvicorn sfms.main:app --reload --port 8001
```

API docs at http://localhost:8001/api/docs

### Frontend

```bash
cd frontend
npm install

# Set up environment
echo "NEXT_PUBLIC_API_URL=http://localhost:8001" > .env.local

npm run dev
```

App at http://localhost:3000

## Environment Variables

### Backend

| Variable              | Description                          |
|-----------------------|--------------------------------------|
| `DATABASE_URL`        | PostgreSQL connection string         |
| `JWT_SECRET`          | Secret key for HS256 tokens          |
| `CORS_ORIGINS`        | Comma-separated allowed origins      |
| `RAZORPAY_KEY_ID`     | Razorpay API key                     |
| `RAZORPAY_KEY_SECRET` | Razorpay API secret                  |

### Frontend

| Variable                  | Description                 |
|---------------------------|-----------------------------|
| `NEXT_PUBLIC_API_URL`     | Backend API base URL        |
| `NEXT_PUBLIC_RAZORPAY_KEY`| Razorpay publishable key    |

## Deployment

**Backend** → Fly.io

```bash
cd backend
fly deploy
```

**Frontend** → Vercel (auto-deploys on push to `main`/`master`)

```bash
cd frontend
npx vercel --prod
```

Always deploy backend first when both services change.

## Project Structure

```
├── backend/
│   ├── src/sfms/
│   │   ├── main.py              # FastAPI app factory
│   │   ├── config.py            # pydantic-settings
│   │   ├── dependencies.py      # Auth, tenant, role guards
│   │   ├── routers/             # API endpoints
│   │   └── services/            # Business logic
│   ├── Dockerfile
│   └── fly.toml
├── frontend/
│   ├── app/                     # Next.js App Router pages
│   ├── components/              # Shared UI components
│   └── lib/                     # API client, auth helpers
├── db/
│   ├── init.sql                 # Schema
│   └── seed.sql                 # Demo data
└── .cursor/skills/              # Agent skills for this project
```

## API Endpoints

| Method | Path                           | Auth       | Description              |
|--------|--------------------------------|------------|--------------------------|
| POST   | `/api/v1/auth/login`           | Public     | Login                    |
| POST   | `/api/v1/auth/register`        | Public     | Register                 |
| GET    | `/api/v1/auth/me`              | Any        | Current user profile     |
| PATCH  | `/api/v1/auth/me`              | Any        | Update profile           |
| GET    | `/api/v1/courts`               | Any        | List courts (paginated)  |
| POST   | `/api/v1/courts`               | Owner/Mgr  | Create court             |
| GET    | `/api/v1/bookings/slots`       | Public     | Available slots          |
| POST   | `/api/v1/bookings`             | Any        | Create booking           |
| GET    | `/api/v1/bookings`             | Any        | List bookings (paginated)|
| POST   | `/api/v1/payments/order/:id`   | Any        | Create Razorpay order    |
| POST   | `/api/v1/payments/verify`      | Any        | Verify payment           |
| GET    | `/api/v1/users`                | Owner/Mgr  | List team members        |
| POST   | `/api/v1/users`                | Owner      | Invite team member       |
| GET    | `/api/v1/dashboard/kpis`       | Owner/Mgr  | Dashboard KPIs           |

## Contributing

1. Create a feature branch from `master`
2. Make changes and test locally
3. Open a pull request using the template in `.github/PULL_REQUEST_TEMPLATE.md`

## License

Private — all rights reserved.
