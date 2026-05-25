# 删除云库中「自测A/B/C」等接口测试产生的临时老人
# 用法: .\scripts\cleanup-selftest-customers.ps1

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)
$EnvId = if ($env:TCB_ENV_ID) { $env:TCB_ENV_ID } else { "health-app-env-3g73ck72bcb11c66" }

$sql = Get-Content -LiteralPath "sql\cleanup-selftest-customers.sql" -Raw -Encoding UTF8
$stmts = $sql -split ";" | ForEach-Object { $_.Trim() } | Where-Object { $_ -and $_ -notmatch "^\s*--" -and $_ -notmatch "^SET " }

Write-Host "Cleaning self-test customers on env $EnvId ..." -ForegroundColor Cyan
foreach ($s in $stmts) {
  $one = $s + ";"
  Write-Host ">> $($one.Substring(0, [Math]::Min(60, $one.Length)))" -ForegroundColor DarkGray
  & "$PSScriptRoot\run-one-sql.ps1" -Sql $one -EnvId $EnvId
}
Write-Host "Done. Refresh check-in list; expect 6 seed elders (if none archived)." -ForegroundColor Green
