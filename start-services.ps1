# start-services.ps1
[CmdletBinding()]
param (
    [switch]$Clean
)

$ErrorActionPreference = "Stop"

# Force JAVA_HOME to JDK 20 to bypass Lombok compilation issues on JDK 25
$env:JAVA_HOME = "C:\Program Files\Java\jdk-20"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   Starting FlowBoard Microservices      " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "All services will run in this single terminal." -ForegroundColor Magenta
Write-Host "Press Ctrl+C at any time to stop all services." -ForegroundColor Magenta
Write-Host "=========================================`n" -ForegroundColor Cyan

# Clear all logs before starting
if (Test-Path ".\logs") {
    Write-Host "Clearing existing logs..." -ForegroundColor Yellow
    Remove-Item -Path ".\logs\*" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Logs cleared.`n" -ForegroundColor Green
}

# Force kill any existing processes on project ports to free up space
Write-Host "Cleaning up lingering processes on project ports..." -ForegroundColor Yellow
$ports = @(8761, 8080, 8081, 8082, 8083, 8084, 8085, 8086, 8087, 8088)
foreach ($port in $ports) {
    $pids = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($procId in $pids) {
        if ($procId -and $procId -ne $PID) {
            $pName = (Get-Process -Id $procId -ErrorAction SilentlyContinue).ProcessName
            Write-Host "Port $port is in use by $pName (PID $procId). Killing it..." -ForegroundColor Yellow
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
        }
    }
}
# Also kill any remaining java processes
Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "Cleanup complete.`n" -ForegroundColor Green



$services = @(
    "eureka-server",
    "api-gateway",
    "auth-service",
    "workspace-service",
    "board-service",
    "column-service",
    "card-service",
    "checklist-service",
    "comment-service",
    "notification-service"
)

# Perform a build across all services if -Clean is specified, or if they haven't been built yet
Write-Host "Checking service builds..." -ForegroundColor Yellow
foreach ($service in $services) {
    $targetDir = ".\services\$service\target-maven"
    if ($Clean -or -not (Test-Path $targetDir)) {
        Write-Host "Building $service..." -ForegroundColor DarkGray
        $null = Start-Process -FilePath "mvn.cmd" -ArgumentList "-q", "clean", "install", "-DskipTests" -WorkingDirectory ".\services\$service" -NoNewWindow -Wait
    } else {
        Write-Host "Service $service is already built. Skipping build. (Use -Clean to rebuild)" -ForegroundColor DarkGray
    }
}
Write-Host "Build complete. Proceeding to startup...`n" -ForegroundColor Green

$global:processes = @()

# Cleanup block to kill all spawned processes
function Stop-AllServices {
    Write-Host "`nStopping all services..." -ForegroundColor Red
    foreach ($p in $global:processes) {
        if ($p -and -not $p.HasExited) {
            Write-Host "Killing process ID $($p.Id)..." -ForegroundColor Yellow
            # taskkill /T kills the process tree (including java.exe spawned by mvn.cmd)
            $null = taskkill /T /F /PID $p.Id 2>&1
        }
    }
    Write-Host "All services stopped." -ForegroundColor Green
    exit
}

try {
    # 1. Start Eureka Server (Service Registry)
    Write-Host "[1/10] Starting Eureka Server (Registry)..." -ForegroundColor Yellow
    $p = Start-Process -FilePath "mvn.cmd" -ArgumentList "-q", "spring-boot:run" -WorkingDirectory ".\services\eureka-server" -NoNewWindow -PassThru
    $global:processes += $p
    
    Write-Host "Waiting 25 seconds for Eureka Server to fully initialize..." -ForegroundColor Green
    Start-Sleep -Seconds 25
    
    # 2. Start API Gateway
    Write-Host "[2/10] Starting API Gateway..." -ForegroundColor Yellow
    $p = Start-Process -FilePath "mvn.cmd" -ArgumentList "-q", "spring-boot:run" -WorkingDirectory ".\services\api-gateway" -NoNewWindow -PassThru
    $global:processes += $p
    
    Write-Host "Waiting 15 seconds for API Gateway to initialize..." -ForegroundColor Green
    Start-Sleep -Seconds 15
    
    # 3. Start Auth Service
    Write-Host "[3/10] Starting Auth Service..." -ForegroundColor Yellow
    $p = Start-Process -FilePath "mvn.cmd" -ArgumentList "-q", "spring-boot:run" -WorkingDirectory ".\services\auth-service" -NoNewWindow -PassThru
    $global:processes += $p
    
    Write-Host "Waiting 15 seconds for Auth Service to initialize..." -ForegroundColor Green
    Start-Sleep -Seconds 15
    
    # 4. Start Domain Services
    $domainServices = @(
        "workspace-service",
        "board-service",
        "column-service",
        "card-service",
        "checklist-service",
        "comment-service",
        "notification-service"
    )
    
    $count = 4
    foreach ($service in $domainServices) {
        Write-Host "[$count/10] Starting $service..." -ForegroundColor Yellow
        $p = Start-Process -FilePath "mvn.cmd" -ArgumentList "-q", "spring-boot:run" -WorkingDirectory ".\services\$service" -NoNewWindow -PassThru
        $global:processes += $p
        
        if ($count -lt 10) {
            Write-Host "Waiting 10 seconds before starting the next service..." -ForegroundColor Green
            Start-Sleep -Seconds 10
        }
        $count++
    }
    
    Write-Host "`n=========================================" -ForegroundColor Cyan
    Write-Host "   All services have been launched!      " -ForegroundColor Cyan
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host "Logs are streaming above. Press Ctrl+C to terminate everything." -ForegroundColor Magenta
    
    # Keep the script running so that the finally block will catch Ctrl+C
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    Stop-AllServices
}
