# Quick Deploy - koristi postojeći SQL Server
# Usage: .\deploy-existing-sql.ps1

$ErrorActionPreference = "Stop"

Write-Host "🚀 Deploying Moto Trip Organizer (existing SQL)" -ForegroundColor Cyan

# Variables
$subscriptionId = "2660f749-55ec-4cfe-990e-399f3ae12241"
$resourceGroup = "rg-mototriporganizer-dev"  # ✅ Koristi postojeći resource group
$location = "uksouth"
$environment = "dev"
$deploymentName = "mototriporg-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

# Set subscription
Write-Host "📌 Setting subscription..." -ForegroundColor Yellow
az account set --subscription $subscriptionId

# Resource group već postoji - preskačemo kreiranje
Write-Host "📦 Using existing resource group: $resourceGroup" -ForegroundColor Green

# Get Azure AD Object ID
$objectId = az ad signed-in-user show --query id -o tsv
Write-Host "👤 Your Object ID: $objectId" -ForegroundColor Yellow

# Prompt for credentials
Write-Host ""
$sqlAdmin = Read-Host "🔑 SQL Admin username (default: sqladmin)" 
if ([string]::IsNullOrWhiteSpace($sqlAdmin)) { $sqlAdmin = "sqladmin" }

$sqlPasswordSecure = Read-Host "🔒 SQL Admin password" -AsSecureString
$sqlPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sqlPasswordSecure)
)

Write-Host ""
$auth0Domain = Read-Host "🔐 Auth0 Domain (e.g. your-tenant.auth0.com)"
$auth0Audience = Read-Host "🎯 Auth0 Audience (e.g. https://api.mototriporganizer.com)"

# Deploy infrastructure
Write-Host ""
Write-Host "🏗️  Deploying infrastructure..." -ForegroundColor Green
az deployment group create `
    --name $deploymentName `
    --resource-group $resourceGroup `
    --template-file main-existing-sql.bicep `
    --parameters environment=$environment `
    --parameters baseName=mototriporg `
    --parameters existingSqlServerName=motomanager `
    --parameters existingSqlServerResourceGroup=rg-shared-dev `
    --parameters sqlDatabaseName=MotoTripOrganizer `
    --parameters sqlAdminLogin=$sqlAdmin `
    --parameters sqlAdminPassword=$sqlPassword `
    --parameters auth0Domain=$auth0Domain `
    --parameters auth0Audience=$auth0Audience `
    --parameters keyVaultAdminObjectId=$objectId `
    --verbose

# Get outputs
Write-Host ""
Write-Host "📋 Getting outputs..." -ForegroundColor Green
$outputs = az deployment group show `
    --name $deploymentName `
    --resource-group $resourceGroup `
    --query properties.outputs -o json | ConvertFrom-Json

$webAppName = $outputs.webAppName.value
$webAppUrl = $outputs.webAppUrl.value
$sqlServer = $outputs.sqlServerFqdn.value
$storageAccount = $outputs.storageAccountName.value
$keyVault = $outputs.keyVaultName.value

Write-Host ""
Write-Host "✅ Deployment successful!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📦 Resource Group:    $resourceGroup" -ForegroundColor White
Write-Host "🌐 Web App:           $webAppName" -ForegroundColor White
Write-Host "🔗 URL:               $webAppUrl" -ForegroundColor White
Write-Host "🗄️  SQL Server:        $sqlServer" -ForegroundColor White
Write-Host "💾 Storage Account:   $storageAccount" -ForegroundColor White
Write-Host "🔐 Key Vault:         $keyVault" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

Write-Host ""
Write-Host "🔧 Next steps:" -ForegroundColor Yellow
Write-Host "1. Deploy aplikacije (dotnet publish + az webapp deploy)" -ForegroundColor White
Write-Host "2. Run migrations (dotnet ef database update)" -ForegroundColor White
Write-Host ""
Write-Host "💾 Connection string saved to Key Vault: $keyVault" -ForegroundColor Green

# Save outputs
$outputFile = "deployment-outputs.json"
$outputs | ConvertTo-Json | Out-File $outputFile
Write-Host "📄 Outputs saved to: $outputFile" -ForegroundColor Green
