# TableBook (HotelSystems) – Project reference (start to end)

This file is the **single reference** for the **Restaurant Table Booking SaaS** project: decisions, steps, structure, and pointers to other docs. Use it for onboarding, Cursor skills, and deployment.

---

## 1. Project overview

| Item | Value |
|------|--------|
| **Name** | TableBook – Restaurant table booking SaaS (repo: HotelSystems) |
| **Stack** | See [DEPLOYMENT_SETUP.md](DEPLOYMENT_SETUP.md) and [ON_SERVER_STACK.md](ON_SERVER_STACK.md) |
| **Backend** | FastAPI (Python 3.12), Uvicorn, SQLAlchemy async, PostgreSQL 16 |
| **Frontend** | Next.js 15, Node 20, React 19, Tailwind |
| **Database** | PostgreSQL 16; schema in `db/init.sql` (restaurant, restaurant_table, users, reservation), seed in `db/seed.sql` |
| **Run** | Docker Compose (postgres + backend + frontend) or on-server with Nginx + cron backups |
| **SaaS** | Multi-tenant: one row per restaurant; customers can customize their page (theme, logo, colors) via **Dashboard → Customize** |

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
| 8 | Restaurant SaaS | Converted from hotel/room to **restaurant table booking SaaS**. DB: restaurant (with theme columns), restaurant_table, reservation; backend: restaurants, tables, reservations, PATCH customize; frontend: home (list restaurants), restaurant page (by slug), book a table, dashboard (reservations + link to Customize), **Customize page** (name, tagline, logo, primary/secondary colour, address, etc.). Seed: one restaurant, five tables, one owner user. |
| 9 | Google Auth | **Sign in with Google** and **register with email/password** (including Gmail). Backend: `google-auth`, `POST /api/v1/auth/google` (verifies ID token, find-or-create user), env `GOOGLE_CLIENT_ID`. Frontend: `@react-oauth/google`, Google Sign-In button on login and register; env `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. See §5b. |
| 10 | Google Client ID in env examples | Added Google OAuth Client ID to `docker/.env.server.example` and `.config/.env.example`. **Never commit the Client Secret**; our flow uses only the Client ID. |
| 11 | Meghana-style UI | Redesigned frontend to resemble Meghana Foods (meghanafoods.in): tango orange (#EA580C) primary, DM Sans font, section-container, white bg, clean navbar (Sign In / Register), hero + restaurant grid on home, same flows (Google OAuth, email login/register, dashboard, customize). All local setup and custom settings unchanged. |

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
│   ├── init.sql          ← Schema (restaurant, restaurant_table, users, reservation)
│   └── seed.sql          ← Seed data (one restaurant, tables, owner user)
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

Database is seeded from `db/init.sql` and `db/seed.sql` on first start. **If you had the previous hotel/room schema**, use a fresh database (drop and recreate) or add a migration; the new schema uses `restaurant`, `restaurant_table`, and a different `reservation` shape.

**Fix “Network error” on server:** When the app is at `http://72.60.101.226:3000`, the browser must call the API at the same host. Set `NEXT_PUBLIC_API_URL=http://72.60.101.226:8001` and add `http://72.60.101.226:3000` to backend `CORS_ORIGINS`. Rebuild the frontend so the new API URL is baked in.

---

## 5b. Google Auth (Sign in with Google)

- **Backend:** Set `GOOGLE_CLIENT_ID` to your Google Cloud OAuth 2.0 Client ID (Web application). Same value is used to verify the ID token.
- **Frontend:** Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` to the same Client ID (needed for the Google button).
- **Google Cloud Console:** Create a project → APIs & Services → Credentials → Create OAuth 2.0 Client ID (Web application). Add authorized JavaScript origins: `http://localhost:3000`, `http://72.60.101.226:3000` (and your production domain). No redirect URI needed for the One Tap/button flow we use.
- **Security:** Use only the **Client ID** in env files. **Never commit the Client Secret** (e.g. `GOCSPX-...`); keep it only in local/server `.env` if you need it elsewhere. Our Sign-in with Google flow does not require the secret.
- If either env var is missing, the Google button is hidden; email/password login and register still work.

---

## 5a. Git commands: local → GitHub → server

**Repo:** `https://github.com/rohinisd/HotelSystems`

**Push (local → GitHub):**
```bash
cd c:\Users\rohin\OneDrive\Desktop\HotelSystems
git remote set-url origin https://github.com/rohinisd/HotelSystems.git
git add -A
git status
git commit -m "Your message"
git push origin main
```

**Pull (server ← GitHub):**
```bash
cd /path/to/HotelSystems
git pull origin main
```

**First-time clone on server:**
```bash
git clone https://github.com/rohinisd/HotelSystems.git
cd HotelSystems
```

---

*(Below: generic instructions if you use a different repo.)*

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

- **restaurant** – One tenant (name, slug, address, **logo_url, primary_color, secondary_color**, tagline, etc.) for SaaS customization.
- **restaurant_table** – Table in a restaurant (name, capacity, min_party, max_party).
- **users** – Staff/guests (restaurant_id for owners/staff, email, role).
- **reservation** – Table booking (restaurant_id, table_id, date, time, party_size, guest details, status).

Schema and indexes are in `db/init.sql`. Restaurant owners can **customize** their public page via Dashboard → Customize (theme, logo, colours).

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
