# run-all-tests.ps1
$ErrorActionPreference = "Continue"

# Force JAVA_HOME to JDK 20 as configured in start-services.ps1
$env:JAVA_HOME = "C:\Program Files\Java\jdk-20"

# Clear JAVA_TOOL_OPTIONS to prevent restricted memory/malloc failures on compilation
Remove-Item env:JAVA_TOOL_OPTIONS -ErrorAction SilentlyContinue

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

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "     Running FlowBoard Service Tests     " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

$results = @{}

foreach ($service in $services) {
    Write-Host "`n>>> Testing $service..." -ForegroundColor Yellow
    
    # Run maven test in the subdirectory
    $startTime = Get-Date
    $process = Start-Process -FilePath "mvn.cmd" -ArgumentList "clean", "test" -WorkingDirectory "..\services\$service" -NoNewWindow -PassThru -Wait
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    
    if ($process.ExitCode -eq 0) {
        Write-Host "SUCCESS: $service tests passed in $duration seconds!" -ForegroundColor Green
        $results[$service] = @{ Status = "SUCCESS"; Duration = $duration }
    } else {
        Write-Host "FAILED: $service tests failed (Exit Code: $($process.ExitCode)) in $duration seconds!" -ForegroundColor Red
        $results[$service] = @{ Status = "FAILED"; Duration = $duration }
    }
}

Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host "             Test Summary                " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

$allPassed = $true
foreach ($service in $services) {
    $res = $results[$service]
    $status = $res.Status
    $dur = [Math]::Round($res.Duration, 1)
    if ($status -eq "SUCCESS") {
        Write-Host "  [PASS] $service ($dur s)" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] $service ($dur s)" -ForegroundColor Red
        $allPassed = $false
    }
}

Write-Host "=========================================" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "All tests completed successfully!" -ForegroundColor Green
} else {
    Write-Host "Some tests failed. Please review the output above." -ForegroundColor Red
}
