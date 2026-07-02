# Deploy the ESS Portal on the Azure VM (with SQL Server)

How to deploy the whole portal directly on the Azure VM (the Windows Server 2022 box at **20.174.1.174** that already runs SQL Server). Since the backend runs on the same machine as SQL, it can connect to SQL **locally**, which is simpler and more reliable.

## Overview

- **Backend (Node/Express)** → runs on the VM under **PM2** (keeps it alive / restarts on reboot), listening on port **3000**.
- **Frontend (React build)** → static files served by **IIS** on port **80/443**.
- **IIS reverse proxy** → forwards `/api` to the Node backend, so everything is same‑origin (no CORS issues, one URL).

---

## STEP 0 — Connect & prerequisites

1. **RDP** into the VM (`20.174.1.174`) with your admin account.
2. Install these (download on the VM):
   - **Node.js 22 LTS** (Windows installer) → verify in PowerShell: `node -v`
   - **Git** (optional, to clone) — or you'll copy a zip.
   - **PM2**: `npm install -g pm2` and `npm install -g pm2-windows-startup` then `pm2-startup install` (makes PM2 start on boot).
   - **IIS** with **URL Rewrite** and **Application Request Routing (ARR)**:
     - Server Manager → Add Roles → **Web Server (IIS)**.
     - Download & install **URL Rewrite** and **ARR** from the IIS site (Microsoft).

---

## STEP 1 — Get the code onto the VM

Pick one:

- **Git:** `git clone https://github.com/lavanya991-11/Employee-Portal.git C:\ess-portal`
- **Or** copy your `backend` and `frontend` folders to `C:\ess-portal`.

---

## STEP 2 — Backend (Node + PM2)

```powershell
cd C:\ess-portal\backend
npm install --omit=dev
```

Create the `backend\.env` file (Notepad) — note `MSSQL_SERVER=localhost` since SQL is on this same VM:

```
PORT=3000
MSSQL_SERVER=localhost
MSSQL_PORT=1433
MSSQL_USER=ess
MSSQL_PASSWORD=P@ssw0rd.1
MSSQL_DATABASE=ess_portal
JWT_SECRET=<your JWT secret>
BC_TENANT_ID=...
BC_CLIENT_ID=...
BC_CLIENT_SECRET=...
BC_ENVIRONMENT=...
BC_COMPANY_ID=...
BC_SCOPE=...
BC_API_PATH=...
```

Start it under PM2 and persist:

```powershell
pm2 start server.js --name ess-api
pm2 save
```

Test locally on the VM: open `http://localhost:3000/api/settings` (should return JSON). PM2 will now auto‑start the API on reboot.

> **Tip:** make sure SQL Server allows **TCP/IP** and **SQL auth**. Since we connect to `localhost`, no Azure NSG rule is needed for the DB.

---

## STEP 3 — Frontend (build)

```powershell
cd C:\ess-portal\frontend
```

Set the API URL to same‑origin (because IIS will proxy `/api`), then build:

```powershell
# create frontend\.env.production with this line:
# VITE_API_URL=/api
npm install
npm run build
```

This produces `C:\ess-portal\frontend\dist`.

---

## STEP 4 — IIS: serve the frontend + proxy `/api`

1. **IIS Manager → Sites → Add Website:**
   - Site name: `ess-portal`
   - Physical path: `C:\ess-portal\frontend\dist`
   - Port: `80` (and later `443` for SSL)
2. **Reverse proxy** so `/api` goes to the Node backend:
   - Enable ARR proxy: IIS Manager → server node → **Application Request Routing Cache → Server Proxy Settings** → check **Enable proxy** → Apply.
   - Add a `web.config` in `C:\ess-portal\frontend\dist` (or use the URL Rewrite UI) with:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <!-- Proxy API calls to the Node backend -->
        <rule name="api-proxy" stopProcessing="true">
          <match url="^api/(.*)" />
          <action type="Rewrite" url="http://localhost:3000/api/{R:1}" />
        </rule>
        <!-- SPA fallback: send everything else to index.html -->
        <rule name="spa" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

The **SPA fallback** rule is important so page refreshes on routes like `/leaves/my` don't 404.

---

## STEP 5 — Open the firewall

1. **Azure Portal → the VM → Networking** → add inbound NSG rules for **TCP 80** (and **443** later).
2. On the VM, **Windows Defender Firewall** → allow inbound **80/443** (IIS usually adds these automatically).

---

## STEP 6 — Test

- On the VM: `http://localhost` → the login page loads; log in → data comes from SQL.
- From your PC: `http://20.174.1.174` → same. (Or your DNS name once you point one at the VM.)

---

## STEP 7 — HTTPS (recommended before going live)

- Easiest on Windows: **win‑acme** (free Let's Encrypt client) → run it, pick the IIS site, it installs & auto‑renews the SSL cert and adds the 443 binding.
- Requires a **domain name** pointing to `20.174.1.174`.

---

## Updating later (redeploy)

```powershell
cd C:\ess-portal
git pull
cd backend; npm install --omit=dev; pm2 restart ess-api
cd ..\frontend; npm install; npm run build
```

(IIS serves the new `dist` immediately.)
