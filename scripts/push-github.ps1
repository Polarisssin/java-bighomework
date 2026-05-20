# Push to https://github.com/Polarisssin/java-bighomework
# Run in PowerShell from repo root: .\scripts\push-github.ps1

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

if (-not (git remote get-url origin 2>$null)) {
  git remote add origin https://github.com/Polarisssin/java-bighomework.git
}

Write-Host "Pushing main..." -ForegroundColor Cyan
git push -u origin main

Write-Host "Pushing tags v1.0.0 - v1.5.0..." -ForegroundColor Cyan
git push origin --tags

Write-Host "Done: https://github.com/Polarisssin/java-bighomework" -ForegroundColor Green
