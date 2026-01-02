# Deploy Next.js app to Azure
$ErrorActionPreference = "Stop"

Write-Host "Preparing deployment..." -ForegroundColor Cyan

# Navigate to web folder
Set-Location "C:\Users\MilosNovakovic\YandexDisk\Posao\Cycle\Private\MotoTripOrganizer\mototriporganizer-web"

# Copy static assets to standalone
Write-Host "Copying static assets..." -ForegroundColor Yellow
Copy-Item -Recurse -Force ".next\static" ".next\standalone\.next\" -ErrorAction SilentlyContinue
Copy-Item -Recurse -Force "public" ".next\standalone\" -ErrorAction SilentlyContinue

# Create deployment zip from standalone folder
Write-Host "Creating deployment package..." -ForegroundColor Yellow
Set-Location ".next\standalone"
Remove-Item "..\..\..\web-deploy.zip" -Force -ErrorAction SilentlyContinue
Compress-Archive -Path * -DestinationPath "..\..\..\web-deploy.zip" -Force

# Deploy to Azure
Write-Host "Deploying to Azure..." -ForegroundColor Green
Set-Location "..\..\..\"
az webapp deployment source config-zip --resource-group rg-mototriporganizer-dev --name mototriporg-dev-web --src web-deploy.zip

Write-Host "`nDeployment complete! 🚀" -ForegroundColor Green
Write-Host "URL: https://mototriporg-dev-web.azurewebsites.net" -ForegroundColor Cyan
