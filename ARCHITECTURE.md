# Hotel Systems – Architecture

High-level architecture, components, ports, and file structure.

---

## 1. Architecture diagram

```
                                    ┌─────────────────────────────────────────────────────────────┐
                                    │                     HOST (your server / PC)                  │
                                    │                                                             │
  User browser                      │   ┌─────────────┐         ┌──────────────┐         ┌───────┐ │
  ─────────────►  :3000 (or :3001) │   │  Frontend   │  HTTP   │   Backend    │  async  │ PG 16 │ │
                                    │   │  Next.js 15 │ ──────► │  FastAPI     │ ──────► │ :5432 │ │
                                    │   │  Node 20    │ :8001   │  Python 3.12 │         │ (int) │ │
                                    │   │  React 19   │         │  Uvicorn     │         └───────┘ │
                                    │   └─────────────┘         └──────────────┘              │    │
                                    │          │                        │                     │    │
                                    │          │                        │                     │    │
                                    │   Host :3000                 Host :8001            Host :5433│
                                    │   (or :3001)                  (API + docs)           (DB)    │
                                    └─────────────────────────────────────────────────────────────┘
```

---

## 2. Components and ports

| Component    | Technology           | Container port | Host port (Docker) | Purpose                    |
|-------------|----------------------|----------------|--------------------|----------------------------|
| **Frontend**| Next.js 15, Node 20  | 3000           | **3000** (or 3001) | Web UI (React, Tailwind)   |
| **Backend** | FastAPI, Python 3.12 | 8001           | **8001**           | REST API, auth, business   |
| **Database**| PostgreSQL 16        | 5432           | **5433**           | Data (hotel, room, users, reservations) |

- **Frontend** talks to backend via `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:8001` or `http://72.60.101.226:8001`).
- **Backend** talks to Postgres via `DATABASE_URL` (inside Docker: host `postgres`, port `5432`).
- From the **host**, you use: frontend on **3000** (or 3001), API on **8001**, DB on **5433** (if you need direct DB access).

---

## 3. Apps and stack summary

| Layer     | App / runtime      | Key deps                          |
|----------|--------------------|------------------------------------|
| **Frontend** | Next.js 15 (App Router) | React 19, Tailwind CSS, Node 20   |
| **Backend**  | FastAPI            | Uvicorn, Pydantic v2, SQLAlchemy (async), asyncpg, JWT (python-jose), bcrypt |
| **Database** | PostgreSQL 16     | Alpine image; init from `db/init.sql`, seed from `db/seed.sql` |
| **Orchestration** | Docker Compose | Builds backend + frontend; runs postgres + backend + frontend |

---

## 4. File structure (with ports)

```
HotelSystems/
├── ARCHITECTURE.md         ← This file
├── REFERENCE.md
├── DEPLOYMENT_SETUP.md
├── ON_SERVER_STACK.md
├── SKILLS.md
├── README.md
├── .config/
│   └── .env.example        ← Env template (DB, JWT, CORS, API URL)
│
├── backend/                ← API (exposed on port 8001)
│   ├── src/
│   │   └── hotel_ms/       ← Python package
│   │       ├── __init__.py
│   │       ├── main.py     ← FastAPI app, CORS, routers
│   │       ├── config.py   ← Settings (DB, JWT, CORS)
│   │       ├── dependencies.py
│   │       ├── models/     ← database.py, schemas.py
│   │       └── routers/    ← health, auth, hotels
│   ├── alembic/            ← Migrations
│   ├── alembic.ini
│   ├── pyproject.toml
│   └── Dockerfile
│
├── frontend/               ← Web UI (exposed on port 3000)
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx        ← Home
│   │   ├── login/
│   │   ├── register/
│   │   └── dashboard/      ← Hotels + rooms
│   ├── package.json
│   ├── next.config.ts      ← output: "standalone"
│   └── Dockerfile
│
├── db/                     ← Schema and seed (used by Postgres on 5432/5433)
│   ├── init.sql            ← Tables: hotel, room, users, reservation
│   └── seed.sql
│
├── docker/
│   └── docker-compose.yml  ← Defines postgres:5433, backend:8001, frontend:3000
│
└── scripts/
    ├── sync-to-server.ps1
    └── sync-to-server.sh
```

---

## 5. Request flow

1. **User** → opens browser → **Frontend** (host port **3000** or **3001**).
2. **Frontend** → calls **Backend** (host port **8001**) for API (e.g. `/api/v1/auth/login`, `/api/v1/hotels`).
3. **Backend** → uses **Postgres** (container port **5432**, host **5433**) for data.
4. **Backend** → returns JSON to frontend; frontend renders UI.

---

## 6. URLs (when running on server)

| What        | URL (replace IP with your server)        |
|------------|------------------------------------------|
| Web app    | http://72.60.101.226:3000 (or :3001)     |
| API base   | http://72.60.101.226:8001                |
| API docs   | http://72.60.101.226:8001/api/docs       |
| API ReDoc  | http://72.60.101.226:8001/api/redoc      |
| Health     | http://72.60.101.226:8001/api/v1/health  |

---

## 7. One-page overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│  HOTEL SYSTEMS – ARCHITECTURE OVERVIEW                                   │
├──────────────────────────────────────────────────────────────────────────┤
│  USER  →  Frontend (:3000)  →  Backend (:8001)  →  PostgreSQL (:5433)   │
│           Next.js 15           FastAPI (hotel_ms)   init.sql + seed.sql  │
│           React 19             Uvicorn             hotel, room, users,  │
│           Tailwind             JWT, asyncpg         reservation          │
├──────────────────────────────────────────────────────────────────────────┤
│  PORTS (host): Frontend 3000 | Backend 8001 | Postgres 5433             │
│  REPO: backend/, frontend/, db/, docker/                                 │
└──────────────────────────────────────────────────────────────────────────┘
```
