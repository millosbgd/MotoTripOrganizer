# Azure Deployment Guide - Moto Trip Organizer

Kompletna dokumentacija za deployment na Azure Cloud.

## 📋 Preduslovi

### Potrebni Alati
```bash
# Azure CLI
az --version  # Verzija 2.50.0+

# .NET 8 SDK
dotnet --version  # 8.0.x

# Entity Framework Core Tools
dotnet tool install --global dotnet-ef
```

### Azure Subscription
- Aktivna Azure pretplata
- Owner ili Contributor permisije na resource group

### Auth0 Account
- Tenant kreiran na Auth0
- API konfigurisan sa audience

## 🚀 Deployment Proces

### Korak 1: Priprema Parametara

**Edituj `infrastructure/main.parameters.dev.json`:**

```json
{
  "parameters": {
    "environment": { "value": "dev" },
    "location": { "value": "westeurope" },
    "baseName": { "value": "mototriporg" },
    "sqlAdminLogin": { "value": "sqladmin" },
    "auth0Domain": { "value": "your-tenant.auth0.com" },
    "auth0Audience": { "value": "https://api.mototriporganizer.com" },
    "keyVaultAdminObjectId": { "value": "YOUR_OBJECT_ID" }
  }
}
```

**Kako dobiti svoj Object ID:**
```bash
az ad signed-in-user show --query id -o tsv
```

### Korak 2: Deploy Infrastructure

**PowerShell (Windows):**
```powershell
cd infrastructure
.\deploy.ps1 -Environment dev -SubscriptionId "your-subscription-id"
```

**Bash (Linux/Mac):**
```bash
cd infrastructure
chmod +x deploy.sh
./deploy.sh dev your-subscription-id
```

**Ručno sa Azure CLI:**
```bash
# Login
az login

# Set subscription
az account set --subscription "your-subscription-id"

# Create resource group
az group create --name mototriporg-dev-rg --location westeurope

# Deploy
az deployment group create \
  --name mototriporg-deploy \
  --resource-group mototriporg-dev-rg \
  --template-file main.bicep \
  --parameters main.parameters.dev.json \
  --parameters sqlAdminPassword="YourStrongPassword123!"
```

### Korak 3: Konfiguriši Auth0

1. **Dodaj Callback URLs:**
   - `https://mototriporg-dev-api.azurewebsites.net/signin-auth0`
   - `http://localhost:5000/signin-auth0` (za local testing)

2. **Allowed Logout URLs:**
   - `https://mototriporg-dev-api.azurewebsites.net`

3. **Allowed Web Origins:**
   - `https://mototriporg-dev-api.azurewebsites.net`

4. **CORS Settings:**
   - Dodaj sve origine koji će pristupati API-ju

### Korak 4: Deploy Aplikacije

**Opcija A: Direktno sa lokalnog računara**

```bash
# Build i publish
cd src/MotoTripOrganizer.Api
dotnet publish -c Release -o ./publish

# Kreiraj zip
cd publish
Compress-Archive -Path * -DestinationPath ../app.zip

# Deploy na Azure
az webapp deployment source config-zip \
  --resource-group mototriporg-dev-rg \
  --name mototriporg-dev-api \
  --src ../app.zip
```

**Opcija B: GitHub Actions (Preporučeno)**

1. **Konfiguriši GitHub Secrets:**

```bash
# Kreiraj Service Principal
az ad sp create-for-rbac \
  --name "mototriporg-github-sp" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/mototriporg-dev-rg \
  --sdk-auth
```

2. **Dodaj Secrets u GitHub:**
   - `AZURE_CREDENTIALS_DEV` - Output iz prethodne komande
   - `AZURE_CREDENTIALS_PROD` - Za production environment

3. **Push to GitHub:**
   - Push na `develop` branch → Deploy to DEV
   - Push na `main` branch → Deploy to PROD

### Korak 5: Run Database Migrations

**Lokalno (ka Azure SQL):**

```bash
# Get connection string iz Key Vault
az keyvault secret show \
  --vault-name mototriporg-dev-kv \
  --name SqlConnectionString \
  --query value -o tsv

# Run migrations
cd src/MotoTripOrganizer.Infrastructure
dotnet ef database update \
  --startup-project ../MotoTripOrganizer.Api \
  --connection "Server=tcp:mototriporg-dev-sql.database.windows.net,1433;..."
```

**Sa Azure-a (preporučeno za production):**

```bash
# Connect to SQL Database preko Azure Cloud Shell ili VM
# Ili koristi GitHub Actions workflow koji automatski izvršava migracije
```

### Korak 6: Verifikacija

```bash
# Health check
curl https://mototriporg-dev-api.azurewebsites.net/health

# Swagger UI
# Otvori u browseru: https://mototriporg-dev-api.azurewebsites.net/swagger

# Test bootstrap
curl -X POST https://mototriporg-dev-api.azurewebsites.net/api/me/bootstrap \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Test User"}'
```

## 🏗️ Kreirana Infrastruktura

### Resource Group: `mototriporg-{env}-rg`

| Resurs | Ime | SKU | Svrha |
|--------|-----|-----|-------|
| **App Service Plan** | `mototriporg-{env}-asp` | B1 (dev), P1v3 (prod) | Hosting za API |
| **Web App** | `mototriporg-{env}-api` | Linux, .NET 8 | API aplikacija |
| **SQL Server** | `mototriporg-{env}-sql` | - | Database server |
| **SQL Database** | `MotoTripOrganizer` | Basic (dev), S1 (prod) | Aplikaciona baza |
| **Storage Account** | `mototriporg{env}st` | Standard_LRS | Blob storage za fajlove |
| **Key Vault** | `mototriporg-{env}-kv` | Standard | Secrets management |
| **Application Insights** | `mototriporg-{env}-ai` | - | Monitoring |
| **Log Analytics** | `mototriporg-{env}-log` | Pay-as-you-go | Logs centralizacija |

### Storage Containers
- `trip-attachments` - Za slike, PDF-ove, itd.

### Key Vault Secrets
- `SqlConnectionString` - SQL connection string
- `StorageConnectionString` - Blob storage connection string
- `ApplicationInsightsConnectionString` - App Insights

## 🔐 Security Best Practices

### Managed Identity
Web App koristi **System-Assigned Managed Identity** za pristup:
- ✅ Key Vault (automatski)
- ✅ Storage Account (konfiguriši RBAC)
- ✅ SQL Database (opciono, umesto SQL auth)

### Network Security

**Firewall Rules (SQL Server):**
```bash
# Dodaj svoj IP za pristup iz Management Studio
az sql server firewall-rule create \
  --resource-group mototriporg-dev-rg \
  --server mototriporg-dev-sql \
  --name "MyWorkstationIP" \
  --start-ip-address "YOUR_IP" \
  --end-ip-address "YOUR_IP"
```

**Private Endpoints (Production):**
```bash
# Za produkciju, konfiguriši Private Endpoints za:
# - SQL Database
# - Storage Account
# - Key Vault
```

### CORS Configuration

**Update CORS u Web App:**
```bash
az webapp cors add \
  --resource-group mototriporg-dev-rg \
  --name mototriporg-dev-api \
  --allowed-origins "https://yourdomain.com" "http://localhost:3000"
```

## 📊 Monitoring & Logging

### Application Insights

**Querije:**

```kql
// Failed requests
requests
| where success == false
| summarize count() by resultCode, operation_Name
| order by count_ desc

// Slow requests
requests
| where duration > 1000
| project timestamp, name, duration, resultCode

// Trip access denied (403)
exceptions
| where outerMessage contains "TripAccessDeniedException"
| project timestamp, outerMessage, operation_Name
```

### Log Analytics

**View Logs:**
```bash
az monitor app-insights query \
  --app mototriporg-dev-ai \
  --analytics-query "requests | take 10"
```

### Alerts

**Konfiguriši Alert za Health Check:**
```bash
az monitor metrics alert create \
  --name "API Health Check Failed" \
  --resource-group mototriporg-dev-rg \
  --scopes "/subscriptions/{sub-id}/resourceGroups/mototriporg-dev-rg/providers/Microsoft.Web/sites/mototriporg-dev-api" \
  --condition "avg Http5xx > 5" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action "/subscriptions/{sub-id}/resourceGroups/mototriporg-dev-rg/providers/Microsoft.Insights/actionGroups/email-alerts"
```

## 💰 Cost Estimation

### Development Environment (mesečno)
- App Service Plan (B1): ~€12
- SQL Database (Basic): ~€4
- Storage Account: ~€1
- Key Vault: ~€0.50
- Application Insights: ~€2
- **Total: ~€20/mesec**

### Production Environment (mesečno)
- App Service Plan (P1v3): ~€70
- SQL Database (S1): ~€20
- Storage Account: ~€5
- Key Vault: ~€1
- Application Insights: ~€10
- **Total: ~€106/mesec**

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

**Automatski deploy na:**
- `develop` branch → DEV environment
- `main` branch → PROD environment

**Manual trigger:**
```bash
# Idi na GitHub → Actions → "Deploy to Azure" → Run workflow
```

### Azure DevOps (alternativa)

**azure-pipelines.yml:**
```yaml
trigger:
  - main
  - develop

pool:
  vmImage: 'ubuntu-latest'

stages:
- stage: Build
  jobs:
  - job: BuildJob
    steps:
    - task: DotNetCoreCLI@2
      inputs:
        command: 'build'
        projects: '**/*.csproj'

- stage: Deploy
  condition: eq(variables['Build.SourceBranch'], 'refs/heads/main')
  jobs:
  - deployment: DeployJob
    environment: 'production'
    strategy:
      runOnce:
        deploy:
          steps:
          - task: AzureWebApp@1
            inputs:
              azureSubscription: 'Azure Subscription'
              appName: 'mototriporg-prod-api'
              package: '$(Pipeline.Workspace)/drop'
```

## 🧪 Testing na Azure-u

### Integration Tests

**Test Connection:**
```bash
# Test SQL Connection
sqlcmd -S mototriporg-dev-sql.database.windows.net \
  -d MotoTripOrganizer \
  -U sqladmin \
  -P "YourPassword"

# Test Storage
az storage blob list \
  --account-name mototriporgdevst \
  --container-name trip-attachments
```

### Load Testing

**Azure Load Testing:**
```bash
# Kreiraj load test
az load test create \
  --name "api-load-test" \
  --resource-group mototriporg-dev-rg \
  --test-plan test-plan.jmx \
  --engine-instances 1
```

## 🆘 Troubleshooting

### Web App ne startuje

**Proveri logs:**
```bash
az webapp log tail \
  --resource-group mototriporg-dev-rg \
  --name mototriporg-dev-api
```

### SQL Connection Failed

**Proveri firewall:**
```bash
az sql server firewall-rule list \
  --resource-group mototriporg-dev-rg \
  --server mototriporg-dev-sql
```

### Key Vault Access Denied

**Grant access:**
```bash
az keyvault set-policy \
  --name mototriporg-dev-kv \
  --object-id $(az webapp identity show --name mototriporg-dev-api --resource-group mototriporg-dev-rg --query principalId -o tsv) \
  --secret-permissions get list
```

## 📚 Dodatni Resursi

- [Azure App Service docs](https://docs.microsoft.com/azure/app-service/)
- [Azure SQL Database docs](https://docs.microsoft.com/azure/sql-database/)
- [Bicep documentation](https://docs.microsoft.com/azure/azure-resource-manager/bicep/)
- [GitHub Actions for Azure](https://github.com/Azure/actions)

## 🔄 Update Existing Deployment

**Update samo App Service:**
```bash
az webapp config appsettings set \
  --resource-group mototriporg-dev-rg \
  --name mototriporg-dev-api \
  --settings Auth0__Domain="new-tenant.auth0.com"
```

**Scale up/down:**
```bash
# Scale App Service Plan
az appservice plan update \
  --name mototriporg-dev-asp \
  --resource-group mototriporg-dev-rg \
  --sku P1v3
```

**Backup & Restore:**
```bash
# Backup SQL Database
az sql db export \
  --resource-group mototriporg-dev-rg \
  --server mototriporg-dev-sql \
  --name MotoTripOrganizer \
  --admin-user sqladmin \
  --admin-password "YourPassword" \
  --storage-key "StorageKey" \
  --storage-key-type StorageAccessKey \
  --storage-uri "https://storage.blob.core.windows.net/backups/db.bacpac"
```

---

**Deploy sa sigurnošću! 🚀**
