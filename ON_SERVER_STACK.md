# On-Server Stack for Hotel Management System

This document describes the **full stack** to run the application on your **physical server**, in the same style as the SFML (Sports Facility Management) project: same layout, same tech choices, with server-native deployment and backup to Google Drive.

---

## 1. Architecture Overview

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                    Your physical server                  │
                    │                                                          │
  Internet          │  ┌─────────────┐    ┌──────────────┐    ┌────────────┐  │
  ─────────►  Nginx │  │  Next.js    │───►│  FastAPI     │───► │ PostgreSQL │  │
  (HTTPS)    or     │  │  frontend   │    │  backend     │    │  (port     │  │
                    │  │  :3000      │    │  :8001       │    │  5432)     │  │
                    │  └─────────────┘    └──────────────┘    └────────────┘  │
                    │         │                    │                   │      │
                    │         └────────────────────┴───────────────────┘      │
                    │                          cron                             │
                    │                    pg_dump + rclone                      │
                    └──────────────────────────┬──────────────────────────────┘
                                                │
                                                ▼
                                         Google Drive
                                    (DB + app backups)
```

---

## 2. Stack Summary (aligned with SFML)

| Layer | Technology | Version / notes |
|-------|------------|-----------------|
| **OS** | Linux | Ubuntu 22.04 LTS or Debian 12 (recommended for long-term support) |
| **Reverse proxy** | Nginx or Caddy | Terminates HTTPS, forwards to frontend (3000) and backend (8001) |
| **Database** | PostgreSQL | 16+ (with `btree_gist` extension for constraints) |
| **Backend** | FastAPI (Python) | 3.12, Uvicorn, SQLAlchemy async, Pydantic v2 |
| **Frontend** | Next.js | 15.x, Node 20, React 19, Tailwind, shadcn/ui |
| **Process manager** | Docker Compose (recommended) or systemd | Runs Postgres + backend + frontend; optional systemd for non-Docker |
| **Backups** | cron + pg_dump + rclone (or gdrive) | Daily DB (+ optional app) backup → Google Drive |

---

## 3. Project Layout (same as SFML)

Use the same folder structure as `C:\Users\rohin\SFML`:

```
HotelSystems/   (or your repo root)
├── backend/           # FastAPI app
│   ├── src/           # Python package (e.g. sfms or hotel_ms)
│   │   └── __init__.py
│   │   └── main.py    # FastAPI app
│   ├── alembic/       # DB migrations
│   ├── alembic.ini
│   ├── pyproject.toml
│   ├── Dockerfile
│   └── ...
├── frontend/          # Next.js app
│   ├── app/           # App router pages
│   ├── components/
│   ├── package.json
│   ├── next.config.ts # must have output: "standalone" for Docker
│   ├── Dockerfile
│   └── ...
├── db/                # Schema and seed data
│   ├── init.sql       # CREATE EXTENSION btree_gist; CREATE TABLE ...
│   └── seed.sql       # Initial data
├── docker/
│   └── docker-compose.yml   # postgres, backend, frontend
├── .config/
│   └── .env.example
├── DEPLOYMENT_SETUP.md
└── ON_SERVER_STACK.md       # this file
```

---

## 4. Ports and URLs

| Service | Internal port | Host port (Docker) | Purpose |
|---------|----------------|--------------------|---------|
| PostgreSQL | 5432 | 5432 or 5433 | Database (avoid conflict with local Postgres) |
| Backend (FastAPI) | 8001 | 8001 | API and health checks |
| Frontend (Next.js) | 3000 | 3000 or 3001 | Web UI |

- **Local / server access:** Frontend at `http://localhost:3000` (or 3001), API at `http://localhost:8001`.
- **Production (with Nginx/Caddy):** One public HTTPS domain; reverse proxy forwards e.g. `/api` → backend:8001, `/` → frontend:3000.

---

## 5. Technology Versions (match SFML)

| Component | Version |
|-----------|---------|
| Python | 3.12+ |
| Node.js | 20 LTS |
| PostgreSQL | 16 |
| Next.js | 15.x |
| React | 19 |
| FastAPI | 0.115+ |
| Uvicorn | 0.30+ |
| SQLAlchemy | 2.x (async) |
| asyncpg | 0.30+ |

---

## 6. Backend Stack (FastAPI)

- **Runtime:** Python 3.12.
- **Framework:** FastAPI.
- **ASGI server:** Uvicorn (e.g. `uvicorn sfms.main:app --host 0.0.0.0 --port 8001 --workers 2`).
- **DB:** SQLAlchemy 2 (async) + asyncpg; connection string `postgresql+asyncpg://...`.
- **Auth:** JWT (HS256), stored in env as `JWT_SECRET`.
- **Payments (optional):** Razorpay; `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`.
- **Migrations:** Alembic (in `backend/`).

Key env vars for backend on server:

- `DATABASE_URL` = `postgresql+asyncpg://user:pass@postgres:5432/dbname` (Docker) or `@localhost:5432/dbname` (host Postgres).
- `JWT_SECRET`, `CORS_ORIGINS` (e.g. `["https://your-domain.com"]`), `APP_ENV=production`, optional Razorpay and Sentry.

---

## 7. Frontend Stack (Next.js)

- **Runtime:** Node 20.
- **Framework:** Next.js 15 (App Router).
- **UI:** Tailwind CSS, shadcn/ui, Lucide icons.
- **State / API:** TanStack Query; `NEXT_PUBLIC_API_URL` points to backend (e.g. `https://your-domain.com/api` or `http://localhost:8001` in dev).
- **Build:** `next build` with `output: "standalone"` in `next.config.ts` for Docker.

---

## 8. Database (PostgreSQL)

- **Version:** 16.
- **Extension:** `btree_gist` (required for exclusion constraints, e.g. slot booking).
- **Schema:** Applied from `db/init.sql` then `db/seed.sql` (or via Alembic if you migrate from SFML).
- **On server:** Either run Postgres in Docker (see below) or install natively and run init/seed once.

---

## 9. Running on Server: Two Options

### Option A: Docker Compose (recommended, same as SFML)

From repo root or `docker/`:

```bash
cd docker
docker compose up -d --build
```

- **postgres:** image `postgres:16-alpine`, volumes for data and for `../db/init.sql`, `../db/seed.sql` in `docker-entrypoint-initdb.d`.
- **backend:** build from `../backend`, env from `.env` or `environment` in compose; depends on postgres health.
- **frontend:** build from `../frontend`, env `NEXT_PUBLIC_API_URL=http://backend:8001` (or public URL if frontend talks to backend via Nginx).

Use a `.env` next to `docker-compose.yml` with `POSTGRES_PASSWORD`, `JWT_SECRET`, `DATABASE_URL`, `CORS_ORIGINS`, etc.

### Option B: Native install (no Docker)

- Install **PostgreSQL 16**, **Python 3.12**, **Node 20** on the server.
- Create DB, run `db/init.sql` and `db/seed.sql` (or Alembic).
- Backend: create venv, `pip install -e .`, run Uvicorn (or run via systemd).
- Frontend: `npm ci && npm run build && npm run start` (or run via systemd).
- Put Nginx (or Caddy) in front; proxy `/` → frontend:3000, `/api` → backend:8001.

---

## 10. Reverse Proxy (Nginx) – Example

Single domain, HTTPS (certificate via Let’s Encrypt):

```nginx
# Frontend
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    ssl_certificate     /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Then set backend `CORS_ORIGINS` to `["https://your-domain.com"]` and frontend `NEXT_PUBLIC_API_URL` to `https://your-domain.com/api` (if you proxy under `/api`).

---

## 11. Backups (cron → Google Drive)

- **What:** PostgreSQL dump (`pg_dump` or `pg_dumpall`) + optional tarball of app + `.env`.
- **When:** cron (e.g. daily at 2 AM).
- **Where:** Upload to Google Drive via **rclone** (or gdrive CLI).
- **Retention:** Keep last N days locally and/or in Drive; delete older files.

See **DEPLOYMENT_SETUP.md**, section **2b. Server DB + cron backups to Google Drive**, for details and script ideas.

---

## 12. Environment Variables Checklist (on-server)

| Variable | Where | Example |
|----------|--------|---------|
| `POSTGRES_DB` | Docker / host | `hotel_db` or `sfms` |
| `POSTGRES_USER` | Docker / host | `postgres` |
| `POSTGRES_PASSWORD` | Docker / host | strong password |
| `DATABASE_URL` | Backend | `postgresql+asyncpg://user:pass@postgres:5432/dbname` (Docker) or `@localhost:5432/dbname` |
| `JWT_SECRET` | Backend | `openssl rand -hex 32` |
| `CORS_ORIGINS` | Backend | `["https://your-domain.com"]` |
| `NEXT_PUBLIC_API_URL` | Frontend | `https://your-domain.com/api` or `http://localhost:8001` (dev) |
| `APP_ENV` | Backend | `production` |

---

## 13. Summary

| Item | Choice (SFML-like, on-server) |
|------|------------------------------|
| **OS** | Linux (Ubuntu 22.04 / Debian 12) |
| **Reverse proxy** | Nginx (or Caddy) for HTTPS and routing |
| **Database** | PostgreSQL 16, `btree_gist`, init/seed from `db/` |
| **Backend** | FastAPI + Uvicorn + SQLAlchemy async + Alembic |
| **Frontend** | Next.js 15, Node 20, standalone build |
| **Run** | Docker Compose (postgres + backend + frontend) or native systemd |
| **Backups** | cron + pg_dump + rclone → Google Drive |

This gives you a **single reference stack** for running the Hotel Management application on your physical server, aligned with the SFML layout and ready for backup to Google Drive as in DEPLOYMENT_SETUP.md.

---

## 14. Local development in Cursor → Keeping the server updated

You develop **locally in Cursor** and want the **server** to stay in sync. Cursor does not push to the server by itself; you trigger updates in one of these ways.

### Option 1: Git (recommended)

**Flow:** You commit and push from Cursor; the server pulls (manually or automatically).

1. **On your machine (in Cursor):** Commit and push to GitHub (or your Git remote).
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```
2. **On the server:** Pull the latest code.
   ```bash
   cd /path/to/your/app
   git pull origin main
   # If using Docker:
   docker compose -f docker/docker-compose.yml up -d --build
   ```

**Automate the server side** so you don’t SSH in every time:

- **Cron on server** (e.g. every 5–15 minutes):
  ```bash
  */10 * * * * cd /path/to/your/app && git pull origin main
  ```
- **GitHub webhook**: Small script on the server that runs `git pull` when you push (e.g. using a `post-receive` hook or a tiny HTTP endpoint that runs `git pull` when the repo is updated). More setup, but updates only when you push.

Cursor doesn’t auto-commit or auto-push; you run `git commit` and `git push` from the Cursor terminal (or use the Source Control UI) whenever you want to “publish” to the server.

---

### Option 2: rsync (push code on demand)

**Flow:** You run a script from the Cursor terminal; it syncs your local project to the server over SSH. No Git on server required for the sync step.

1. Create a small script (e.g. `scripts/sync-to-server.sh` or `.bat` on Windows) that runs **rsync** (or **scp**), excluding heavy folders like `node_modules` and `.venv`.
2. Run that script whenever you want the server updated (e.g. from Cursor’s integrated terminal).

Example (Linux/macOS; run from repo root):

```bash
# scripts/sync-to-server.sh
RSYNC_TARGET="${1:-user@your-server:/path/to/app}"
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.venv' \
  --exclude '.next' \
  --exclude '__pycache__' \
  --exclude '.git' \
  --exclude '*.pyc' \
  ./ "$RSYNC_TARGET"
```

On **Windows in Cursor**, you can use **WSL** to run the same script, or use an **rsync for Windows** build, or a **PowerShell** script that uses `scp` / WinSCP-style copy for the same exclusions.

After sync, SSH to the server and rebuild/restart if needed (e.g. `docker compose up -d --build`).

---

### Option 3: Edit directly on the server (Remote SSH)

**Flow:** No sync. You open the **server’s folder** in Cursor via **Remote - SSH**; you edit files on the server, so the server always has the latest changes.

1. Install the **Remote - SSH** extension in Cursor (same as in VS Code).
2. Connect to your server and open the app folder there.
3. Edit and save as usual; files live on the server. Run Docker/build commands in the terminal over SSH.

Downside: You’re not “local” anymore—you need a good connection to the server, and you may still want Git to back up or deploy elsewhere.

---

### Summary: what Cursor can and can’t do

| Goal | What to do |
|------|------------|
| **Cursor keeps server updated** | Cursor does not auto-sync. Use **Git**: commit + push from Cursor, then **pull on the server** (manually, cron, or webhook). Or run an **rsync script** from Cursor terminal when you want to push. |
| **One-command “deploy” from Cursor** | Run `git push` then SSH or a small script that runs `git pull` + `docker compose up -d --build` on the server. Or run your rsync script then the same build command over SSH. |
| **Edit on server without sync** | Use **Remote - SSH** in Cursor and open the project on the server. |

Recommended: **Option 1 (Git)** for normal development—commit and push from Cursor, and either pull on the server when you’re ready or use a cron job on the server to pull periodically.

---

## 15. Git + GitHub on the server (basic setup and test)

When you’re connected to the server in Cursor (Remote-SSH), the terminal runs **on the server**. Configure Git there so the server can clone, pull, and (if needed) push to GitHub.

### Step 1: Basic Git config (identity)

In the **Cursor terminal** (which is SSH’d into the server), run:

```bash
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

Use the same email as your GitHub account if the server will push. Check with: `git config --global --list`.

---

### Step 2: Connect GitHub from the server (choose one)

**Option A – SSH key (recommended for servers)**

1. Generate an SSH key on the server:  
   `ssh-keygen -t ed25519 -C "your-email@example.com" -f ~/.ssh/id_ed25519_github -N ""`
2. Show public key: `cat ~/.ssh/id_ed25519_github.pub` → copy it.
3. GitHub → **Settings** → **SSH and GPG keys** → **New SSH key** → paste, save.
4. On the server, create `~/.ssh/config`:
   ```
   Host github.com
       HostName github.com
       User git
       IdentityFile ~/.ssh/id_ed25519_github
       IdentitiesOnly yes
   ```
   Then: `chmod 600 ~/.ssh/config`
5. Test: `ssh -T git@github.com` → you should see “Hi username! You've successfully authenticated...”

**Option B – HTTPS with Personal Access Token (PAT)**

1. GitHub → Settings → Developer settings → Personal access tokens → generate token with `repo` scope. Copy it.
2. On the server: `git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git` → when asked for password, paste the **token**.
3. Save credentials: `git config --global credential.helper store`

---

### Step 3: Test the connection

- **SSH:** `ssh -T git@github.com` then e.g. `git clone git@github.com:USER/REPO.git /tmp/test && rm -rf /tmp/test`
- **HTTPS:** `git ls-remote https://github.com/YOUR_USERNAME/YOUR_REPO.git` (should list refs or succeed for an empty repo)

If you already have a repo on the server: `cd /path/to/app` → `git remote -v` → `git fetch origin` → `git status`.

---

### Step 4: Remote URL on the server

- **SSH:** `git@github.com:USERNAME/REPO.git`
- **HTTPS:** `https://github.com/USERNAME/REPO.git`

Set remote: `git remote add origin git@github.com:USER/REPO.git` or `git remote set-url origin ...`

### Quick checklist (server)

| Step | Action |
|------|--------|
| 1 | `git config --global user.name` and `user.email` |
| 2a | (SSH) `ssh-keygen` → add `.pub` to GitHub → `~/.ssh/config` for GitHub → `ssh -T git@github.com` |
| 2b | (HTTPS) PAT on GitHub → clone with HTTPS → token as password → `credential.helper store` |
| 3 | Test: `ssh -T git@github.com` or `git ls-remote https://github.com/...` |
| 4 | In app folder: `git remote -v` and `git fetch origin` |
