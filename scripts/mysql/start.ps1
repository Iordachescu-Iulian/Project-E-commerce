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

if ($Port -eq 3306) {
    throw 'Port 3306 is reserved for the existing MySQL service. Refusing to start or modify it; use 3307 (default) or another non-3306 port.'
}

$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$MyIni = Join-Path $PSScriptRoot 'my.ini'
$DataDir = Join-Path $RepoRoot '.mysql-data'
$PidFile = Join-Path $DataDir 'mysqld.pid'
$LogFile = Join-Path $DataDir 'mysqld.log'

# MySQL 8.0.36 on Windows is unreliable when the undo tablespace path contains
# spaces. The repository path does contain spaces, so keep only the undo
# tablespaces in a directory whose path has no spaces (default:
# <repo drive root>\hexora-mysql-undo, override with HEXORA_MYSQL_UNDO_DIR).
# The main data directory remains .mysql-data inside the repository.
$UndoDir = $env:HEXORA_MYSQL_UNDO_DIR

if (-not $UndoDir) {
    $candidates = @(
        (Join-Path ([System.IO.Path]::GetPathRoot($RepoRoot)) 'hexora-mysql-undo')
    )

    if ($env:LOCALAPPDATA) {
        $candidates += (Join-Path $env:LOCALAPPDATA 'hexora\mysql-undo')
    }

    foreach ($candidate in $candidates) {
        if ($candidate -match '\s') {
            continue
        }

        try {
            New-Item -ItemType Directory -Force -Path $candidate -ErrorAction Stop | Out-Null
            $UndoDir = $candidate
            break
        }
        catch {
            continue
        }
    }
}

if (-not $UndoDir -or $UndoDir -match '\s') {
    throw "The MySQL undo directory cannot contain spaces on this MySQL build. Set HEXORA_MYSQL_UNDO_DIR to a path without spaces."
}

New-Item -ItemType Directory -Force -Path $UndoDir | Out-Null

$Database = 'hexora'
$DbUser = 'hexora'
$DbPassword = 'hexora_dev_password'

$mysqlHome = $env:MYSQL_HOME

if (-not $mysqlHome) {
    $mysqlHome = 'C:\Program Files\MySQL\MySQL Server 8.0'
}

$mysqld = Join-Path $mysqlHome 'bin\mysqld.exe'
$mysql = Join-Path $mysqlHome 'bin\mysql.exe'
$mysqladmin = Join-Path $mysqlHome 'bin\mysqladmin.exe'

if (-not (Test-Path $mysqld)) {
    $command = Get-Command mysqld.exe -ErrorAction SilentlyContinue

    if ($command) {
        $mysqlHome = Split-Path -Parent (Split-Path -Parent $command.Source)
        $mysqld = Join-Path $mysqlHome 'bin\mysqld.exe'
        $mysql = Join-Path $mysqlHome 'bin\mysql.exe'
        $mysqladmin = Join-Path $mysqlHome 'bin\mysqladmin.exe'
    }
}

foreach ($executable in @($mysqld, $mysql, $mysqladmin)) {
    if (-not (Test-Path $executable)) {
        throw "MySQL executable not found: $executable. Install MySQL 8.0 or set MYSQL_HOME."
    }
}

if (-not (Test-Path $MyIni)) {
    throw "MySQL configuration not found: $MyIni"
}

function Test-MySqlReady {
    & $mysqladmin --protocol=tcp -h 127.0.0.1 -P $Port -u root ping --silent 2>$null | Out-Null
    return ($LASTEXITCODE -eq 0)
}

$initialized = Test-Path (Join-Path $DataDir 'mysql')
$hasUndo = (Test-Path (Join-Path $UndoDir 'undo_001')) -and (Test-Path (Join-Path $UndoDir 'undo_002'))

if ($initialized -and -not $hasUndo) {
    throw "The database in $DataDir exists but its undo tablespaces are missing from $UndoDir. Remove .mysql-data and run npm run db:start to reinitialize the local database."
}

if (-not (Test-MySqlReady)) {
    if (-not $initialized) {
        if (Test-Path $DataDir) {
            $existing = Get-ChildItem -Force $DataDir

            if ($existing) {
                throw "Data directory $DataDir exists but is not an initialized MySQL instance. Remove it and run npm run db:start again."
            }
        }
        else {
            New-Item -ItemType Directory -Path $DataDir | Out-Null
        }

        if (Test-Path $UndoDir) {
            $staleUndo = Get-ChildItem -Force -Path $UndoDir

            if ($staleUndo) {
                Write-Host "Clearing stale undo tablespaces from $UndoDir ..."
                $staleUndo | Remove-Item -Recurse -Force
            }
        }

        Write-Host "Initializing project-local MySQL data directory at $DataDir ..."
        Write-Host "Undo tablespaces: $UndoDir"
        & $mysqld "--defaults-file=$MyIni" '--initialize-insecure' "--datadir=$DataDir" "--innodb-undo-directory=$UndoDir" '--console'

        if ($LASTEXITCODE -ne 0) {
            throw "MySQL initialization failed with exit code $LASTEXITCODE."
        }
    }

    Write-Host "Starting MySQL on 127.0.0.1:$Port ..."

    $arguments = @(
        "--defaults-file=`"$MyIni`"",
        "--datadir=`"$DataDir`"",
        "--innodb-undo-directory=`"$UndoDir`"",
        "--port=$Port",
        "--pid-file=`"$PidFile`"",
        "--log-error=`"$LogFile`""
    ) -join ' '

    $process = Start-Process -FilePath $mysqld -ArgumentList $arguments -WorkingDirectory $DataDir -WindowStyle Hidden -PassThru
    $deadline = (Get-Date).AddSeconds(60)

    while ((Get-Date) -lt $deadline) {
        Start-Sleep -Milliseconds 500

        if (Test-MySqlReady) {
            break
        }

        if ($process.HasExited) {
            throw "mysqld exited with code $($process.ExitCode). See $LogFile."
        }
    }

    if (-not (Test-MySqlReady)) {
        throw "MySQL did not become ready within 60 seconds. See $LogFile."
    }
}

$sql = @(
    "CREATE DATABASE IF NOT EXISTS $Database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;",
    "CREATE USER IF NOT EXISTS '$DbUser'@'127.0.0.1' IDENTIFIED BY '$DbPassword';",
    "CREATE USER IF NOT EXISTS '$DbUser'@'localhost' IDENTIFIED BY '$DbPassword';",
    "ALTER USER '$DbUser'@'127.0.0.1' IDENTIFIED BY '$DbPassword';",
    "ALTER USER '$DbUser'@'localhost' IDENTIFIED BY '$DbPassword';",
    "GRANT ALL PRIVILEGES ON $Database.* TO '$DbUser'@'127.0.0.1';",
    "GRANT ALL PRIVILEGES ON $Database.* TO '$DbUser'@'localhost';",
    'FLUSH PRIVILEGES;'
) -join ' '

& $mysql --protocol=tcp -h 127.0.0.1 -P $Port -u root -e $sql

if ($LASTEXITCODE -ne 0) {
    throw 'Failed to create the hexora database or user.'
}

Write-Host "MySQL is ready at 127.0.0.1:$Port (database=$Database, user=$DbUser)."
