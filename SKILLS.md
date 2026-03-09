# Hotel Systems – Cursor skills and reference

Use this file when creating or updating **Cursor rules**, **Agent Skills** (`.cursor/skills/*.md`), or project docs. It summarizes the stack and conventions so Cursor can generate consistent code and docs.

---

## 1. Project and stack

- **Name:** Hotel Management System (HotelSystems).
- **Backend:** FastAPI (Python 3.12), package `hotel_ms`, Uvicorn on port 8001. Async SQLAlchemy + asyncpg. No Sentry/Razorpay in minimal setup.
- **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS. Port 3000. `NEXT_PUBLIC_API_URL` points to backend.
- **Database:** PostgreSQL 16. Schema in `db/init.sql`, seed in `db/seed.sql`. Tables: `hotel`, `room`, `users`, `reservation`.
- **Run:** Docker Compose in `docker/` (postgres, backend, frontend). See REFERENCE.md and ON_SERVER_STACK.md for on-server and cloud deploy.

---

## 2. Repo layout

- **REFERENCE.md** – Master log of steps and decisions; single place to update when adding features or changing stack.
- **backend/src/hotel_ms/** – Main package: `main.py`, `config.py`, `dependencies.py`, `models/`, `routers/` (health, auth, hotels).
- **frontend/app/** – App Router: `layout.tsx`, `page.tsx`, `login/`, `register/`, `dashboard/`.
- **db/** – `init.sql`, `seed.sql`.
- **docker/docker-compose.yml** – Three services; backend build context `../backend`, frontend `../frontend`.

---

## 3. Conventions for Cursor

- **Backend:** Pydantic v2 for request/response schemas. Use `Depends(get_db)` for DB. Auth: JWT in `Authorization: Bearer <token>`. Routers under `api/v1`.
- **Frontend:** Use `NEXT_PUBLIC_API_URL` for all API calls. Store token in `localStorage` for auth; send in `Authorization` header when needed.
- **Database:** Table names singular (`hotel`, `room`, `users`, `reservation`). Use raw SQL in routers for this minimal app; can switch to ORM later.
- **Docs:** When adding a feature or deploy step, add a line to the “Steps done” table in **REFERENCE.md**.

---

## 4. Creating Cursor Skills (SKILLS)

To add a **Cursor Skill** (e.g. for backend, frontend, or deploy):

1. Create a file under `.cursor/skills/`, e.g. `hotel-backend.md` or `hotel-deploy.md`.
2. Start with a short description and when to use it (e.g. “Use when working on FastAPI endpoints or hotel_ms package”).
3. Include: stack (FastAPI, hotel_ms, ports, env vars), layout (routers, models, dependencies), and 2–3 key conventions (auth, DB, API prefix).
4. Point to **REFERENCE.md** for the master log and **ON_SERVER_STACK.md** / **DEPLOYMENT_SETUP.md** for deploy.

Use **SKILLS.md** (this file) as the high-level source when writing those skill files.

---

## 5. Creating docs from REFERENCE.md

- **REFERENCE.md** has: project overview, chronological “Steps done”, repo layout, key docs pointer, how to run (Docker), domain model, next steps.
- When you add a feature or change the stack: append to “Steps done” and update “Next steps” or “Domain model” if needed.
- Use REFERENCE.md as the single source for “what we did” and “where to look”; other docs (DEPLOYMENT_SETUP, ON_SERVER_STACK) stay focused on their topic.

---

## 6. Quick reference

| Need | File / location |
|------|------------------|
| Master log, steps, layout | REFERENCE.md |
| Deploy (cloud or server) | DEPLOYMENT_SETUP.md, ON_SERVER_STACK.md |
| Env vars | .config/.env.example |
| Backend entrypoint | backend/src/hotel_ms/main.py |
| API base | /api/v1 (health, auth, hotels) |
| Frontend env | NEXT_PUBLIC_API_URL |
| Cursor / skills | SKILLS.md (this file), optional .cursor/skills/*.md |
