# SENTINEL MESH — PRODUCTION DEPLOYMENT GUIDE (100% FREE TIER)

This guide covers deploying **Sentinel Mesh** to production using only free tiers:
- **GitHub**: Source code repository
- **Supabase**: PostgreSQL database (append-only ledger, threat events, devices, email analyses)
- **Render**: Backend FastAPI service (`sentinel-mesh-api`)
- **Vercel**: Frontend React 19 + Vite SPA with Three.js 3D forensic core
- **Google Cloud Console**: Gmail OAuth 2.0 (`gmail.readonly`)

---

## DEPLOYMENT ORDER OVERVIEW

```
  Step 1: GitHub Repository (Push clean codebase)
     ↓
  Step 2: Supabase (Execute database schema.sql)
     ↓
  Step 3: Google Cloud OAuth (Configure client ID & secret)
     ↓
  Step 4: Render (Deploy backend web service from render.yaml)
     ↓
  Step 5: Vercel (Deploy frontend pointing to Render backend)
     ↓
  Step 6: Link Origins (Set Render FRONTEND_URL and Google redirect URI to Vercel)
     ↓
  Step 7: Verification & Uptime Ping
```

---

## STEP 1: GITHUB REPOSITORY

1. Initialize git and stage clean files (secrets are strictly excluded via `.gitignore`):
   ```bash
   git add .
   git commit -m "feat: complete Sentinel Mesh v2 multi-user, threat intel, blockchain ledger, and Gmail OAuth"
   ```
2. Create a new repository on GitHub:
   - Go to [https://github.com/new](https://github.com/new)
   - Repository name: `sentinel-mesh`
   - Visibility: Public or Private
   - Do **NOT** initialize with README/license (we already have a complete repo)
3. Push your code to GitHub:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/sentinel-mesh.git
   git push -u origin main
   ```

---

## STEP 2: SUPABASE (DATABASE SETUP)

1. Create a free account at [https://supabase.com](https://supabase.com) and click **New Project**.
2. Project Details:
   - **Name**: `sentinel-mesh-db`
   - **Database Password**: Set a strong password (save it securely)
   - **Region**: Choose the closest region to your users
   - **Pricing Plan**: Free Tier
3. Open the **SQL Editor** (left navigation bar) -> Click **New Query**.
4. Paste the entire content of [`backend/supabase/schema.sql`](backend/supabase/schema.sql) and click **Run**.
   - This creates tables: `users`, `investigation_ledger`, `threat_events`, `devices`, and `email_analyses`.
   - It attaches the `prevent_ledger_tampering()` PostgreSQL trigger that blocks `UPDATE` and `DELETE` on the ledger.
   - It enables Row Level Security (RLS) on all tables.
5. Copy your API credentials:
   - Go to **Project Settings** (gear icon) -> **API**.
   - Copy **Project URL** (`https://<project-id>.supabase.co`).
   - Copy **service_role key** (under *Project API keys* — do **NOT** use the anon key; the backend requires the service_role key to manage ledger and threat events).

---

## STEP 3: GOOGLE CLOUD CONSOLE (GMAIL OAUTH 2.0)

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project named `Sentinel-Mesh-SOC`.
3. Configure the **OAuth Consent Screen**:
   - User Type: **External** -> Click *Create*.
   - App Name: `Sentinel Mesh SOC`
   - User Support Email: Your email
   - Developer Contact Email: Your email
   - Click *Save and Continue*.
   - **Scopes**: Click *Add or Remove Scopes* -> Select `https://www.googleapis.com/auth/gmail.readonly` -> Click *Update* -> Click *Save and Continue*.
   - **Test Users**: Under *Publishing status: Testing*, add your personal/testing Gmail address -> Click *Save and Continue*.
4. Create **OAuth Client ID Credentials**:
   - Go to **APIs & Services** -> **Credentials** -> **Create Credentials** -> **OAuth Client ID**.
   - Application Type: **Web Application**.
   - Name: `Sentinel Mesh Web Client`.
   - **Authorized JavaScript origins**:
     - `http://localhost:5173` (for local development)
     - `https://<YOUR_VERCEL_APP>.vercel.app` (your production frontend URL)
   - **Authorized redirect URIs**:
     - `http://127.0.0.1:8000/api/v2/gmail/callback` (for local development)
     - `https://<YOUR_RENDER_APP>.onrender.com/api/v2/gmail/callback` (your Render backend URL)
   - Click **Create** and copy your **Client ID** and **Client Secret**.

---

## STEP 4: RENDER (BACKEND HOSTING)

1. Create a free account at [https://render.com](https://render.com).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository: `sentinel-mesh`.
4. Configure settings:
   - **Name**: `sentinel-mesh-api`
   - **Region**: Oregon (US West) or closest to Supabase
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: **Free**
5. Add Environment Variables in the Render Dashboard (**Environment** tab):
   | Key | Value | Notes |
   | :--- | :--- | :--- |
   | `PORT` | `10000` | Render port |
   | `FRONTEND_URL` | `https://<YOUR_VERCEL_APP>.vercel.app` | Leave localhost initially, update after Vercel deploy |
   | `SUPABASE_URL` | `https://<project-id>.supabase.co` | From Supabase API settings |
   | `SUPABASE_SERVICE_KEY` | `<your-service-role-key>` | From Supabase API keys |
   | `GOOGLE_CLIENT_ID` | `<your-google-client-id>.apps.googleusercontent.com` | From Google Cloud Console |
   | `GOOGLE_CLIENT_SECRET` | `<your-google-client-secret>` | From Google Cloud Console |
   | `GOOGLE_REDIRECT_URI` | `https://sentinel-mesh-api.onrender.com/api/v2/gmail/callback` | Exact callback URL |
   | `JWT_SECRET` | `<32-char-random-string>` | Secret key for JWT auth |
   | `ENABLE_MULTI_USER` | `true` | Enables multi-user features |
   | `ENABLE_GMAIL` | `true` | Enables Gmail integration |
   | `ENABLE_THREAT_INTELLIGENCE` | `true` | Enables frequency analytics |
   | `ENABLE_BLOCKCHAIN` | `true` | Enables ledger chain of custody |
6. Click **Deploy Web Service**.
7. Once deployed, test the health endpoint: `https://sentinel-mesh-api.onrender.com/api/health` -> should return `{"status": "online", "engine": "Sentinel Mesh Forensic Core v2.1"}`.

---

## STEP 5: VERCEL (FRONTEND HOSTING)

1. Create a free account at [https://vercel.com](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository: `sentinel-mesh`.
4. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* -> Select `frontend` -> Click *Continue*.
   - **Build Command**: `npm run build` (automatic)
   - **Output Directory**: `dist` (automatic)
5. Add Environment Variable (**Environment Variables** section):
   - **Name**: `VITE_API_URL`
   - **Value**: `https://<YOUR_RENDER_APP>.onrender.com` (e.g. `https://sentinel-mesh-api.onrender.com`)
6. Click **Deploy**.
7. Once deployment finishes, Vercel gives you your production URL: `https://<YOUR_APP>.vercel.app`.

---

## STEP 6: UPDATE ORIGINS & REDEPLOY

Now that both backend and frontend URLs are known:
1. **In Render Dashboard**:
   - Update `FRONTEND_URL` to `https://<YOUR_APP>.vercel.app`.
   - Save changes (Render will automatically re-deploy).
2. **In Google Cloud Console**:
   - Add `https://<YOUR_APP>.vercel.app` to **Authorized JavaScript origins**.
   - Ensure `https://<YOUR_RENDER_APP>.onrender.com/api/v2/gmail/callback` is in **Authorized redirect URIs**.
3. **In Supabase Dashboard**:
   - In **Authentication** -> **URL Configuration**, set Site URL to `https://<YOUR_APP>.vercel.app`.

---

## STEP 7: VERIFICATION TEST CHECKLIST

- [ ] **Health & Keep-Alive Check**:
  - Visit `https://<YOUR_RENDER_APP>.onrender.com/api/health`.
  - Confirms `"status": "online"` and database status.
- [ ] **Frontend Loading**:
  - Visit `https://<YOUR_APP>.vercel.app`.
  - Hero section, 3D ThreatCore envelope, and custom cursor load without console errors.
- [ ] **Deterministic Forensic Analysis**:
  - Click any sample case or upload an `.eml` file.
  - Verifies all 12 forensic scanners complete and produce risk score & AI summary.
- [ ] **Threat Intelligence & Frequency Analytics**:
  - Navigate to **SOC Console** -> Click **THREAT INTELLIGENCE & FREQUENCY** tab.
  - Horizontal frequency bars (Malicious URL %, DMARC %, Phishing %) and 7D timeline render live.
- [ ] **Blockchain Ledger & Tamper Verification**:
  - Click **EVIDENCE VAULT & BLOCKCHAIN LEDGER** tab.
  - Review block list with cryptographic hash linkage.
  - Click **Simulate 1-Byte Tamper Test** to verify instant detection: `⚠ INTEGRITY MISMATCH DETECTED`.
- [ ] **Gmail Integration**:
  - Click **CONNECT GMAIL** in Navbar or Hero.
  - Test selecting an authorized message and clicking **Analyze Selected Message**.
- [ ] **Dark & Light Theming**:
  - Toggle theme switch in top right. Confirm light/dark surfaces transition smoothly.

---

## FREE-TIER OPERATIONAL BEHAVIOUR & LIMITATIONS

> [!NOTE]
> **Render Free Tier Spin-Down**:
> Render free web services automatically spin down into a sleep state after ~15 minutes of inactivity.
> The first incoming request will take **30 to 60 seconds** to wake up. Subsequent requests respond instantly.
> **Pro-Tip**: Set up a free uptime monitor (such as [cron-job.org](https://cron-job.org) or [UptimeRobot](https://uptimerobot.com)) to ping `GET /api/health` every 10 minutes. Because `/api/health` queries Supabase (`SELECT 1`), this keeps **both Render and Supabase awake 24/7**.

> [!NOTE]
> **Supabase Free Tier Inactivity Pause**:
> Supabase projects on the free tier pause after 7 days of zero database queries. Pinging the backend health endpoint (or visiting the console) keeps the database active.

> [!NOTE]
> **Google OAuth "Testing" Mode Token Lifespan**:
> While your Google Cloud OAuth app is in *Testing* status (unverified), refresh tokens expire after **7 days**. For an ongoing demo or competition presentation, either refresh authorization or publish the app to Production mode.
