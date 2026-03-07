# Deployment URLs & settings

## Frontend (Vercel)
- **URL:** https://sfms-eight.vercel.app

## Backend (Render) – CORS setting
So the frontend can call the API, set this in **Render → your service → Environment**:

**Key:** `CORS_ORIGINS`  
**Value (copy exactly):**
```
["https://sfms-eight.vercel.app","http://localhost:3001"]
```

Save and redeploy the backend so CORS takes effect.

## Vercel – API URL
In **Vercel → Project → Settings → Environment Variables**:

**Key:** `NEXT_PUBLIC_API_URL`  
**Value:** your Render backend URL (e.g. `https://bookyourslots-api.onrender.com`)

No trailing slash. Redeploy the frontend if you change it.
