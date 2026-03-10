# Server setup – fix API URL and CORS (one step at a time)

Do these on the **server** after you have pulled the code.

---

## Step 1 – Go to the project and docker folder

```bash
cd /path/to/HotelSystems
cd docker
```

*(Use the real path where you cloned HotelSystems, e.g. `~/HotelSystems` or `/root/HotelSystems`.)*

---

## Step 2 – Create `.env` from the example

```bash
cp .env.server.example .env
```

This sets:
- `NEXT_PUBLIC_API_URL=http://72.60.101.226:8001` (so the browser calls your server’s API)
- `CORS_ORIGINS` so the backend allows requests from `http://72.60.101.226:3000`

If your server’s public IP is **not** `72.60.101.226`, edit `.env` and replace that IP with yours.

---

## Step 3 – Rebuild and start (so frontend gets the new API URL)

```bash
docker compose --env-file .env up -d --build
```

Or, if you’re already in the same folder and `.env` is there:

```bash
docker compose up -d --build
```

This rebuilds the frontend with `NEXT_PUBLIC_API_URL` baked in and starts all services with the new CORS and API URL.

---

## Step 4 – Check

- Open **http://72.60.101.226:3000** (or your server IP) in a browser.
- Try **Register** or **Login**. The “Network error” should be gone if the API is reachable and CORS is correct.

---

**Optional:** If you use Google Sign-In, add to `.env` on the server:

```bash
GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

Then run **Step 3** again (rebuild and start).
