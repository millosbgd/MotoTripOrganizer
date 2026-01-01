# Deploy Azure infrastructure using Bicep (PowerShell)
# Usage: .\deploy.ps1 -Environment dev -SubscriptionId "your-subscription-id"

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('dev', 'staging', 'prod')]
    [string]$Environment,
    
    [Parameter(Mandatory=$true)]
    [string]$SubscriptionId,
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "westeurope"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Deploying Moto Trip Organizer infrastructure..." -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Subscription: $SubscriptionId" -ForegroundColor Yellow

# Set subscription
az account set --subscription $SubscriptionId

# Variables
$resourceGroup = "mototriporg-$Environment-rg"
$deploymentName = "mototriporg-$Environment-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

# Create resource group
Write-Host "📦 Creating resource group: $resourceGroup" -ForegroundColor Green
az group create `
    --name $resourceGroup `
    --location $Location `
    --tags Environment=$Environment Application=MotoTripOrganizer

# Get Azure AD Object ID
Write-Host "👤 Getting your Azure AD Object ID..." -ForegroundColor Green
$objectId = az ad signed-in-user show --query id -o tsv
Write-Host "Object ID: $objectId" -ForegroundColor Yellow

# Prompt for SQL Admin Password
$sqlAdminPasswordSecure = Read-Host "🔒 Enter SQL Admin Password" -AsSecureString
$sqlAdminPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sqlAdminPasswordSecure)
)

# Deploy infrastructure
Write-Host "🏗️  Deploying infrastructure (this may take 5-10 minutes)..." -ForegroundColor Green
az deployment group create `
    --name $deploymentName `
    --resource-group $resourceGroup `
    --template-file infrastructure/main.bicep `
    --parameters "infrastructure/main.parameters.$Environment.json" `
    --parameters sqlAdminPassword=$sqlAdminPassword `
    --parameters keyVaultAdminObjectId=$objectId `
    --verbose

# Get deployment outputs
Write-Host "📋 Getting deployment outputs..." -ForegroundColor Green
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
Write-Host "1. Configure Auth0 (add redirect URLs)" -ForegroundColor White
Write-Host "2. Run database migrations:" -ForegroundColor White
Write-Host "   cd src/MotoTripOrganizer.Api" -ForegroundColor Gray
Write-Host "   dotnet ef database update --project ../MotoTripOrganizer.Infrastructure" -ForegroundColor Gray
Write-Host "3. Deploy application:" -ForegroundColor White
Write-Host "   dotnet publish -c Release" -ForegroundColor Gray
Write-Host "   az webapp deployment source config-zip --resource-group $resourceGroup --name $webAppName --src app.zip" -ForegroundColor Gray

Write-Host ""
Write-Host "🏥 Health check: $webAppUrl/health" -ForegroundColor Cyan
Write-Host "📚 Swagger UI:   $webAppUrl/swagger" -ForegroundColor Cyan

# Save outputs to file
$outputFile = "deployment-outputs-$Environment.json"
$outputs | ConvertTo-Json | Out-File $outputFile
Write-Host ""
Write-Host "💾 Deployment outputs saved to: $outputFile" -ForegroundColor Green
