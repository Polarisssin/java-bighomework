param([string]$Sql, [string]$EnvId = "health-app-env-3g73ck72bcb11c66")
$tmp = Join-Path $env:TEMP ("tcb-sql-" + [guid]::NewGuid().ToString("N") + ".sql")
try {
    [System.IO.File]::WriteAllText($tmp, $Sql.Trim(), [System.Text.UTF8Encoding]::new($false))
    $q = (Get-Content -LiteralPath $tmp -Raw -Encoding UTF8).Trim()
    & npx @('-p', '@cloudbase/cli', 'cloudbase', 'db', 'execute', '-e', $EnvId, '-s', $q, '--json') 2>&1
}
finally {
    Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue
}
