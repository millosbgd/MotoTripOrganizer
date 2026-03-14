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

# Step 2: Deploy frontend via GitHub (Vercel picks up push to main automatically)
Write-Host "🌐 Deploying frontend via GitHub → Vercel..." -ForegroundColor Yellow
Push-Location $frontendPath
try {
    # Check if there are any changes to commit
    $gitStatus = git status --porcelain 2>&1
    if ($gitStatus) {
        Write-Host "📝 Uncommitted changes detected, committing..." -ForegroundColor Yellow
        git add -A
        git commit -m "deploy: frontend update $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
        if ($LASTEXITCODE -ne 0) {
            throw "Git commit failed!"
        }
        Write-Host "✅ Changes committed" -ForegroundColor Green
    } else {
        Write-Host "ℹ️  No uncommitted frontend changes" -ForegroundColor Cyan
    }
}
catch {
    Write-Host "❌ Git commit failed: $_" -ForegroundColor Red
    Pop-Location
    exit 1
}
finally {
    Pop-Location
}

Write-Host "📤 Pushing to GitHub (Vercel will deploy automatically)..." -ForegroundColor Yellow
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Git push failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Pushed to GitHub — Vercel deployment triggered" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 Full deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Backend:  https://$apiAppName.azurewebsites.net" -ForegroundColor Cyan
Write-Host "🔗 Frontend: https://mototriporganizer-web.vercel.app" -ForegroundColor Cyan
Write-Host ""
