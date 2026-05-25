# Push to GitHub（解决 Clash 系统代理导致 git TLS 被重置）
# 用法: .\scripts\push-github.ps1
# 可选: .\scripts\push-github.ps1 -KeepSystemProxy  （不临时关系统代理，需自行开 TUN）

param([switch]$KeepSystemProxy)

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

if (-not (git remote get-url origin 2>$null)) {
  git remote add origin https://github.com/Polarisssin/java-bighomework.git
}

Remove-Item Env:HTTP_PROXY, Env:HTTPS_PROXY, Env:ALL_PROXY -ErrorAction SilentlyContinue
# 全局 http.proxy 会让 git 走 Clash 混合端口，TLS 常被 reset；直连 GitHub 通常更稳（需 TUN 或能直连）
git config --global --unset http.proxy 2>$null
git config --global --unset https.proxy 2>$null
git config --local --unset http.proxy 2>$null
git config --local --unset https.proxy 2>$null

$regPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings"
$oldEnable = (Get-ItemProperty -Path $regPath).ProxyEnable
$oldServer = (Get-ItemProperty -Path $regPath).ProxyServer

if (-not $KeepSystemProxy -and $oldEnable -eq 1) {
  Write-Host "Temporarily disabling Windows system proxy ($oldServer) for git push..." -ForegroundColor Yellow
  Write-Host "Clash TUN can stay on; only 'System Proxy' is turned off for this push." -ForegroundColor DarkGray
  Set-ItemProperty -Path $regPath -Name ProxyEnable -Value 0
}

try {
  Write-Host "Testing GitHub..." -ForegroundColor Cyan
  git ls-remote origin HEAD 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "Cannot reach GitHub. Enable Clash TUN, pick a working node, then run this script again."
  }

  Write-Host "Pushing main..." -ForegroundColor Cyan
  git push -u origin main

  Write-Host "Pushing tags..." -ForegroundColor Cyan
  git push origin --tags 2>$null

  Write-Host "Done: https://github.com/Polarisssin/java-bighomework" -ForegroundColor Green
}
finally {
  if (-not $KeepSystemProxy -and $oldEnable -eq 1) {
    Set-ItemProperty -Path $regPath -Name ProxyEnable -Value 1
    if ($oldServer) { Set-ItemProperty -Path $regPath -Name ProxyServer -Value $oldServer }
    Write-Host "System proxy restored." -ForegroundColor DarkGray
  }
}
