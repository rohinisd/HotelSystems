# Server setup – fix “Network error” and show Google Sign-In

If you see **“Network error”** or **“API not working”** when clicking Register/Login, the browser is calling the wrong API URL. If the **Google button is missing**, the frontend wasn’t built with a Google Client ID. Fix both by setting env vars and rebuilding on the server.

---

## Why “Network error” happens

The frontend is built with `NEXT_PUBLIC_API_URL` **baked in**. If it was built as `http://localhost:8001`, the **browser** (on the user’s PC) tries to reach `localhost:8001` on the **user’s machine**, not your server, so the request fails. You must **rebuild** the frontend with your server’s public API URL.

---

## Step 1 – Go to the docker folder on the server

```bash
cd /path/to/HotelSystems
cd docker
```

*(Use the real path where you cloned HotelSystems, e.g. `~/HotelSystems` or `/root/HotelSystems`.)*

---

## Step 2 – Create `.env` with API URL and CORS

Create a file named `.env` in the `docker` folder with this content (replace `72.60.101.226` with your server’s public IP if different):

```bash
NEXT_PUBLIC_API_URL=http://72.60.101.226:8001
CORS_ORIGINS='["http://localhost:3000","http://72.60.101.226:3000"]'
```

**Or copy from the example (includes Google Client ID from repo):**

```bash
cp .env.server.example .env
```

Then edit `.env` if your server IP is not `72.60.101.226`. The example already has `GOOGLE_CLIENT_ID` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` set for the project’s Google OAuth app.

---

## Step 3 – (Optional) Add Google Sign-In so the Google button appears

Edit `.env` and add your Google OAuth Client ID (same value for both):

```bash
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

Get the Client ID from [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → Create OAuth 2.0 Client ID (Web application). Add `http://72.60.101.226:3000` (and your domain) to **Authorized JavaScript origins**.

---

## Step 4 – Rebuild and start

**You must rebuild** so the frontend gets the new `NEXT_PUBLIC_*` values:

```bash
docker compose up -d --build
```

If `.env` is in the same folder, Docker Compose will load it. This rebuilds the frontend with the correct API URL (and Google Client ID if set).

---

## Step 5 – Check

1. Open **http://72.60.101.226:3000** (or your server IP) in a browser.
2. Go to **Register**. You should see:
   - No “Network error” when submitting the form (API URL is correct).
   - The **Google** sign-up option at the top if you set `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.

If you still see “Network error”, confirm:
- Backend is running: `curl http://localhost:8001/api/v1/health` on the server should return `{"status":"healthy",...}`.
- Firewall allows port 8001: `sudo firewall-cmd --list-ports` (add with `--add-port=8001/tcp` if needed).
