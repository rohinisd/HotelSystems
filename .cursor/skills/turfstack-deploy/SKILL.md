---
name: turfstack-deploy
description: Deploy the TurfStack application to production. Use when deploying backend to Fly.io, frontend to Vercel, running database migrations, or troubleshooting deployment issues. Covers the full deployment workflow for both services.
---

# TurfStack Deployment

## Architecture Overview

```
┌─────────────────┐     API calls     ┌──────────────────┐     asyncpg     ┌────────────┐
│  Vercel (Next.js)│ ───────────────► │  Fly.io (FastAPI) │ ─────────────► │ Fly Postgres│
│  frontend/       │                  │  backend/          │                │ (internal)  │
└─────────────────┘                  └──────────────────┘                └────────────┘
```

| Service | Platform | URL Pattern |
|---------|----------|-------------|
| Frontend | Vercel | `https://turfstack.vercel.app` |
| Backend | Fly.io | `https://turfstack-api.fly.dev` |
| Database | Fly.io Postgres | Internal connection via `DATABASE_URL` |

## Backend Deployment (Fly.io)

### First-Time Setup

```bash
cd backend
fly launch --name turfstack-api --region sin
fly postgres create --name turfstack-db --region sin
fly postgres attach turfstack-db --app turfstack-api

# Set secrets
fly secrets set JWT_SECRET="<secret>" \
  CORS_ORIGINS="https://turfstack.vercel.app" \
  RAZORPAY_KEY_ID="<key>" \
  RAZORPAY_KEY_SECRET="<secret>"
```

### Deploy Backend

```bash
cd backend
fly deploy
```

This builds from `backend/Dockerfile` and deploys. The `fly.toml` configures:
- Internal port 8080
- Health check at `/health`
- Auto-stop/start enabled
- `sin` (Singapore) region

### Database Migrations

Connect via proxy and run SQL:

```bash
fly proxy 15432:5432 --app turfstack-db
# Then in another terminal:
psql postgres://postgres:<password>@localhost:15432/turfstack
```

Or run SQL directly:

```bash
fly ssh console --app turfstack-api
python -c "
import asyncio
from sfms.models.database import engine
from sqlalchemy import text
async def migrate():
    async with engine.begin() as conn:
        await conn.execute(text('ALTER TABLE ...'))
asyncio.run(migrate())
"
```

### Verify Backend

```bash
curl https://turfstack-api.fly.dev/health
# {"status":"healthy"}

curl https://turfstack-api.fly.dev/health/db
# {"status":"healthy","database":"connected"}
```

## Frontend Deployment (Vercel)

### First-Time Setup

1. Connect the GitHub repo to Vercel
2. Set root directory to `frontend`
3. Set environment variables:
   - `NEXT_PUBLIC_API_URL` = `https://turfstack-api.fly.dev`
   - `NEXT_PUBLIC_RAZORPAY_KEY` = Razorpay publishable key

### Deploy Frontend

Vercel auto-deploys on push to `main`. For manual deploy:

```bash
cd frontend
npx vercel --prod
```

### Verify Frontend

Visit `https://turfstack.vercel.app` and confirm:
- Landing page loads with TurfStack branding
- Login/register forms submit to the backend
- Dashboard loads after authentication

## Deployment Order

Always deploy in this order when both services change:

1. **Backend first** -- new API endpoints must exist before frontend calls them
2. **Frontend second** -- now safe to reference new endpoints

## Troubleshooting

| Issue | Check |
|-------|-------|
| CORS errors | Verify `CORS_ORIGINS` secret on Fly.io includes the Vercel domain |
| 502 on Fly.io | Run `fly logs` to check startup errors; often missing env vars |
| DB connection refused | Verify Postgres app is running: `fly status --app turfstack-db` |
| Frontend API errors | Verify `NEXT_PUBLIC_API_URL` env var is set correctly on Vercel |
| Build fails (frontend) | Check `npm run build` locally; common issue is missing `"use client"` directive |
| Build fails (backend) | Check `pip install` in Dockerfile; `bcrypt` version must be `>=4.0,<5.0` |

## Fly.io Key Commands

```bash
fly status              # App status
fly logs                # Live logs
fly ssh console         # SSH into the app container
fly secrets list        # List secret names
fly secrets set K=V     # Set/update a secret (triggers redeploy)
fly postgres connect    # Connect to Postgres via psql
fly scale show          # Current machine sizing
```
