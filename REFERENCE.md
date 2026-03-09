# Hotel Systems – Project reference (start to end)

This file is the **single reference** for the Hotel Management System project: decisions, steps, structure, and pointers to other docs. Use it for onboarding, Cursor skills, and deployment.

---

## 1. Project overview

| Item | Value |
|------|--------|
| **Name** | Hotel Management System (HotelSystems) |
| **Stack** | See [DEPLOYMENT_SETUP.md](DEPLOYMENT_SETUP.md) and [ON_SERVER_STACK.md](ON_SERVER_STACK.md) |
| **Backend** | FastAPI (Python 3.12), Uvicorn, SQLAlchemy async, PostgreSQL 16 |
| **Frontend** | Next.js 15, Node 20, React 19, Tailwind, shadcn/ui |
| **Database** | PostgreSQL 16, `btree_gist`; schema in `db/init.sql`, seed in `db/seed.sql` |
| **Run** | Docker Compose (postgres + backend + frontend) or on-server with Nginx + cron backups |

---

## 2. Steps done (chronological log)

| # | Date / phase | What was done |
|---|----------------|----------------|
| 1 | Initial | Copied/adapted structure from SFML (C:\Users\rohin\SFML). Decided stack: Neon or server Postgres, Render/Railway/Koyeb or server, Vercel or server for frontend. |
| 2 | Docs | Created DEPLOYMENT_SETUP.md (GitHub, Neon, Render, Vercel; backend alternatives; physical server vs cloud; cron backup to Google Drive). |
| 3 | Docs | Created ON_SERVER_STACK.md (on-server stack, ports, env vars, Nginx, Git on server, Remote-SSH in Cursor, sync options). |
| 4 | Sync | Added scripts/sync-to-server.ps1 and scripts/sync-to-server.sh for rsync to server. |
| 5 | Git on server | Documented GitHub connection from server (SSH key or HTTPS PAT) in ON_SERVER_STACK.md §15. |
| 6 | App scaffold | Created basic hotel application: backend (FastAPI, hotel_ms), frontend (Next.js 15), db (init.sql, seed.sql), docker (docker-compose.yml), REFERENCE.md, SKILLS.md. Backend: health, auth (login/register), hotels (list hotels + rooms). Frontend: home, login, register, dashboard (hotels + rooms). Seed: one hotel, five rooms; first user created via Register. |
| 7 | Dockerfile fix | Backend Dockerfile: paths relative to backend/ (no `backend/` prefix) so `docker compose` build with `context: ../backend` works. Added COPY alembic.ini and alembic/. |

*(Update this table as you add features, deploy, or change stack.)*

---

## 3. Repository layout

```
HotelSystems/
├── REFERENCE.md          ← This file (master log + pointers)
├── DEPLOYMENT_SETUP.md   ← Cloud/server setup: GitHub, Neon, Render, Vercel, backups
├── ON_SERVER_STACK.md    ← On-server stack, Nginx, Git on server, Cursor Remote-SSH
├── SKILLS.md             ← Cursor skills / agent guidance (high-level)
├── .config/
│   └── .env.example      ← Env template (DB, JWT, CORS, frontend URL)
├── backend/              ← FastAPI app (Python 3.12)
│   ├── src/hotel_ms/     ← Package: main, config, dependencies, routers, models
│   ├── pyproject.toml
│   ├── Dockerfile
│   └── alembic.ini + alembic/
├── frontend/             ← Next.js 15 app
│   ├── app/              ← App Router pages
│   ├── components/
│   ├── package.json
│   ├── next.config.ts
│   └── Dockerfile
├── db/
│   ├── init.sql          ← Schema (hotel, room, users, reservation)
│   └── seed.sql          ← Seed data
├── docker/
│   └── docker-compose.yml
└── scripts/
    ├── sync-to-server.ps1
    └── sync-to-server.sh
```

---

## 4. Key documents (where to look)

| Need | Document / section |
|------|--------------------|
| Architecture diagram, components, ports, file structure | ARCHITECTURE.md |
| Deploy to cloud (Neon, Render, Vercel) | DEPLOYMENT_SETUP.md |
| Run on your own server, Nginx, backups | ON_SERVER_STACK.md |
| Connect Cursor to server | ON_SERVER_STACK.md §14 (sync), “Connect to server in Cursor” |
| Git + GitHub on server | ON_SERVER_STACK.md §15 |
| Git: local → GitHub → server (exact commands) | REFERENCE.md §5a |
| Env vars for backend/frontend | .config/.env.example, ON_SERVER_STACK.md §12 |
| Cursor / AI guidance | SKILLS.md |

---

## 5. How to run locally (Docker)

From repo root:

```bash
cd docker
docker compose up -d --build
```

- Frontend: http://localhost:3000 (or 3001 if mapped)
- Backend API: http://localhost:8001
- API docs: http://localhost:8001/api/docs

Database is seeded from `db/init.sql` and `db/seed.sql` on first start.

---

## 5a. Git commands: local → GitHub → server

Replace `YOUR_USERNAME` and `YOUR_REPO` with your GitHub username and repository name (e.g. `HotelSystems` or `hotel-management-system`).

### A. On your local machine (Cursor / Windows): push to GitHub

If the folder is **not** yet a Git repo:

```bash
cd c:\Users\rohin\OneDrive\Desktop\HotelSystems
git init
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
# Or with SSH: git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO.git
```

Then add, commit, and push:

```bash
git add .
git status
git commit -m "Initial commit: Hotel Management System (backend, frontend, db, docker)"
git push -u origin main
```

If the folder **is** already a Git repo (e.g. you cloned or ran `git init` before):

```bash
cd c:\Users\rohin\OneDrive\Desktop\HotelSystems
git remote -v
# If no remote: git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git add .
git status
git commit -m "Your message"
git push -u origin main
```

---

### B. On your server: get the code from GitHub

**First time (clone):**

```bash
cd /path/where/you/want/the/app   # e.g. /home/ubuntu or /var/www
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
# Or with SSH: git clone git@github.com:YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
```

**Later (update after you push from local):**

```bash
cd /path/to/YOUR_REPO
git pull origin main
# If using Docker: docker compose -f docker/docker-compose.yml up -d --build
```

---

### C. One-line summary

| Step | Where | Commands |
|------|--------|----------|
| Push to GitHub | Local (Cursor) | `git add .` → `git commit -m "..."` → `git push -u origin main` |
| Get code on server (first time) | Server | `git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git` then `cd YOUR_REPO` |
| Update code on server | Server | `cd /path/to/YOUR_REPO` → `git pull origin main` |

---

## 6. Domain model (current)

- **hotel** – One hotel (name, address, contact).
- **room** – Room in a hotel (type, rate, capacity).
- **users** – Staff/guests (email, role: owner, manager, staff, guest).
- **reservation** – Booking of a room (guest, check-in, check-out, status).

Schema and indexes are in `db/init.sql`.

---

## 7. Cursor / skills

- **SKILLS.md** in the repo root describes how to use Cursor for this project (backend, frontend, db, deploy).
- Optional: add `.cursor/skills/*.md` or `.cursor/rules` and reference them from SKILLS.md.

---

## 8. Next steps (suggested)

- [x] Basic auth (login/register) and JWT in backend.
- [x] Frontend: home, login, register, dashboard (hotels + rooms list).
- [ ] Protect dashboard routes with JWT (send Bearer token from frontend).
- [ ] Add reservation CRUD and availability check.
- [ ] Add reservation form on frontend.
- [ ] Configure deployment (Neon + Render + Vercel or server + Nginx + cron backup).
- [ ] Add CI (e.g. GitHub Actions: lint, test, build).

*(Update REFERENCE.md whenever you complete a step or change the stack.)*
