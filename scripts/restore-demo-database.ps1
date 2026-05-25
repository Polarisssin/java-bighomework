# 整理云 MySQL：删除自测数据，恢复 6 位种子老人与床位
# 用法: .\scripts\restore-demo-database.ps1

$ErrorActionPreference = "Continue"
Set-Location (Split-Path $PSScriptRoot -Parent)
$EnvId = if ($env:TCB_ENV_ID) { $env:TCB_ENV_ID } else { "health-app-env-3g73ck72bcb11c66" }

$sql = Get-Content -LiteralPath "sql\restore-demo-database.sql" -Raw -Encoding UTF8
$stmts = $sql -split ";" | ForEach-Object { $_.Trim() } | Where-Object {
  $_ -and $_ -notmatch "^\s*--" -and $_ -notmatch "^SET "
}

Write-Host "Restoring demo database on $EnvId ..." -ForegroundColor Cyan
foreach ($s in $stmts) {
  $one = $s + ";"
  $preview = $one.Substring(0, [Math]::Min(72, $one.Length)).Replace("`n", " ")
  Write-Host ">> $preview" -ForegroundColor DarkGray
  & "$PSScriptRoot\run-one-sql.ps1" -Sql $one -EnvId $EnvId | Out-Host
}

Write-Host "`nVerify customers:" -ForegroundColor Cyan
& "$PSScriptRoot\run-one-sql.ps1" -Sql "SELECT id, customer_name, resident_status, bed_id FROM customer ORDER BY id" -EnvId $EnvId | Out-Host

Write-Host "Done." -ForegroundColor Green
