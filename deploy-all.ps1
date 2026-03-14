#!/usr/bin/env pwsh
# Deploy Frontend to Vercel
# Backend deploys automatically via GitHub Actions on push to main (src/**)
# Usage: .\deploy-all.ps1

$frontendPath = ".\mototriporganizer-web"

Write-Host "🌐 Deploying frontend to Vercel..." -ForegroundColor Cyan
Write-Host "ℹ️  Backend deploys automatically via GitHub Actions on git push" -ForegroundColor DarkGray
Write-Host ""

Push-Location $frontendPath
try {
    vercel --prod --yes
    if ($LASTEXITCODE -ne 0) {
        throw "Frontend deployment failed!"
    }
    Write-Host "✅ Frontend deployed" -ForegroundColor Green
}
catch {
    Write-Host "❌ Frontend deployment failed: $_" -ForegroundColor Red
    Pop-Location
    exit 1
}
finally {
    Pop-Location
}

Write-Host ""
Write-Host "🎉 Frontend deployed successfully!" -ForegroundColor Green
Write-Host "🔗 https://mototriporganizer-web.vercel.app" -ForegroundColor Cyan
Write-Host ""
