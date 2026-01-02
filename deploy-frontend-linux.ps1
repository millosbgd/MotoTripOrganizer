# Deploy Next.js standalone to Linux App Service
Write-Host "Building Next.js app..." -ForegroundColor Cyan
Set-Location mototriporganizer-web
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Creating deployment package..." -ForegroundColor Cyan

# Create deployment directory
$deployDir = "..\deploy-linux"
if (Test-Path $deployDir) {
    Remove-Item $deployDir -Recurse -Force
}
New-Item -ItemType Directory -Path $deployDir | Out-Null

# Copy standalone server
Copy-Item -Path ".next\standalone\*" -Destination $deployDir -Recurse

# Copy static files
New-Item -ItemType Directory -Path "$deployDir\.next\static" -Force | Out-Null
Copy-Item -Path ".next\static\*" -Destination "$deployDir\.next\static" -Recurse

# Copy public files if exist
if (Test-Path "public") {
    Copy-Item -Path "public" -Destination $deployDir -Recurse
}

Write-Host "Zipping deployment..." -ForegroundColor Cyan
$zipPath = "..\deploy-linux.zip"
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

Compress-Archive -Path "$deployDir\*" -DestinationPath $zipPath -Force

Write-Host "Deploying to Azure..." -ForegroundColor Cyan
Set-Location ..

az webapp deploy `
    --resource-group rg-mototriporganizer-dev `
    --name mototriporg-frontend `
    --src-path deploy-linux.zip `
    --type zip `
    --restart true

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "URL: https://mototriporg-frontend.azurewebsites.net" -ForegroundColor Green
