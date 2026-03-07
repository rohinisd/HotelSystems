# Setup & Deployment Guide: From Clone to Production

This document walks through every step we took: copying the app from the original repo to your GitHub, running it locally with Docker, and deploying it to production (Neon + Render + Vercel).

---

## Part 1: Copy the App to Your Machine and Your Repo

### Step 1.1 – Clone the original repository

We cloned the source repo into your local folder:

```bash
cd c:\Users\rohin\SFML
git clone https://github.com/gengirish/SFMS .
```

The `.` at the end clones into the current folder (`SFML`) instead of creating a new `SFMS` folder. After this, all project files (backend, frontend, db, docker) are in `c:\Users\rohin\SFML`.

### Step 1.2 – Connect to your own GitHub (no fork)

You wanted the code under your account (`rohinisd`), not as a fork. So we:

1. **Created a new empty repository** on GitHub under your account:  
   [https://github.com/rohinisd/SFMS](https://github.com/rohinisd/SFMS)  
   (Create via GitHub → New repository → no README, no .gitignore.)

2. **Added your repo as a second remote** so the original stayed as `origin` and yours as `myfork`:

   ```bash
   git remote add myfork https://github.com/rohinisd/SFMS
   ```

3. **Pushed your local branch to your repo**:

   ```bash
   git push myfork master
   ```

From here on, **your changes go to your account** when you push to `myfork`. The original repo (`origin`) is unchanged.

**Summary:**  
- `origin` → `gengirish/SFMS` (read-only; we don’t push here).  
- `myfork` → `rohinisd/SFMS` (your repo; push with `git push myfork master`).

---

## Part 2: Bring the App Up Locally (Docker)

The app runs as three services: **PostgreSQL**, **backend (FastAPI)**, and **frontend (Next.js)**. We use Docker Compose to run all three.

### Step 2.1 – Run with Docker Compose

From the repo root:

```bash
cd c:\Users\rohin\SFML\docker
docker compose up -d --build
```

This builds and starts:

- **postgres** – database (port 5433 on host; 5432 inside container)
- **backend** – API at http://localhost:8001
- **frontend** – UI at http://localhost:3001

### Step 2.2 – Port changes (avoid conflicts)

Your machine already had something on 5432 and 3000, so we changed the host ports in `docker/docker-compose.yml`:

| Service   | Original mapping | New mapping | Reason                    |
|----------|-------------------|-------------|---------------------------|
| postgres | `5432:5432`       | `5433:5432` | 5432 already in use       |
| frontend | `3000:3000`      | `3001:3000` | 3000 already in use       |

So you use:

- **App in browser:** http://localhost:3001  
- **API:** http://localhost:8001  
- **PostgreSQL (if needed):** `localhost:5433`

### Step 2.3 – CORS for frontend on 3001

The backend only allowed `http://localhost:3000`. Because the frontend runs on **3001**, we updated the backend’s CORS in `docker/docker-compose.yml`:

**Backend environment:**

```yaml
CORS_ORIGINS: '["http://localhost:3000","http://localhost:3001"]'
```

After changing this, restart: `docker compose down` then `docker compose up -d --build`.

### Step 2.4 – Frontend Dockerfile: `public` folder

The frontend Docker build failed because the `public` directory was missing. We fixed `frontend/Dockerfile`:

- In the **builder** stage: `RUN mkdir -p public` so the build has a `public` dir.
- In the **runner** stage: we use `RUN mkdir -p public` and do **not** copy `public` from the builder, so the final image always has a valid `public` folder even if the repo has none.

With that, `docker compose up -d --build` succeeds.

### Step 2.5 – Local URLs

- **Frontend (login, dashboard, booking):** http://localhost:3001  
- **Backend API / health:** http://localhost:8001  
- **API docs:** http://localhost:8001/docs  

Database is seeded from `db/init.sql` and `db/seed.sql` when the postgres container is first created.

---

## Part 3: Deploy to Production (Neon + Render + Vercel)

We split production into:

- **Database:** Neon (PostgreSQL)
- **Backend API:** Render (Docker)
- **Frontend:** Vercel (Next.js)

### Step 3.1 – Database on Neon

1. **Sign up / log in:** [https://neon.tech](https://neon.tech)
2. **Create a project** and a database (e.g. `neondb`).
3. **Copy the connection string** from the Neon dashboard (Connection string / connection details). It looks like:
   ```text
   postgresql://user:password@host.neon.tech/neondb?sslmode=require
   ```
4. **Apply schema and seed data:**
   - In Neon: **SQL Editor**.
   - Run the contents of your local `db/init.sql` (creates tables, indexes).
   - Then run the contents of `db/seed.sql` (facilities, users, etc.).

Your backend will use this same connection string as `DATABASE_URL` on Render.

### Step 3.2 – Backend on Render

1. **Sign up / log in:** [https://render.com](https://render.com)
2. **New Web Service**, connected to **GitHub → rohinisd/SFMS**.
3. **Build & run settings (important):**
   - **Root Directory:** leave **empty** (repo root).
   - **Runtime:** Docker.
   - **Dockerfile Path:** `backend/Dockerfile`
   - **Docker Context:** `.` (repository root).  
   The backend Dockerfile is written to be built from the **repo root** (it uses paths like `COPY backend/pyproject.toml .`, `COPY backend/src/ src/`). So the context must be `.`, not `backend`.
4. **Environment variables** (Render → Service → Environment):
   - `DATABASE_URL` = your Neon connection string (e.g. `postgresql://...@...neon.tech/neondb?sslmode=require`)
   - `JWT_SECRET` = a long random string (Render can generate one)
   - `CORS_ORIGINS` = `["https://sfms-eight.vercel.app","http://localhost:3001"]` (your Vercel URL + local)
   - `APP_ENV` = `prod`
   - `DEBUG` = `false`
   - Optional: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` when you enable payments.
5. **Deploy.** Note the backend URL, e.g. `https://sfms-moh1.onrender.com`.

**Backend config for Neon:** The backend’s `config.py` keeps `?sslmode=require` in `DATABASE_URL` for external URLs (like Neon). So the Neon connection string is used as-is by the backend.

### Step 3.3 – Frontend on Vercel

1. **Sign up / log in:** [https://vercel.com](https://vercel.com)
2. **Import** the GitHub repo **rohinisd/SFMS**.
3. **Project settings:**
   - **Root Directory:** `frontend` (so Vercel builds the Next.js app).
   - **Framework:** Next.js (auto-detected).
   - **Build Command:** `npm run build` (default).
4. **Environment variable:**
   - **Key:** `NEXT_PUBLIC_API_URL`  
   - **Value:** your Render backend URL, e.g. `https://sfms-moh1.onrender.com` (no trailing slash).
5. **Deploy.** Your app will be at a URL like `https://sfms-eight.vercel.app`.

After the first deploy, if you add or change `NEXT_PUBLIC_API_URL` or `CORS_ORIGINS`, redeploy the frontend and/or backend so both use the same API URL and CORS list.

### Step 3.4 – Render backend: fix “backend/backend not found”

If Render was set with Root Directory = `backend` and Docker Context = `backend`, the build could fail with paths like `backend/backend` not found. The fix was:

- **Root Directory:** empty  
- **Dockerfile Path:** `backend/Dockerfile`  
- **Docker Context:** `.`  

So Render clones the whole repo and runs `docker build -f backend/Dockerfile .` from the repo root. The Dockerfile’s `COPY backend/...` paths then resolve correctly.

---

## Part 4: Branding (BookYourSlots)

We rebranded from “TurfStack” to **BookYourSlots** so you can maintain one place for the app name and tagline.

### Step 4.1 – App config

Created `frontend/lib/app-config.ts`:

```ts
export const APP_NAME = "BookYourSlots";
export const APP_TAGLINE = "Book courts. Fill every slot.";
export const APP_DESCRIPTION = "India's smartest sports facility platform...";
```

### Step 4.2 – Where it’s used

- **Layout / metadata:** `frontend/app/layout.tsx` – title, description, Open Graph, Twitter.
- **Landing:** `frontend/app/page.tsx`.
- **Login:** `frontend/app/login/page.tsx`, `frontend/app/login/layout.tsx`.
- **Sidebar:** `frontend/components/layout/sidebar.tsx`.
- **Legal pages:** `frontend/components/layout/legal-layout.tsx`.
- **Booking layout:** `frontend/app/book/layout.tsx`.
- **Razorpay:** `frontend/lib/razorpay.ts` – payment dialog name.
- **Settings / contact:** dashboard settings and contact page.

To rebrand again, change `frontend/lib/app-config.ts` and any remaining hardcoded strings.

---

## Part 5: Fixing “Invalid credentials” (Password hashes)

After deployment, login with seed users (e.g. `owner@turfstack.in`) failed with “Invalid credentials” even though the user existed in Neon.

### What was wrong

- The backend checks passwords with **passlib** (bcrypt, 12 rounds).
- The hashes in the DB (from seed or a previous fix) didn’t match what the backend expected (e.g. typo in the hash string, or hash from another tool).

### What we did

1. **Generated a correct bcrypt hash** for the password `password1234` using the same scheme the backend uses (e.g. via `backend/scripts/hash_password.py`, which uses passlib or bcrypt with 12 rounds).
2. **Updated the user in Neon** (SQL Editor):

   ```sql
   UPDATE users
   SET hashed_password = '$2b$12$Bj5pDUDAsbCtVrhVmQSoNenUpMBNXJtuYxr.7C6EX4E6c9zLntF2a'
   WHERE email = 'owner@turfstack.in';
   ```

3. **Verified:** Logged in with `owner@turfstack.in` / `password1234` successfully.

### Apply to all users

To set **every** user’s password to `password1234` (dev/demo only):

```sql
UPDATE users
SET hashed_password = '$2b$12$Bj5pDUDAsbCtVrhVmQSoNenUpMBNXJtuYxr.7C6EX4E6c9zLntF2a'
WHERE 1=1;
```

For production, users should set their own passwords through the app (registration / change password / forgot password), so the backend hashes them correctly.

---

## Part 6: Quick Reference

### Local

| What        | URL / command |
|------------|----------------|
| Frontend   | http://localhost:3001 |
| Backend API| http://localhost:8001 |
| API docs   | http://localhost:8001/docs |
| Run stack  | `cd docker` → `docker compose up -d --build` |
| Stop stack | `cd docker` → `docker compose down` |

### Production (your setup)

| What     | URL / place |
|----------|-------------|
| Frontend | https://sfms-eight.vercel.app |
| Backend  | https://sfms-moh1.onrender.com |
| Database | Neon project (connection string in Render env) |

### Important env vars

| Where   | Variable               | Example / note |
|--------|------------------------|----------------|
| Render | `DATABASE_URL`         | Neon connection string |
| Render | `JWT_SECRET`           | Long random string |
| Render | `CORS_ORIGINS`         | `["https://sfms-eight.vercel.app",...]` |
| Render | `RAZORPAY_KEY_ID`      | From Razorpay dashboard (for online payments) |
| Render | `RAZORPAY_KEY_SECRET`  | From Razorpay dashboard (for online payments) |
| Vercel | `NEXT_PUBLIC_API_URL`  | `https://sfms-moh1.onrender.com` (no trailing slash) |

### Git

- Push your work to **your** repo: `git push myfork master`
- Don’t push to `origin` (original repo).

---

## Part 7: Troubleshooting "Failed to fetch" when booking

When you click **Confirm Booking** on the deployed app and see **"Failed to fetch"** (or "Could not reach the server"), the browser could not complete the request to the backend. Staff and other roles are allowed to book; the issue is connectivity or configuration.

### 1. Backend URL (Vercel)

- In **Vercel → Project → Settings → Environment Variables**, ensure:
  - **Key:** `NEXT_PUBLIC_API_URL`
  - **Value:** your Render backend URL, e.g. `https://sfms-moh1.onrender.com` (no trailing slash).
- Redeploy the frontend after changing it so the new value is baked into the build.

### 2. CORS (Render)

The backend must allow your frontend origin. In **Render → your backend service → Environment**:

- **Key:** `CORS_ORIGINS`
- **Value (JSON array of allowed origins):**
  ```json
  ["https://sfms-eight.vercel.app","http://localhost:3001"]
  ```
  Use your real Vercel URL if it differs. Save and **redeploy** the backend.

### 3. Backend up and cold starts (Render)

- On the free tier, the backend sleeps after inactivity. The first request after a while can take 30–60 seconds and may time out.
- Open the backend URL in a new tab (e.g. `https://sfms-moh1.onrender.com/api/v1/health`). If it loads, the service is up; try the booking again.
- If the health URL also fails, check Render dashboard for deploy or runtime errors.

### 4. Quick checklist

| Check | Where | What to verify |
|-------|--------|----------------|
| API URL | Vercel env | `NEXT_PUBLIC_API_URL` = your Render URL, no trailing slash |
| CORS | Render env | `CORS_ORIGINS` includes your Vercel URL in the JSON array |
| Backend live | Browser | Open `https://your-backend.onrender.com/api/v1/health` and get a response |
| Redeploy | Vercel / Render | After changing env vars, trigger a new deploy |

After fixing CORS or the API URL, redeploy the affected service and try booking again.

### 5. Database: missing `booking_source` column (Neon)

If **CORS and API URL are correct** but booking still fails with "Failed to fetch" or a generic error, the backend may be returning 500 because the `booking` table in Neon is missing the `booking_source` column. The app code inserts into this column; if it does not exist, the INSERT fails.

**Fix in Neon (SQL Editor):**

Run this once:

```sql
-- Add booking_source if your schema was created from init.sql only (no migrations)
ALTER TABLE booking
ADD COLUMN IF NOT EXISTS booking_source VARCHAR(50) NOT NULL DEFAULT 'turfstack';
```

Then try **Confirm Booking** again. If the column already exists, the statement does nothing. If it was missing, bookings will succeed after this.

To confirm the backend error: **Render → your service → Logs**. Look for a line mentioning `column "booking_source" does not exist` or a 500 traceback when you click Confirm Booking.

### 6. Still the same error? Get the exact failure

When CORS, API URL, and DB are set but booking still fails, you need the **exact** error.

**A. Browser (F12 → Network)**

1. Open your app (e.g. https://sfms-eight.vercel.app/book).
2. Press **F12** → open the **Network** tab.
3. Click **Confirm Booking** again.
4. In the list, find the request to **`bookings`** (or your API URL). It may be red.
5. Click that request. Check:
   - **Status:** (failed), **CORS error**, **Pending** (timeout), or a number (e.g. 500).
   - **Response** (or **Preview**): any message from the server.
   - **Headers**: Request URL must be `https://sfms-moh1.onrender.com/api/v1/bookings` (or your backend).

- If **Status is “CORS error”** or **“blocked by CORS policy”** in the Console: the backend is not allowing your frontend origin. In Render, set `CORS_ORIGINS` to exactly:  
  `["https://sfms-eight.vercel.app","http://localhost:3001"]`  
  (no spaces inside the brackets if your backend’s parser is strict), then **redeploy**.
- If **Status is 500**: the Response body usually has the reason (e.g. missing column, constraint). Fix that in the DB or backend.
- If **Status is “Pending” then fails** or **Failed to load**: backend may be sleeping (cold start) or unreachable. Open `https://sfms-moh1.onrender.com/api/v1/health` in a new tab; if it loads after a while, try booking again (the retry in the app may help).

**B. Render logs**

1. **Render → your SFMS service → Logs.**
2. Click **Confirm Booking** in the app.
3. In the logs, look for the **POST** to `/api/v1/bookings` and any **Python traceback** or error line below it.
4. On startup you should see a line like `cors_origins=['https://sfms-eight.vercel.app', ...]`. If your Vercel URL is missing, fix `CORS_ORIGINS` and redeploy.

**C. Test the API with a token (optional)**

1. In the app, log in as staff, then F12 → **Application** (or Storage) → **Local Storage** → copy the value of `sfms_token`.
2. In a terminal (or Postman), run (replace `YOUR_TOKEN` and backend URL):

   ```bash
   curl -X POST "https://sfms-moh1.onrender.com/api/v1/bookings" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d "{\"court_id\":1,\"date\":\"2026-03-10\",\"start_time\":\"22:00\",\"end_time\":\"23:00\",\"booking_type\":\"walkin\",\"booking_source\":\"turfstack\"}"
   ```

3. If you get JSON with `id` and `amount`, the backend and DB are fine and the issue is between browser and backend (e.g. CORS or wrong frontend URL). If you get an error body or 500, the response text is the cause (e.g. missing column, validation error).

---

## Part 8: Set up online payments (Razorpay)

If the **Complete Payment** page shows **"Online payments are not available right now. You can pay at the venue."**, Razorpay is not configured. The backend needs your Razorpay API keys so it can create orders and verify payments.

### Step 8.1 – Create a Razorpay account and get API keys

1. Go to **[https://dashboard.razorpay.com](https://dashboard.razorpay.com)** and sign up or log in.
2. Switch to **Test mode** (toggle in the dashboard) while you are testing. Use **Live mode** when you go to production.
3. Open **Settings** (gear icon) → **API Keys**.
4. Click **Generate Key** if you don’t have keys yet. You will get:
   - **Key ID** (e.g. `rzp_test_xxxx` in test mode, `rzp_live_xxxx` in live).
   - **Key Secret** (shown once; copy and store it safely).

### Step 8.2 – Add keys to the backend (Render)

1. In **Render** → your backend service (e.g. SFMS) → **Environment**.
2. Add two environment variables:

   | Key | Value |
   |-----|--------|
   | `RAZORPAY_KEY_ID` | Your Razorpay Key ID (e.g. `rzp_test_xxxx`) |
   | `RAZORPAY_KEY_SECRET` | Your Razorpay Key Secret |

3. **Save** the environment. Render will redeploy the service so the new variables take effect (or trigger a **Manual Deploy** if needed).

No frontend (Vercel) env vars are required for payments: the backend returns the Key ID with each order, and the frontend loads the Razorpay script from Razorpay’s CDN.

### Step 8.3 – Test the flow

1. After the backend has redeployed, open your app and create a new booking (or use an existing confirmation URL).
2. On the **Complete Payment** page you should see the **Pay ₹…** button enabled and no “not available” message.
3. Click **Pay** → the Razorpay checkout (test card/UPI) should open. In **Test mode** you can use Razorpay’s test cards (see [Razorpay test cards](https://razorpay.com/docs/payments/payments/test-card-details/)).

### Step 8.4 – Optional: webhooks (for production)

For production you may want Razorpay to notify your backend when a payment is captured (e.g. if the user closes the browser after paying). That requires:

1. In Razorpay dashboard: **Settings** → **Webhooks** → **Add New Webhook**.
2. **URL:** `https://sfms-moh1.onrender.com/api/v1/payments/webhook` (your backend URL + path).
3. **Secret:** Generate a secret, then in Render add env var **`RAZORPAY_WEBHOOK_SECRET`** with that value.
4. Select events (e.g. `payment.captured`) and save.

Without webhooks, payments are still captured when the user completes checkout and your frontend calls the **Verify** API; webhooks add a backup path for edge cases.

### Step 8.5 – Payment provider legal details (display)

The app shows the payment provider’s registered name and legal identifiers (CIN, GST) on the **Contact** page and in **Terms**, **Privacy**, and **Refund Policy**. These are set in **`frontend/lib/app-config.ts`** under `PAYMENT_PROVIDER` (name, CIN, PAN, TAN, GST). If Razorpay updates their legal details, update that object and redeploy the frontend.

---

## Summary

1. **Cloned** gengirish/SFMS into your folder and **pushed** to your GitHub (rohinisd/SFMS) via `myfork`.
2. **Ran locally** with Docker Compose; fixed ports (5433, 3001), CORS for 3001, and frontend Dockerfile `public` dir.
3. **Deployed** DB to Neon (schema + seed), backend to Render (Docker, context `.`), frontend to Vercel (root `frontend`, `NEXT_PUBLIC_API_URL`).
4. **Rebranded** to BookYourSlots via `app-config.ts` and layout/login/sidebar/etc.
5. **Fixed login** by setting correct bcrypt hashes in Neon for seed users (e.g. `password1234`).
6. **Enabled online payments** by adding Razorpay Key ID and Key Secret to Render (see Part 8).

You now have the app running locally and in production with your own repo, branding, and optional Razorpay payments.
