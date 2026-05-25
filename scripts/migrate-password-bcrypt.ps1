# 在云 MySQL 执行 BCrypt 密码迁移（需已登录 cloudbase CLI）
# 用法: .\scripts\migrate-password-bcrypt.ps1

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)
$EnvId = if ($env:TCB_ENV_ID) { $env:TCB_ENV_ID } else { "health-app-env-3g73ck72bcb11c66" }

$sql = Get-Content -LiteralPath "sql\migrate-password-bcrypt.sql" -Raw -Encoding UTF8
$stmts = $sql -split ";" | ForEach-Object { $_.Trim() } | Where-Object { $_ -and $_ -notmatch "^\s*--" }

Write-Host "Migrating passwords on env $EnvId ..." -ForegroundColor Cyan
foreach ($s in $stmts) {
  $one = $s + ";"
  Write-Host ">> $($one.Substring(0, [Math]::Min(70, $one.Length)))" -ForegroundColor DarkGray
  & "$PSScriptRoot\run-one-sql.ps1" -Sql $one -EnvId $EnvId
}
Write-Host "Done. Test login: admin/admin, nurse01/nurse01" -ForegroundColor Green
