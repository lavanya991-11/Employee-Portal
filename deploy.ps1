# One-command deploy for the Azure VM.
# Pulls the latest code, updates the backend (PM2) and rebuilds the frontend.
# Usage (on the VM):  powershell -ExecutionPolicy Bypass -File .\deploy.ps1
# Run it from the repo root (the folder that contains backend\ and frontend\).

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

Write-Host "==> Pulling latest from GitHub (main)..." -ForegroundColor Cyan
git pull origin main

Write-Host "==> Updating backend..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot\backend"
npm install --omit=dev
# Restart the API under PM2 (start it if it isn't running yet).
$running = (pm2 jlist | ConvertFrom-Json) | Where-Object { $_.name -eq 'ess-api' }
if ($running) { pm2 restart ess-api } else { pm2 start server.js --name ess-api; pm2 save }

Write-Host "==> Rebuilding frontend..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot\frontend"
npm install
npm run build

Set-Location $PSScriptRoot
Write-Host "==> Deploy complete. Frontend rebuilt to frontend\dist and API restarted." -ForegroundColor Green
