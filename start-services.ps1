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

if ($Clean) {
    Write-Host "Performing a clean build across all services..." -ForegroundColor Yellow
    Write-Host "This will run 'mvn clean' and then pause to let any IDE auto-compilers settle." -ForegroundColor Yellow
    foreach ($service in $services) {
        Write-Host "Cleaning $service..." -ForegroundColor DarkGray
        $null = Start-Process -FilePath "mvn.cmd" -ArgumentList "-q", "clean" -WorkingDirectory ".\services\$service" -NoNewWindow -Wait
    }
    Write-Host "Waiting 5 seconds for IDE background processes to settle..." -ForegroundColor Green
    Start-Sleep -Seconds 5
    Write-Host "Clean complete. Proceeding to startup (Maven will safely recompile with JDK 20).`n" -ForegroundColor Green
}

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
