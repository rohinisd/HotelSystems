# Hotel Management System – Deployment Prerequisites

Use this guide to set up **GitHub**, **Neon**, **Render**, and **Vercel** for your Hotel Management System. It separates **what you must do manually** (accounts, projects, secrets) from **what Cursor can generate** (config files, CI, env templates).

---

## 1. What You Need to Create (Manual Steps)

### GitHub

| Step | Action |
|------|--------|
| 1 | Create a **GitHub account** (if you don’t have one): https://github.com/signup |
| 2 | Create a **new repository** (e.g. `hotel-management-system` or `HotelSystems`). |
| 3 | **Do not** initialize with README if you already have local code; then add remote and push. |
| 4 | (Optional) Under **Settings → Secrets and variables → Actions**, add any secrets you want CI to use (e.g. for E2E against a deployed URL). |

```bash
# After creating the repo (if starting from local):
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

---

### Neon (PostgreSQL)

| Step | Action |
|------|--------|
| 1 | Sign up: https://neon.tech |
| 2 | Create a **new project** (e.g. `hotel-systems`). |
| 3 | Copy the **connection string** (Pooled or Direct). It looks like: `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require` |
| 4 | For **async Python** (e.g. SQLAlchemy asyncpg), use the same URL but with driver: `postgresql+asyncpg://user:pass@ep-xxx.../neondb?sslmode=require` |
| 5 | Save this as `DATABASE_URL` for backend (Render) and for local `.env`. |

You’ll need this value when configuring Render and (optionally) GitHub Actions.

---

### Render (Backend API)

| Step | Action |
|------|--------|
| 1 | Sign up: https://render.com |
| 2 | Create a **new Web Service**. |
| 3 | Connect your **GitHub repository** (same repo as above). |
| 4 | Configure: **Root Directory** = `backend` (if your FastAPI app is in `backend/`). **Runtime** = Docker (if you use a Dockerfile) or Native (Python). **Build Command** and **Start Command** as per your backend (e.g. `uvicorn app.main:app --host 0.0.0.0 --port $PORT`). |
| 5 | Set **Environment Variables** in Render dashboard: |

| Variable | Where to get it | Required |
|----------|-----------------|----------|
| `DATABASE_URL` | Neon connection string (use `postgresql+asyncpg://...` if backend uses asyncpg) | Yes |
| `JWT_SECRET` | Generate: `openssl rand -hex 32` | Yes |
| `CORS_ORIGINS` | Your Vercel frontend URL, e.g. `https://your-app.vercel.app` | Yes |
| `RAZORPAY_KEY_ID` | Razorpay Dashboard | If using payments |
| `RAZORPAY_KEY_SECRET` | Razorpay Dashboard | If using payments |
| `APP_ENV` | `production` | Recommended |

| 6 | Note your **Render backend URL** (e.g. `https://your-api.onrender.com`). You’ll use it in Vercel as `NEXT_PUBLIC_API_URL`. |

---

### Vercel (Frontend)

| Step | Action |
|------|--------|
| 1 | Sign up: https://vercel.com (e.g. with GitHub). |
| 2 | **Add New Project** → Import your **GitHub repository**. |
| 3 | Set **Root Directory** to `frontend` (where your Next.js app lives). |
| 4 | Set **Environment Variables**: |

| Variable | Value | When |
|----------|--------|------|
| `NEXT_PUBLIC_API_URL` | Your Render backend URL (e.g. `https://your-api.onrender.com`) | Production (and Preview if you want) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay publishable key | If using Razorpay |

| 5 | Deploy. Vercel will build and deploy; subsequent pushes to `main` (or your production branch) will auto-deploy. |

---

## 2. Backend Alternatives to Render (if you don’t want to upgrade Render)

If you prefer not to upgrade your Render account, you can host the **same FastAPI backend** on one of these similar platforms. All work with **Neon** (or any Postgres) and **Vercel** (frontend) as before; only the backend host changes.

| Platform | Free tier | Best for | Notes |
|----------|-----------|----------|--------|
| **Railway** | $5 one-time trial, then **$1/month free credit** | Small backends, no card needed for trial | FastAPI + Docker supported. After trial, $1 credit is limited (light usage only). [railway.app](https://railway.app) |
| **Koyeb** | **1 web service + 1 Postgres** free, no expiration | Free long-term, no upgrade pressure | No credit card for free tier. Scale-to-zero. Good for hobby/side projects. [koyeb.com](https://www.koyeb.com) |
| **Fly.io** | **2-hour trial** for new signups; then pay-as-you-go (~$5/mo) | Low latency, global regions | Free tier was removed for new users. Good if you’re okay with a small monthly cost. [fly.io](https://fly.io) |
| **Render** (current) | Free web service (spins down after 15 min idle) | Stay on free tier, no new account | 750 free instance hours/month. Use another provider if you need always-on or more hours. |

### Quick comparison

- **Want to avoid upgrading and stay free long-term?** → **Koyeb** (1 free web service + optional free Postgres; you can still use Neon for DB).
- **Okay with ~$5/month for a always-on backend?** → **Fly.io** (your project’s deploy docs already support it).
- **Want to try without card and minimal setup?** → **Railway** ($5 trial, then $1/month credit).

For any of these, you still:

1. Use **Neon** for PostgreSQL (or Koyeb’s free Postgres if you prefer).
2. Set **Vercel** `NEXT_PUBLIC_API_URL` to your **new backend URL** (Railway / Koyeb / Fly.io).
3. Set **CORS_ORIGINS** on the backend to your Vercel frontend URL.

If you tell Cursor which provider you chose (e.g. “use Railway” or “use Koyeb”), it can add the matching config (e.g. `railway.json`, or Koyeb/Fly.io deploy instructions) to this repo.

---

## 2a. Using your own physical server vs cloud (Vercel / Neon / Render, etc.)

You have a **physical server**; you can run the whole stack (Postgres + backend + frontend) on it instead of using Neon + Render + Vercel. Neither option is “better” in all cases—it depends on your goals and constraints.

| Factor | Physical server (your machine) | Cloud (Neon + Render/Railway + Vercel) |
|--------|----------------------------------|----------------------------------------|
| **Cost** | You pay once (hardware + power + internet). No per-month hosting fees. | Free tiers available; paid tiers scale with usage. No hardware to buy. |
| **Control** | Full control: OS, runtime, firewall, backups, scaling. | Limited to what the platform allows. Less to configure. |
| **Reliability & uptime** | Depends on your power, network, and maintenance. One machine = single point of failure. | Managed uptime, redundancy, and regions. Better for “always on” and multiple users. |
| **Maintenance** | You handle OS updates, security patches, Postgres, SSL, backups, monitoring. | Platform handles most of this. You mainly configure app and env vars. |
| **Scaling** | Add RAM/CPU or another machine; you do the work. | Scale via plan or auto-scaling; no hardware. |
| **Access & location** | App only reachable when the server is on and your network is exposed (or you use a tunnel/VPS). | Public URLs and HTTPS out of the box. Accessible from anywhere. |
| **Best for** | Learning, full control, one-off or internal use, no recurring cost. | Sharing with others, demos, small business, or when you don’t want to run infra. |

### When a physical server is a good fit

- **Learning / side project** and you want to see how everything runs on one machine.
- **Internal or local use** (e.g. one hotel, one office)—no need for 24/7 public availability.
- **You’re okay with** doing (or learning) Linux, Docker, Nginx, SSL, and backups.
- **You want to avoid** monthly hosting bills and are fine with your own power and internet.

### When cloud is a better fit

- **Others need to use the app** from different places (staff, guests, multiple locations).
- **You want** a public URL and HTTPS without setting up domains and certificates yourself.
- **You prefer** to focus on the app, not server admin, security, or backups.
- **You need** the app to stay up even if your home/office power or internet goes down.

### Hybrid option

You can mix both:

- **DB on cloud (e.g. Neon)** → always available, managed backups.
- **Backend + frontend on your server** → lower cost, full control over app hosting.
- Or **backend on your server**, frontend on **Vercel** (or another host) for a stable public URL.

### Summary

| Your situation | Suggestion |
|----------------|------------|
| Learning, internal use, no monthly spend, you like tinkering with servers | **Physical server** is fine and often better (cost + control). |
| Demo / small business / multiple users / “set and forget” | **Cloud** (Neon + Render/Railway/Koyeb + Vercel) is usually easier and more reliable. |

So: **physical server is “better” when** you value control and zero recurring cost and can handle ops. **Cloud is “better” when** you want less maintenance and higher availability for others. For a real hotel or multi-user scenario, cloud (or hybrid) is typically the safer choice.

---

## 2b. Server DB + cron backups to Google Drive (recommended when using your own server)

Running **Postgres on your server** and backing up **DB + app** with **cron**, then uploading to **Google Drive**, is a good approach: no DB hosting bill, off-site copies, and you control retention.

### Why this setup works well

| Benefit | Notes |
|--------|--------|
| **No Neon/DB hosting cost** | DB lives on your server; only storage (Google Drive) may have limits. |
| **Off-site backup** | Google Drive is separate from your server—helps if the machine or disk fails. |
| **Simple automation** | Cron + a small script (e.g. `pg_dump` → compress → upload) is easy to maintain. |
| **Application backup** | Cron can also copy app code, `.env` (secrets), and config so you can restore the full stack. |

### What to back up

1. **Database** – `pg_dump` (or `pg_dumpall`) → compressed file (e.g. `.sql.gz`).
2. **Application** – Optional: tar of app directory (or rely on Git and only backup env/config).
3. **Secrets/config** – Backup `.env` and any non-repo config (e.g. to an encrypted archive) and store in Drive.

### High-level flow

```
Cron (e.g. daily 2 AM)
  → pg_dump → gzip → backup_YYYYMMDD.sql.gz
  → (optional) tar app + .env
  → upload to Google Drive (rclone / gdrive CLI / script)
  → (optional) delete local backups older than N days
```

### Tools to get backups to Google Drive

| Tool | Use case |
|------|----------|
| **rclone** | Sync a local backup folder to a Google Drive folder. Supports service-account or OAuth. `rclone copy /backups gdrive:Backups/hotel-db` |
| **Google Drive desktop app** | Copy backup folder into a synced Drive folder (simplest, but less scriptable). |
| **gdrive CLI** (third-party) | Upload files from scripts. `gdrive upload --parent <folder_id> backup.sql.gz` |
| **Google Drive API** (e.g. Python script) | Full control; good if you want encryption or custom naming. |

### Things to watch

- **Google Drive limits** – Free account ~15 GB; daily upload quotas apply. Keep retention reasonable (e.g. last 7 daily + 4 weekly).
- **Retention** – Don’t keep unlimited backups; remove or overwrite old ones (e.g. cron to delete backups older than 30 days in Drive or locally).
- **Test restores** – Periodically restore a backup to another DB or machine to confirm backups are valid.
- **Secrets** – Don’t put plain `.env` in a shared or public Drive folder; encrypt or use a private folder and restrict access.

### Example cron (concept only)

```bash
# Daily at 2 AM: dump DB, compress, upload to Google Drive
0 2 * * * /opt/scripts/backup-hotel-db.sh
```

`backup-hotel-db.sh` would: run `pg_dump`, gzip, optionally tar app+env, then run `rclone copy` (or similar) to Google Drive.

**Verdict:** Yes—**running the DB on your server and using cron + Google Drive for backups** is a solid, cost-effective approach for a single-server deployment. Just define retention, test restores, and keep secrets safe.

---

## 3. Summary: What to Create Where

| Service | Create | What you get |
|---------|--------|----------------|
| **GitHub** | Account + 1 repo | Code hosting, CI (GitHub Actions) |
| **Neon** | Account + 1 project | PostgreSQL `DATABASE_URL` |
| **Backend** | Render, Railway, Koyeb, or Fly.io (see §2) | Backend API URL |
| **Vercel** | Account + 1 project (frontend) | Frontend URL |

**Order:** GitHub first → Neon → Backend (Render or alternative; set `DATABASE_URL` from Neon) → Vercel (set `NEXT_PUBLIC_API_URL` = backend URL).

---

## 4. What Cursor Can Do for You (No Manual Account Creation)

Cursor **cannot** create your GitHub/Neon/Render/Vercel accounts or log in for you. It **can** generate and edit files in your repo so that once you’ve created those resources, everything is wired correctly.

You can ask Cursor to:

| Task | What Cursor generates/updates |
|------|-------------------------------|
| **Render** | `render.yaml` (or `render.yaml` in repo root) with service name, env vars references, and build/start commands for the backend. |
| **Vercel** | `vercel.json` in `frontend/` (if needed) and ensure `next.config` has `output: 'standalone'` if you use Docker elsewhere. |
| **Neon** | No Neon-specific file needed; Cursor can put `DATABASE_URL` in `.env.example` as a placeholder and document that you paste the Neon connection string in Render and `.env`. |
| **Env template** | Update `.config/.env.example` (or root `.env.example`) with all variables needed for local + production (Neon, Render, Vercel, JWT, Razorpay). |
| **CI (GitHub Actions)** | Update `.github/workflows/ci.yml` to use Neon (or keep CI on Postgres service in Actions) and point E2E/base URL to your Vercel URL. |
| **Docs** | Add a short “First-time deploy” section to README or this file with the exact order: create Neon → create Render with `DATABASE_URL` → create Vercel with `NEXT_PUBLIC_API_URL`. |

**Example prompts you can use in Cursor:**

- *“Add a render.yaml for the backend so I can deploy to Render.”*
- *“Update .env.example with all variables needed for Neon, Render, and Vercel.”*
- *“Update the CI workflow so the frontend build uses NEXT_PUBLIC_API_URL for production and E2E uses my Vercel URL.”*

---

## 5. Quick Checklist

- [ ] GitHub: account + repo created; code pushed.
- [ ] Neon: project created; `DATABASE_URL` (and `postgresql+asyncpg://...` variant) copied.
- [ ] Backend: Render (or Railway / Koyeb / Fly.io) — Web Service created; repo connected; root = `backend`; `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS` set; backend URL noted.
- [ ] Vercel: project created; repo connected; root = `frontend`; `NEXT_PUBLIC_API_URL` set to Render URL.
- [ ] (Optional) Use Cursor to add `render.yaml`, update `.env.example`, and adjust CI as above.

After this, your Hotel Management System will have:

- **Database:** Neon (PostgreSQL)  
- **Backend:** Render, Railway, Koyeb, or Fly.io (your choice)  
- **Frontend:** Vercel  
- **CI:** GitHub Actions (from your existing workflows, with optional Cursor tweaks)
