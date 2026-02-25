#!/usr/bin/env pwsh
# Deploy All - Backend + Frontend deployment script
# Usage: .\deploy-all.ps1

Write-Host "🚀 Starting full deployment..." -ForegroundColor Cyan
# Updated: 2026-02-25 - Testing GitHub Actions integration
Write-Host ""

# Configuration
$resourceGroup = "rg-mototriporganizer-dev"
$apiAppName = "mototriporg-dev-api"
$backendPath = ".\src\MotoTripOrganizer.Api"
$frontendPath = ".\mototriporganizer-web"

# Step 1: Build and deploy backend
Write-Host "📦 Building backend..." -ForegroundColor Yellow
Push-Location $backendPath
try {
    dotnet publish -c Release -o .\publish --no-restore
    if ($LASTEXITCODE -ne 0) {
        throw "Backend build failed!"
    }
    Write-Host "✅ Backend build successful" -ForegroundColor Green

    Write-Host "📤 Creating deployment package..." -ForegroundColor Yellow
    Compress-Archive -Path .\publish\* -DestinationPath .\deploy.zip -Force
    Write-Host "✅ Package created" -ForegroundColor Green

    Write-Host "🚢 Deploying backend to Azure..." -ForegroundColor Yellow
    az webapp deploy --resource-group $resourceGroup --name $apiAppName --src-path .\deploy.zip --type zip --async false
    if ($LASTEXITCODE -ne 0) {
        throw "Backend deployment failed!"
    }
    Write-Host "✅ Backend deployed" -ForegroundColor Green

    Write-Host "🔄 Restarting backend..." -ForegroundColor Yellow
    az webapp restart --name $apiAppName --resource-group $resourceGroup
    Write-Host "✅ Backend restarted" -ForegroundColor Green
}
catch {
    Write-Host "❌ Backend deployment failed: $_" -ForegroundColor Red
    Pop-Location
    exit 1
}
finally {
    Pop-Location
}

Write-Host ""

# Step 2: Deploy frontend
Write-Host "🌐 Deploying frontend to Vercel..." -ForegroundColor Yellow
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
Write-Host "🎉 Full deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Backend:  https://$apiAppName.azurewebsites.net" -ForegroundColor Cyan
Write-Host "🔗 Frontend: https://mototriporganizer-web.vercel.app" -ForegroundColor Cyan
Write-Host ""
