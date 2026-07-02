# Auto-deploy for the Azure VM.
# Pulls the latest code and, ONLY if there are new commits, updates the backend
# (PM2) and rebuilds the frontend. Safe to run on a schedule (does nothing when
# there's nothing new).
# Manual run:   powershell -ExecutionPolicy Bypass -File .\deploy.ps1
# Run it from the repo root (the folder that contains backend\ and frontend\).

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

$before = (git rev-parse HEAD)
git fetch origin main | Out-Null
$after = (git rev-parse origin/main)

if ($before -eq $after) {
    Write-Host "$(Get-Date -Format 'u')  No new commits - nothing to deploy." -ForegroundColor DarkGray
    exit 0
}

Write-Host "==> New commits found. Deploying..." -ForegroundColor Cyan
git pull origin main

Write-Host "==> Updating backend..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot\backend"
npm install --omit=dev
$running = (pm2 jlist | ConvertFrom-Json) | Where-Object { $_.name -eq 'ess-api' }
if ($running) { pm2 restart ess-api } else { pm2 start server.js --name ess-api; pm2 save }

Write-Host "==> Rebuilding frontend..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot\frontend"
npm install
npm run build

Set-Location $PSScriptRoot
Write-Host "==> Deploy complete at $(Get-Date -Format 'u')." -ForegroundColor Green
