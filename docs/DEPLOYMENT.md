# ESS Portal — Azure VM Deployment Guide

Complete, reproducible steps to deploy the **Employee Self‑Service (ESS) Portal** on a single **Azure Windows Server VM** that also hosts **Microsoft SQL Server**.

- **Frontend:** React (Vite) static build, served by **IIS**
- **Backend:** Node.js / Express, run under **PM2** (port 3000)
- **Database:** Microsoft SQL Server (installed on the same VM)
- **Integration (optional):** Microsoft Dynamics 365 Business Central (OData/OAuth)

> Because the backend and SQL Server are on the **same VM**, the backend connects to SQL over **`localhost`** — no database network exposure required.

---

## 1. Architecture Overview

```
                 Azure Windows Server VM (e.g. 20.174.1.174)
  Browser  ──►  IIS  (port 80 / 8888, serves React build + proxies /api)
                 │
                 └─►  Node/Express API (PM2, port 3000)
                          │
                          └─►  SQL Server  (localhost:1433, DB: ess_portal)
```

| Layer | Technology | Location on VM |
|---|---|---|
| Web server / static | IIS + URL Rewrite + ARR | `F:\ess-portal\frontend\dist` |
| Backend API | Node 22 + Express + PM2 | `F:\ess-portal\backend` |
| Database | SQL Server (SQL auth) | local instance, DB `ess_portal` |

---

## 2. Prerequisites

Install the following **on the VM** (RDP in as an administrator):

| Software | Version | Purpose | Verify |
|---|---|---|---|
| Node.js | **22 LTS** | Backend runtime + frontend build | `node -v` |
| Git | latest | Pull the source code | `git --version` |
| PM2 | latest | Keep the API alive + auto‑start on reboot | `pm2 -v` |
| IIS | Windows role | Serve the frontend + reverse proxy | Server Manager |
| URL Rewrite | latest | IIS rewrite rules (SPA fallback + proxy) | iis.net |
| ARR (App Request Routing) | latest | IIS reverse proxy to Node | iis.net |
| SQL Server | 2019/2022 | Database (already installed) | SSMS |
| SSMS | latest | Manage SQL Server | — |

Install PM2 and its Windows startup helper:
```powershell
npm install -g pm2 pm2-windows-startup
pm2-startup install
```

---

## 3. Azure VM Setup & Configuration

1. **Create / identify the VM** in the Azure Portal:
   - OS: **Windows Server 2019/2022**
   - Size: at least **2 vCPU / 8 GB RAM** for SQL + Node + IIS
   - Note the **public IP** (e.g. `20.174.1.174`) and DNS name if set.
2. **Networking (NSG) — inbound rules** (VM → Networking → Add inbound port rule):
   | Port | Protocol | Purpose | Source |
   |---|---|---|---|
   | 3389 | TCP | RDP (admin) | Your IP only (recommended) |
   | 80 | TCP | HTTP (IIS) | Any / your users |
   | 443 | TCP | HTTPS (after SSL) | Any |
   | 1433 | TCP | SQL **only if** remote DB access needed | Restricted IPs |
   > If the frontend uses the IIS `/api` proxy (recommended), you do **not** need to open port 3000 externally.
3. **Windows Firewall** on the VM — allow the same web ports:
   ```powershell
   New-NetFirewallRule -DisplayName "HTTP 80"  -Direction Inbound -Protocol TCP -LocalPort 80  -Action Allow
   New-NetFirewallRule -DisplayName "HTTPS 443" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
   ```
4. **Data disk (optional):** keep the app on a data drive (e.g. `F:\`) separate from the OS disk.

---

## 4. SQL Server Installation & Configuration

If SQL Server is already installed, verify the settings below; otherwise install **SQL Server Developer/Standard** + **SSMS**.

1. **Enable Mixed‑Mode (SQL) authentication:**
   - SSMS → right‑click the server → **Properties → Security** → select **SQL Server and Windows Authentication mode** → OK → **restart** the SQL Server service.
2. **Enable TCP/IP:**
   - **SQL Server Configuration Manager** → SQL Server Network Configuration → Protocols → **TCP/IP = Enabled** → set TCP Port **1433** → restart the SQL Server service.
3. **Create the application login (`ess`):**
   ```sql
   CREATE LOGIN ess WITH PASSWORD = 'P@ssw0rd.1', CHECK_POLICY = OFF;
   ```
4. **Firewall for SQL (only if remote access is needed):**
   ```powershell
   New-NetFirewallRule -DisplayName "SQL 1433" -Direction Inbound -Protocol TCP -LocalPort 1433 -Action Allow
   ```
   For a same‑VM backend (localhost), this is not required.

---

## 5. Database Creation & Deployment

The repository ships everything to build the schema and migrate data.

1. **Create the database** (SSMS):
   ```sql
   CREATE DATABASE ess_portal;
   GO
   USE ess_portal;
   CREATE USER ess FOR LOGIN ess;
   ALTER ROLE db_owner ADD MEMBER ess;
   ```
2. **Create the tables** — from the backend folder:
   ```powershell
   cd F:\ess-portal\backend
   npm install
   node sql/run-schema.js
   ```
   This runs `sql/schema.sql` and creates all 19 tables (Users, EmployeeInfo, Leaves, Loans, LoanRequests, Assets, Expenses, TravelRequests + lines/attachments, Overtimes, Calendars, CalendarPeriods, FinElements, IdentificationTypes, LoanProducts, ImageRegister, Settings, AmortizationTemp).
3. **(Optional) Migrate existing MongoDB data → SQL** (one‑time, only if you have legacy Mongo data):
   ```powershell
   node sql/migrate.js
   ```
   Requires a valid `MONGO_URI` in `.env` for the source. Skip this for a fresh install.
4. **Verify:**
   ```sql
   USE ess_portal;
   SELECT name FROM sys.tables ORDER BY name;   -- should list 19 tables
   SELECT COUNT(*) FROM Users;
   ```

---

## 6. Backend Configuration & Integration

1. **Get the code:**
   ```powershell
   git clone https://github.com/lavanya991-11/Employee-Portal.git F:\ess-portal
   cd F:\ess-portal\backend
   npm install --omit=dev
   ```
2. **Create `F:\ess-portal\backend\.env`** (connection + all settings):
   ```
   PORT=3000

   # --- SQL Server (local on this VM) ---
   MSSQL_SERVER=localhost
   MSSQL_PORT=1433
   MSSQL_USER=ess
   MSSQL_PASSWORD=P@ssw0rd.1
   MSSQL_DATABASE=ess_portal

   # --- Auth ---
   JWT_SECRET=<a long random secret>

   # --- Business Central (OData / OAuth) ---
   BC_TENANT_ID=<tenant guid>
   BC_CLIENT_ID=<app id>
   BC_CLIENT_SECRET=<secret>
   BC_ENVIRONMENT=<env name>
   BC_COMPANY_ID=<company guid>
   BC_SCOPE=<scope>
   BC_API_PATH=<api path>
   ```
   > **Connection string note:** the app builds the SQL connection from the `MSSQL_*` values (see `config/mssql.js`). Encryption is on with `trustServerCertificate: true`, which suits a local/self‑signed SQL instance.
3. **Start the API under PM2 (auto‑restart + boot persistence):**
   ```powershell
   pm2 start server.js --name ess-api
   pm2 save
   ```
4. **Verify the backend + DB integration** (on the VM):
   - Open `http://localhost:3000/api/settings` → JSON response.
   - The PM2 log (`pm2 logs ess-api`) should print **`SQL Server Connected (ess_portal)`**.

---

## 7. Frontend Build & Configuration

1. **Set the API base URL** — create `F:\ess-portal\frontend\.env.production`:
   ```
   VITE_API_URL=/api
   ```
   (Same‑origin via the IIS proxy — recommended. Alternative: `http://<vm-ip>:3000/api`, which requires opening port 3000.)
2. **Build:**
   ```powershell
   cd F:\ess-portal\frontend
   npm install
   npm run build
   ```
   Output: `F:\ess-portal\frontend\dist` (contains `index.html` + `assets/`).

---

## 8. IIS Configuration

1. **Add the website:** IIS Manager → **Sites → Add Website**
   - Site name: `ess-portal`
   - Physical path: `F:\ess-portal\frontend\dist`
   - Binding: HTTP, port **80** (or 8888)
2. **Enable the reverse proxy:** IIS Manager → (server node) → **Application Request Routing Cache → Server Proxy Settings → Enable proxy** → Apply.
3. **Add `web.config`** in `F:\ess-portal\frontend\dist` — proxies `/api` to the Node backend and provides the SPA fallback (so refreshing a route like `/dashboard` does not 404):
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <configuration>
     <system.webServer>
       <rewrite>
         <rules>
           <rule name="api-proxy" stopProcessing="true">
             <match url="^api/(.*)" />
             <action type="Rewrite" url="http://localhost:3000/api/{R:1}" />
           </rule>
           <rule name="spa-fallback" stopProcessing="true">
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
4. **Restart** the site in IIS Manager.

---

## 9. Firewall, Ports & Security

| Port | Where | Open to | Notes |
|---|---|---|---|
| 3389 (RDP) | NSG | Your admin IP only | Do not leave open to the world |
| 80 (HTTP) | NSG + Windows FW | Users | Frontend |
| 443 (HTTPS) | NSG + Windows FW | Users | After SSL setup |
| 3000 (API) | **Not exposed** | localhost only | Reached via IIS `/api` proxy |
| 1433 (SQL) | Local only | localhost | Do not expose publicly |

**Security hardening recommendations:**
- Restrict **RDP (3389)** to known IPs; consider Azure Bastion.
- Use a **strong `JWT_SECRET`** and a strong SQL password.
- Keep **port 3000 internal** (use the `/api` proxy) so the API isn't directly reachable.
- Add **HTTPS** (Section 11) before go‑live.
- Keep Windows, Node, and SQL patched.

---

## 10. Application Deployment & Verification

1. **On the VM**, confirm each layer:
   - `pm2 list` → `ess-api` is **online**.
   - `http://localhost:3000/api/settings` → JSON.
   - `http://localhost/` → login page loads.
2. **From a client PC:** `http://<vm-public-ip>/` (or `:8888`) → login page.
3. **Log in** with a valid account → the Dashboard and lists load data from SQL.
4. **Functional smoke test:** apply a leave, open Payslip, view admin collections — confirm data reads/writes.

---

## 11. HTTPS (recommended before go‑live)

1. Point a **domain name** (A record) at the VM public IP.
2. Install **win‑acme** (free Let's Encrypt client) on the VM.
3. Run it → select the IIS site → it issues the certificate, adds the **443** binding, and **auto‑renews**.
4. Update the NSG/Windows Firewall to allow **443** (Section 9).

---

## 12. Updates & Automated Redeployment

The repo root has **`deploy.ps1`** — pulls the latest, restarts the backend, and rebuilds the frontend (only when there are new commits).

**Manual update:**
```powershell
cd F:\ess-portal
powershell -ExecutionPolicy Bypass -File .\deploy.ps1
```

**Fully automatic (every ~5 min after a push)** — run once as admin:
```powershell
$action    = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -NoProfile -File F:\ess-portal\deploy.ps1" -WorkingDirectory "F:\ess-portal"
$trigger   = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5)
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType S4U -RunLevel Highest
Register-ScheduledTask -TaskName "ESS Portal Auto Deploy" -Action $action -Trigger $trigger -Principal $principal
```

---

## 13. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Login → `ERR_CONNECTION_REFUSED` | Backend not running, or frontend built with `localhost` | Start PM2; rebuild frontend with correct `VITE_API_URL` |
| Login → `ERR_CONNECTION_TIMED_OUT` | Port blocked by firewall | Open the port in **NSG + Windows Firewall**, or use the `/api` proxy |
| 500 on API calls | Backend can't reach SQL, or missing env value | Check `pm2 logs ess-api`; confirm `MSSQL_*` and `BC_*` in `.env` |
| `The "config.server" property is required` | `MSSQL_SERVER` not set | Add the `MSSQL_*` values to `.env` |
| `404 - File or directory not found` on `/login` | Missing SPA fallback | Add the `web.config` (Section 8) + install URL Rewrite |
| API 500 “Server error / Failed to connect …:1433” | SQL unreachable | Ensure SQL service running, TCP/IP enabled, correct login/password |
| Old data shown after deploy | Frontend `dist` not rebuilt | Run `deploy.ps1` / `npm run build`, then hard‑refresh (Ctrl+F5) |
| Users see empty lists after DB switch | Stale login token | Log out and log back in |

Useful commands:
```powershell
pm2 logs ess-api --lines 60      # backend errors / stack traces
pm2 restart ess-api              # restart API
Test-NetConnection <ip> -Port 3000   # port reachability
```

---

## 14. Post‑Deployment Validation Checklist

- [ ] SQL Server running; `ess_portal` DB has 19 tables and data.
- [ ] `pm2 list` shows `ess-api` **online**; log shows `SQL Server Connected`.
- [ ] `http://localhost:3000/api/settings` returns JSON on the VM.
- [ ] IIS site serving `frontend\dist`; `web.config` present (proxy + SPA fallback).
- [ ] `http://<vm-ip>/` loads the login page from a remote PC.
- [ ] Login works; Dashboard + lists show data.
- [ ] Create/read a record (e.g. apply leave) works.
- [ ] NSG restricts RDP; only 80/443 open publicly; 3000/1433 internal.
- [ ] (If applicable) HTTPS active and auto‑renewing.
- [ ] `deploy.ps1` scheduled task registered for auto‑updates.

---

*Repository:* `https://github.com/lavanya991-11/Employee-Portal`
*Document maintained in:* `docs/DEPLOYMENT.md`
