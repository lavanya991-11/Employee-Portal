# Deploy the ESS Portal on the Azure VM (with SQL Server)

How to deploy the whole portal directly on the Azure VM (the Windows Server 2022 box at **20.174.1.174** that already runs SQL Server). Since the backend runs on the same machine as SQL, it can connect to SQL **locally**, which is simpler and more reliable.

## Overview

- **Database (SQL Server)** → on the VM, database `ess_portal`, SQL login `ess`.
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
   - **SQL Server** (already installed) + **SSMS** (SQL Server Management Studio) to run queries.

---

## STEP 1 — Get the code onto the VM

Pick one:

- **Git:** `git clone https://github.com/lavanya991-11/Employee-Portal.git C:\ess-portal`
- **Or** copy your `backend` and `frontend` folders to `C:\ess-portal`.

---

## STEP 2 — Create & configure the SQL Server database

### 2.1 Enable SQL authentication + TCP/IP

1. **Enable Mixed‑mode (SQL) authentication:**
   - SSMS → right‑click the server → **Properties → Security** → select **SQL Server and Windows Authentication mode** → OK → **restart** the SQL Server service.
2. **Enable TCP/IP:**
   - **SQL Server Configuration Manager** → SQL Server Network Configuration → Protocols → set **TCP/IP = Enabled** → set the TCP **Port = 1433** → **restart** the SQL Server service.

### 2.2 Create the login, database, and user

In **SSMS → New Query**, run:

```sql
-- 1. Server-level login used by the app
CREATE LOGIN ess WITH PASSWORD = 'P@ssw0rd.1', CHECK_POLICY = OFF;

-- 2. Create the database
CREATE DATABASE ess_portal;
GO

-- 3. Map the login into the database as owner
USE ess_portal;
CREATE USER ess FOR LOGIN ess;
ALTER ROLE db_owner ADD MEMBER ess;
```

> Use a strong password in production. The username/password/database here must match the `MSSQL_*` values in the backend `.env` (STEP 3).

### 2.3 Create all tables (from the code)

The repository ships the schema. After you create the backend `.env` in STEP 3, run:

```powershell
cd C:\ess-portal\backend
node sql/run-schema.js
```

This runs `sql/schema.sql` and creates all **19 tables** (Users, EmployeeInfo, Leaves, Loans, LoanRequests, Assets, Expenses, TravelRequests + lines/attachments, Overtimes, Calendars, CalendarPeriods, FinElements, IdentificationTypes, LoanProducts, ImageRegister, Settings, AmortizationTemp).

> `run-schema.js` reads the SQL connection from `backend\.env`, so create the `.env` first (STEP 3.2) and then run this command.

### 2.4 (Optional) Migrate existing data from MongoDB

Only if you are importing legacy data:

```powershell
node sql/migrate.js
```

(Requires a valid `MONGO_URI` in `.env` as the source. Skip for a fresh install.)

### 2.5 Verify the database

```sql
USE ess_portal;
SELECT name FROM sys.tables ORDER BY name;   -- should list 19 tables
SELECT COUNT(*) FROM Users;
```

---

## STEP 3 — Backend (Node + PM2) & portal database configuration

```powershell
cd C:\ess-portal\backend
npm install --omit=dev
```

### 3.2 Configure the portal's database connection (`backend\.env`)

Create the `backend\.env` file (Notepad) — note `MSSQL_SERVER=localhost` since SQL is on this same VM. These values are how the **portal connects to the database**:

```
PORT=3000

# --- SQL Server (local on this VM) ---
MSSQL_SERVER=localhost
MSSQL_PORT=1433
MSSQL_USER=ess
MSSQL_PASSWORD=P@ssw0rd.1
MSSQL_DATABASE=ess_portal

# --- Auth ---
JWT_SECRET=<your JWT secret>

# --- Business Central (OData / OAuth) ---
BC_TENANT_ID=...
BC_CLIENT_ID=...
BC_CLIENT_SECRET=...
BC_ENVIRONMENT=...
BC_COMPANY_ID=...
BC_SCOPE=...
BC_API_PATH=...
```

> **How the connection works:** the backend reads these `MSSQL_*` values and builds the SQL connection pool in `config/mssql.js` (with `encrypt: true` and `trustServerCertificate: true`, which suits a local/self‑signed SQL instance). No connection string is hard‑coded — everything comes from `.env`.

### 3.3 Create the tables (now that `.env` exists)

```powershell
node sql/run-schema.js
```

### 3.4 Start the API under PM2 and persist

```powershell
pm2 start server.js --name ess-api
pm2 save
```

Test locally on the VM: open `http://localhost:3000/api/settings` (should return JSON). The PM2 log (`pm2 logs ess-api`) should print **`SQL Server Connected (ess_portal)`** — this confirms the portal is talking to the database. PM2 will now auto‑start the API on reboot.

---

## STEP 4 — Frontend (build)

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

## STEP 5 — IIS: serve the frontend + proxy `/api`

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

## STEP 6 — Open the firewall

1. **Azure Portal → the VM → Networking** → add inbound NSG rules for **TCP 80** (and **443** later).
2. On the VM, **Windows Defender Firewall** → allow inbound **80/443** (IIS usually adds these automatically).

> Since we connect to SQL over `localhost`, no NSG rule is needed for the database (port 1433 stays internal).

---

## STEP 7 — Test

- On the VM: `http://localhost` → the login page loads; log in → data comes from SQL.
- From your PC: `http://20.174.1.174` → same. (Or your DNS name once you point one at the VM.)

---

## STEP 8 — HTTPS (recommended before going live)

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

---

## Troubleshooting (database)

| Symptom | Likely cause | Fix |
|---|---|---|
| `The "config.server" property is required` | `MSSQL_SERVER` not set | Add the `MSSQL_*` values to `backend\.env` |
| API 500 “Failed to connect …:1433” | SQL not reachable | Ensure SQL service running, **TCP/IP enabled**, **SQL auth on**, correct login/password |
| Login fails for `ess` | Wrong password / login not mapped | Re‑check STEP 2.2 (`CREATE LOGIN` / `CREATE USER` / `db_owner`) |
| `run-schema.js` errors | `.env` missing or DB not created | Create the DB (2.2) and `.env` (3.2) first, then run it |
| Empty lists after go‑live | Tables created but no data | Run `sql/migrate.js` or add data; log out/in for a fresh token |
