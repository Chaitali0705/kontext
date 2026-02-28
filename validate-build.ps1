# Kontext Build Validation Script
# This script validates both client and server builds to catch errors early

Write-Host "🔍 Kontext Build Validation Script`n" -ForegroundColor Cyan

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$clientPath = Join-Path $scriptPath "client"
$serverPath = Join-Path $scriptPath "server"

$allPassed = $true

# ============================================
# 1. CLIENT BUILD VALIDATION
# ============================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "[1] CLIENT BUILD VALIDATION" -ForegroundColor Yellow

try {
    Write-Host "   Building client with TypeScript + Vite..." -ForegroundColor Gray
    Push-Location $clientPath
    
    $buildOutput = npm run build 2>&1
    $buildOutput = $buildOutput -join "`n"
    
    if ($LASTEXITCODE -eq 0 -and $buildOutput -match "built in") {
        Write-Host "   [OK] Client build successful" -ForegroundColor Green
        $builtMatch = $buildOutput | Select-String "built in (\d+\.?\d*\w+)"
        if ($builtMatch) {
            Write-Host "      $($builtMatch.Matches[0].Value)" -ForegroundColor Green
        }
    } else {
        Write-Host "   [FAILED] Client build failed" -ForegroundColor Red
        $buildOutput | Select-String -Pattern "error" | ForEach-Object { Write-Host "      $_" -ForegroundColor Red }
        $allPassed = $false
    }
} catch {
    Write-Host "   [ERROR] Error running client build: $_" -ForegroundColor Red
    $allPassed = $false
} finally {
    Pop-Location
}

# ============================================
# 2. SERVER TYPESCRIPT CHECK
# ============================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "[2] SERVER TYPESCRIPT CHECK" -ForegroundColor Yellow

try {
    Write-Host "   Checking server TypeScript types..." -ForegroundColor Gray
    Push-Location $serverPath
    
    $tsOutput = npx tsc --noEmit 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [OK] Server TypeScript check passed (no errors)" -ForegroundColor Green
    } else {
        Write-Host "   [FAILED] Server TypeScript errors found:" -ForegroundColor Red
        $tsOutput | Select-String -Pattern "error TS" | ForEach-Object { Write-Host "      $_" -ForegroundColor Red }
        $allPassed = $false
    }
} catch {
    Write-Host "   ⚠️  TypeScript check (warning): $_" -ForegroundColor Yellow
} finally {
    Pop-Location
}

# ============================================
# 3. CLIENT TYPESCRIPT CHECK
# ============================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "[3] CLIENT TYPESCRIPT CHECK" -ForegroundColor Yellow

try {
    Write-Host "   Checking client TypeScript types..." -ForegroundColor Gray
    Push-Location $clientPath
    
    $tsOutput = npx tsc --noEmit 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [OK] Client TypeScript check passed (no errors)" -ForegroundColor Green
    } else {
        Write-Host "   [FAILED] Client TypeScript errors found:" -ForegroundColor Red
        $tsOutput | Select-String -Pattern "error TS" | ForEach-Object { Write-Host "      $_" -ForegroundColor Red }
        $allPassed = $false
    }
} catch {
    Write-Host "   ⚠️  TypeScript check (warning): $_" -ForegroundColor Yellow
} finally {
    Pop-Location
}

# ============================================
# 4. API ENDPOINT CONSISTENCY CHECK
# ============================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "[4] API ENDPOINT CONSISTENCY CHECK" -ForegroundColor Yellow

Write-Host "   Checking client API calls..." -ForegroundColor Gray

$apiCallsExpected = @(
    "GET /decisions",
    "POST /decisions",
    "DELETE /decisions/:id",
    "GET /failures",
    "POST /failures",
    "DELETE /failures/:id",
    "GET /metrics",
    "GET /graph"
)

Push-Location $serverPath
$decisionRoutes = Get-Content "src\routes\decisionRoutes.ts" -Raw
$failureRoutes = Get-Content "src\routes\failureRoutes.ts" -Raw
$metricsRoutes = Get-Content "src\routes\metricsRoutes.ts" -Raw
$graphRoutes = Get-Content "src\routes\graphRoutes.ts" -Raw

$routesContent = $decisionRoutes + $failureRoutes + $metricsRoutes + $graphRoutes

$endpoints = @(
    ('router.get.*getDecisions', "GET /decisions"),
    ('router.post.*createDecision', "POST /decisions"),
    ('router.delete.*deleteDecision', "DELETE /decisions/:id"),
    ('router.get.*getFailures', "GET /failures"),
    ('router.post.*createFailure', "POST /failures"),
    ('router.delete.*deleteFailure', "DELETE /failures/:id"),
    ('metricsRoutes', "GET /metrics"),
    ('graphRoutes', "GET /graph")
)

$endpointsFound = 0
foreach ($endpoint, $name in $endpoints) {
    if ($routesContent -match $endpoint) {
        Write-Host "   [OK] $name" -ForegroundColor Green
        $endpointsFound++
    } else {
        Write-Host "   [FAILED] Missing: $name" -ForegroundColor Red
        $allPassed = $false
    }
}

Pop-Location

# ============================================
# FINAL RESULT
# ============================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

if ($allPassed) {
    Write-Host "`n[PASS] ALL VALIDATIONS PASSED!`n" -ForegroundColor Green
    Write-Host "Your build is ready to deploy." -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n[FAIL] SOME VALIDATIONS FAILED!`n" -ForegroundColor Red
    Write-Host "Please review the errors above and fix them before deploying." -ForegroundColor Red
    exit 1
}
