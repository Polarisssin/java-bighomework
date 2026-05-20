param(
    [switch]$DataOnly,
    [switch]$SchemaOnly
)

$EnvId = if ($env:TCB_ENV_ID) { $env:TCB_ENV_ID } else { "health-app-env-3g73ck72bcb11c66" }
$Root = Split-Path -Parent $PSScriptRoot

function Invoke-TcbSqlText([string]$sql) {
    $tmp = Join-Path $env:TEMP ("tcb-sql-" + [guid]::NewGuid().ToString("N") + ".sql")
    try {
        [System.IO.File]::WriteAllText($tmp, $sql.Trim(), [System.Text.UTF8Encoding]::new($false))
        $q = ((Get-Content -LiteralPath $tmp -Raw -Encoding UTF8).Trim() -replace "[\r\n]+", " ")
        # Pass SQL via argument array so PowerShell does not interpret backticks in `user`.
        $out = & npx @(
            '-p', '@cloudbase/cli',
            'cloudbase', 'db', 'execute',
            '-e', $EnvId,
            '-s', $q,
            '--json'
        ) 2>&1 | Out-String
        if ($out -match '"error"') {
            Write-Host $out.Substring(0, [Math]::Min(800, $out.Length))
            return $false
        }
        if ($out -notmatch '"rowsAffected"' -and $out -notmatch '"items"') {
            Write-Host $out.Substring(0, [Math]::Min(800, $out.Length))
            return $false
        }
        return $true
    }
    finally {
        Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue
    }
}

function Invoke-TcbSqlFile([string]$FilePath) {
    $raw = [System.IO.File]::ReadAllText($FilePath, [System.Text.Encoding]::UTF8)
    $stmts = $raw -split ";\s*`r?`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -and $_ -notmatch '^--' -and $_ -notmatch '^SET\s' }
    Write-Host "File $([System.IO.Path]::GetFileName($FilePath)): $($stmts.Count) statements"
    $i = 0
    foreach ($s in $stmts) {
        $i++
        $sql = $s + ";"
        $short = if ($sql.Length -gt 48) { $sql.Substring(0, 48) + "..." } else { $sql }
        Write-Host "  [$i] $short"
        if (-not (Invoke-TcbSqlText $sql)) { throw "Failed: $short" }
    }
}

if (-not $DataOnly) {
    Invoke-TcbSqlFile (Join-Path $Root "sql\cloud-init-schema.sql")
}
if (-not $SchemaOnly) {
    Invoke-TcbSqlFile (Join-Path $Root "sql\cloud-init-data.sql")
}
Write-Host "All done."
