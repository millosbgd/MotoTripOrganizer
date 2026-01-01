#!/bin/bash
# Deploy Azure infrastructure using Bicep
# Usage: ./deploy.sh <environment> <subscription-id>

set -e

ENVIRONMENT=${1:-dev}
SUBSCRIPTION_ID=$2

if [ -z "$SUBSCRIPTION_ID" ]; then
    echo "Error: Subscription ID is required"
    echo "Usage: ./deploy.sh <environment> <subscription-id>"
    exit 1
fi

echo "🚀 Deploying Moto Trip Organizer infrastructure..."
echo "Environment: $ENVIRONMENT"
echo "Subscription: $SUBSCRIPTION_ID"

# Set subscription
az account set --subscription "$SUBSCRIPTION_ID"

# Variables
RESOURCE_GROUP="mototriporg-${ENVIRONMENT}-rg"
LOCATION="westeurope"
DEPLOYMENT_NAME="mototriporg-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S)"

# Create resource group if it doesn't exist
echo "📦 Creating resource group: $RESOURCE_GROUP"
az group create \
  --name "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --tags Environment="$ENVIRONMENT" Application="MotoTripOrganizer"

# Get your Azure AD Object ID (for Key Vault access)
OBJECT_ID=$(az ad signed-in-user show --query id -o tsv)
echo "👤 Your Object ID: $OBJECT_ID"

# Prompt for SQL Admin Password
echo "🔒 Enter SQL Admin Password (will be stored in Key Vault):"
read -s SQL_ADMIN_PASSWORD

# Deploy infrastructure
echo "🏗️  Deploying infrastructure..."
az deployment group create \
  --name "$DEPLOYMENT_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --template-file main.bicep \
  --parameters main.parameters.${ENVIRONMENT}.json \
  --parameters sqlAdminPassword="$SQL_ADMIN_PASSWORD" \
  --parameters keyVaultAdminObjectId="$OBJECT_ID" \
  --verbose

# Get deployment outputs
echo "📋 Deployment completed! Getting outputs..."
WEB_APP_NAME=$(az deployment group show \
  --name "$DEPLOYMENT_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query properties.outputs.webAppName.value -o tsv)

WEB_APP_URL=$(az deployment group show \
  --name "$DEPLOYMENT_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query properties.outputs.webAppUrl.value -o tsv)

SQL_SERVER=$(az deployment group show \
  --name "$DEPLOYMENT_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query properties.outputs.sqlServerFqdn.value -o tsv)

STORAGE_ACCOUNT=$(az deployment group show \
  --name "$DEPLOYMENT_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query properties.outputs.storageAccountName.value -o tsv)

KEY_VAULT=$(az deployment group show \
  --name "$DEPLOYMENT_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query properties.outputs.keyVaultName.value -o tsv)

echo ""
echo "✅ Deployment successful!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Resource Group:    $RESOURCE_GROUP"
echo "🌐 Web App:           $WEB_APP_NAME"
echo "🔗 URL:               $WEB_APP_URL"
echo "🗄️  SQL Server:        $SQL_SERVER"
echo "💾 Storage Account:   $STORAGE_ACCOUNT"
echo "🔐 Key Vault:         $KEY_VAULT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔧 Next steps:"
echo "1. Configure Auth0 (add redirect URLs)"
echo "2. Run database migrations:"
echo "   dotnet ef database update --connection \"Server=$SQL_SERVER;Database=MotoTripOrganizer;...\""
echo "3. Deploy application:"
echo "   az webapp deployment source config-zip --resource-group $RESOURCE_GROUP --name $WEB_APP_NAME --src app.zip"
echo ""
echo "🏥 Health check: $WEB_APP_URL/health"
echo "📚 Swagger UI:   $WEB_APP_URL/swagger"
