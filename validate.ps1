# Kontext Build Validation Script
# This script validates both client and server builds

Write-Host "Kontext Build Validation Script`n" -ForegroundColor Cyan

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$clientPath = Join-Path $scriptPath "client"
$serverPath = Join-Path $scriptPath "server"

$allPassed = $true

# 1. CLIENT BUILD VALIDATION
Write-Host "=================================" -ForegroundColor Gray
Write-Host "[1] CLIENT BUILD VALIDATION" -ForegroundColor Yellow

try {
    Write-Host "   Building client..." -ForegroundColor Gray
    Push-Location $clientPath
    
    $buildOutput = npm run build 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [OK] Client build successful" -ForegroundColor Green
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

# 2. SERVER TYPESCRIPT CHECK
Write-Host "`n=================================" -ForegroundColor Gray
Write-Host "[2] SERVER TYPESCRIPT CHECK" -ForegroundColor Yellow

try {
    Write-Host "   Checking server types..." -ForegroundColor Gray
    Push-Location $serverPath
    
    $tsOutput = npx tsc --noEmit 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [OK] Server TypeScript passed (no errors)" -ForegroundColor Green
    } else {
        Write-Host "   [FAILED] Server has TypeScript errors" -ForegroundColor Red
        $tsOutput | Select-String -Pattern "error TS" | ForEach-Object { Write-Host "      $_" -ForegroundColor Red }
        $allPassed = $false
    }
} catch {
    Write-Host "   [WARN] Could not run TypeScript check: $_" -ForegroundColor Yellow
} finally {
    Pop-Location
}

# 3. CLIENT TYPESCRIPT CHECK
Write-Host "`n=================================" -ForegroundColor Gray
Write-Host "[3] CLIENT TYPESCRIPT CHECK" -ForegroundColor Yellow

try {
    Write-Host "   Checking client types..." -ForegroundColor Gray
    Push-Location $clientPath
    
    $tsOutput = npx tsc --noEmit 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [OK] Client TypeScript passed (no errors)" -ForegroundColor Green
    } else {
        Write-Host "   [FAILED] Client has TypeScript errors" -ForegroundColor Red
        $tsOutput | Select-String -Pattern "error TS" | ForEach-Object { Write-Host "      $_" -ForegroundColor Red }
        $allPassed = $false
    }
} catch {
    Write-Host "   [WARN] Could not run TypeScript check: $_" -ForegroundColor Yellow
} finally {
    Pop-Location
}

# 4. API ROUTE CONSISTENCY
Write-Host "`n=================================" -ForegroundColor Gray
Write-Host "[4] API ROUTE CONSISTENCY" -ForegroundColor Yellow

Write-Host "   Checking server routes..." -ForegroundColor Gray

Push-Location $serverPath

try {
    $decisionRoutes = Get-Content "src\routes\decisionRoutes.ts" -Raw -ErrorAction Stop
    $failureRoutes = Get-Content "src\routes\failureRoutes.ts" -Raw -ErrorAction Stop
    
    $checksGood = @(
        ("getDecisions.*router.get", "GET /decisions"),
        ("createDecision.*router.post", "POST /decisions"),
        ("deleteDecision.*router.delete", "DELETE /decisions"),
        ("getFailures.*router.get", "GET /failures"),
        ("createFailure.*router.post", "POST /failures"),
        ("deleteFailure.*router.delete", "DELETE /failures")
    )
    
    $allRoutesFound = $true
    foreach ($pattern, $name in $checksGood) {
        $found = $false
        if ($pattern -like "*Decisions*" -and $decisionRoutes -match $pattern) {
            $found = $true
        } elseif ($pattern -like "*Failures*" -and $failureRoutes -match $pattern) {
            $found = $true
        }
        
        if ($found) {
            Write-Host "   [OK] $name endpoint exists" -ForegroundColor Green
        } else {
            Write-Host "   [MISSING] $name endpoint" -ForegroundColor Red
            $allRoutesFound = $false
            $allPassed = $false
        }
    }
    
} catch {
    Write-Host "   [WARN] Could not verify routes: $_" -ForegroundColor Yellow
} finally {
    Pop-Location
}

# FINAL RESULT
Write-Host "`n=================================" -ForegroundColor Gray

if ($allPassed) {
    Write-Host "`n[PASS] All validations passed!`n" -ForegroundColor Green
    Write-Host "Build is ready for deployment." -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n[FAIL] Some validations failed`n" -ForegroundColor Red
    exit 1
}
