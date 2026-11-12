param(
    [int]$Port = 0
)

$ErrorActionPreference = 'Stop'

if ($Port -le 0) {
    if ($env:DB_PORT) {
        $Port = [int]$env:DB_PORT
    }
    else {
        $Port = 3307
    }
}

if ($Port -lt 1 -or $Port -gt 65535) {
    throw "Invalid MySQL port $Port. Use a port between 1 and 65535."
}

if ($Port -eq 3306) {
    throw 'Port 3306 is reserved for the existing MySQL service. Refusing to stop it; use 3307 (default) or another non-3306 port.'
}

$mysqlHome = $env:MYSQL_HOME

if (-not $mysqlHome) {
    $mysqlHome = 'C:\Program Files\MySQL\MySQL Server 8.0'
}

$mysqladmin = Join-Path $mysqlHome 'bin\mysqladmin.exe'

if (-not (Test-Path $mysqladmin)) {
    $command = Get-Command mysqladmin.exe -ErrorAction SilentlyContinue

    if ($command) {
        $mysqladmin = $command.Source
    }
}

if (-not (Test-Path $mysqladmin)) {
    throw "mysqladmin.exe not found. Install MySQL 8.0 or set MYSQL_HOME."
}

function Test-MySqlReady {
    & $mysqladmin --protocol=tcp -h 127.0.0.1 -P $Port -u root ping --silent 2>$null | Out-Null
    return ($LASTEXITCODE -eq 0)
}

if (-not (Test-MySqlReady)) {
    Write-Host "MySQL is not running on 127.0.0.1:$Port."
    exit 0
}

Write-Host "Stopping MySQL on 127.0.0.1:$Port ..."
& $mysqladmin --protocol=tcp -h 127.0.0.1 -P $Port -u root shutdown

if ($LASTEXITCODE -ne 0) {
    throw "mysqladmin shutdown failed with exit code $LASTEXITCODE."
}

$deadline = (Get-Date).AddSeconds(30)

while ((Get-Date) -lt $deadline) {
    if (-not (Test-MySqlReady)) {
        break
    }

    Start-Sleep -Milliseconds 500
}

if (Test-MySqlReady) {
    throw "MySQL is still reachable on 127.0.0.1:$Port after shutdown. Check the process and stop it manually."
}

Write-Host 'MySQL stopped.'
