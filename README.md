# Hotel Management System

Basic hotel management app: list hotels and rooms, login, register. Built for deployment on your own server or cloud (Neon + Render/Vercel).

**Start here:** [REFERENCE.md](REFERENCE.md) – master log of steps, layout, and pointers to all docs.

## Quick start (Docker)

```bash
cd docker
cp ../.config/.env.example .env   # optional: edit if you need different DB/auth
docker compose up -d --build
```

- **Frontend:** http://localhost:3000  
- **Backend API:** http://localhost:8001  
- **API docs:** http://localhost:8001/api/docs  

Database is seeded with one hotel, five rooms, and one user (see [db/seed.sql](db/seed.sql)). Use **Register** in the UI to create an account.

## Docs

| Doc | Purpose |
|-----|---------|
| [REFERENCE.md](REFERENCE.md) | Single reference: steps done, layout, run instructions, next steps |
| [DEPLOYMENT_SETUP.md](DEPLOYMENT_SETUP.md) | GitHub, Neon, Render, Vercel; server vs cloud; backups |
| [ON_SERVER_STACK.md](ON_SERVER_STACK.md) | On-server stack, Nginx, Git on server, Cursor Remote-SSH |
| [SKILLS.md](SKILLS.md) | Cursor skills and conventions for this repo |

## Stack

- **Backend:** FastAPI (Python 3.12), `hotel_ms`, Uvicorn, PostgreSQL 16  
- **Frontend:** Next.js 15, React 19, Tailwind  
- **Run:** Docker Compose (postgres + backend + frontend)
