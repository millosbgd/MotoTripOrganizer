# Moto Trip Organizer - Complete Deployment Guide

Sve što treba da uradiš za kompletan deployment backend-a i frontend-a.

## 📋 Pre deployment-a

### ✅ Što već imaš:
- [x] Azure SQL Database (`MotoTripOrganizer` na `motomanager`)
- [x] Resource Group (`rg-mototriporganizer-dev`)
- [x] Auth0 aplikacija podešena
- [x] GitHub Service Principal credentials

---

## 🚀 Korak 1: Deploy Backend Infrastrukture

### 1.1 Kopiraj `.env.local` za lokalno testiranje

```powershell
cd frontend
cp .env.local.example .env.local
```

**Edituj `.env.local`**:
```bash
AUTH0_SECRET='<generate-with: openssl rand -hex 32>'
AUTH0_ISSUER_BASE_URL='https://dev-gp57sox40kt34si8.us.auth0.com'
AUTH0_CLIENT_ID='KeP57L3qWSI3tF75HPvKqs3tdX3LcjTa'
AUTH0_CLIENT_SECRET='AMRpRGqbkXzWDZKTl0eO4SLegGlEj-WN3TwJSizZJIFnx-XxMJLmg3HnLuEHm-nt'
```

### 1.2 Deploy Backend na Azure

```powershell
cd infrastructure
.\deploy-existing-sql.ps1
```

Uneseće pitati:
- SQL Admin username (koristi ono što imaš za `motomanager`)
- SQL Admin password
- Auth0 Domain (već popunjeno)
- Auth0 Audience (već popunjeno)

**Rezultat:**
```
✅ Web App:     mototriporg-dev-api
✅ Storage:     mototriporgdevst
✅ Key Vault:   mototriporg-dev-kv
✅ App Insights: mototriporg-dev-ai
```

---

## 🗄️ Korak 2: Run Database Migrations

```powershell
cd src/MotoTripOrganizer.Api

# Get connection string
$connectionString = az keyvault secret show `
  --vault-name mototriporg-dev-kv `
  --name SqlConnectionString `
  --query value -o tsv

# Run migrations
dotnet ef database update `
  --project ../MotoTripOrganizer.Infrastructure `
  --connection $connectionString
```

---

## 📤 Korak 3: Deploy Backend Aplikacije

### 3.1 Build i Publish

```powershell
cd ../../  # Root folder
dotnet publish src/MotoTripOrganizer.Api/MotoTripOrganizer.Api.csproj -c Release -o ./publish
```

### 3.2 Deploy na Azure App Service

```powershell
# Create ZIP
Compress-Archive -Path ./publish/* -DestinationPath ./app.zip -Force

# Deploy
az webapp deployment source config-zip `
  --resource-group rg-mototriporganizer-dev `
  --name mototriporg-dev-api `
  --src app.zip
```

### 3.3 Test Backend

```powershell
curl https://mototriporg-dev-api.azurewebsites.net/health
# Očekivano: {"status":"Healthy"}

curl https://mototriporg-dev-api.azurewebsites.net/swagger
# Otvori u browseru za Swagger UI
```

---

## 🌐 Korak 4: Kreiraj Azure Static Web App

### 4.1 Preko Azure Portal

1. **Azure Portal** → **Create a resource** → **Static Web App**
2. **Podaci**:
   - Name: `mototriporg-web-dev`
   - Region: `West Europe`
   - Plan: `Free`
   - Deployment: **GitHub**
   - GitHub Account: Connectuj svoj account
   - Repository: Izaberi `MotoTripOrganizer`
   - Branch: `main`
   - Build Presets: `Next.js`
   - App location: `/frontend`
   - Output location: `.next`
3. **Create**

### 4.2 Sačuvaj Deployment Token

1. **Static Web App** → **Overview**
2. **Manage deployment token** → **Copy**
3. Sačuvaj za GitHub Secrets

---

## 🐙 Korak 5: Setup GitHub Repository (Monorepo)

### 5.1 Inicijalizuj Git i Push

```powershell
# U root folderu projekta
cd C:\Users\MilosNovakovic\YandexDisk\Posao\Cycle\Private\MotoTripOrganizer

# Inicijalizuj git
git init

# Dodaj remote (tvoj repo)
git remote add origin https://github.com/millosbgd/MotoTripOrganizer.git

# Pull README.md sa GitHub-a (ako si kreirao sa README)
git pull origin main --allow-unrelated-histories

# Dodaj sve fajlove
git add .

# Commit
git commit -m "Initial commit: Backend + Frontend monorepo"

# Push
git push -u origin main
```

### 5.2 Folder Struktura u Repo

```
MotoTripOrganizer/
├── src/                    # Backend .NET kod
│   ├── MotoTripOrganizer.Api/
│   ├── MotoTripOrganizer.Core/
│   └── MotoTripOrganizer.Infrastructure/
├── frontend/               # Next.js frontend
│   ├── src/
│   ├── public/
│   └── package.json
├── infrastructure/         # Bicep templates
├── .github/
│   └── workflows/
│       ├── azure-backend-deploy.yml
│       └── azure-static-web-apps.yml
└── DEPLOYMENT-GUIDE.md
```

---

## 🔐 Korak 6: Konfiguriši GitHub Secrets

### MotoTripOrganizer Repo

**Settings** → **Secrets and variables** → **Actions** → **New repository secret**

```
AZURE_CREDENTIALS
{
  "clientId": "<service-principal-client-id>",
  "clientSecret": "<service-principal-client-secret>",
  "subscriptionId": "2660f749-55ec-4cfe-990e-399f3ae12241",
  "tenantId": "5efc35a6-4227-4361-90e7-55b689ef24b0"
}

AUTH0_DOMAIN
dev-gp57sox40kt34si8.us.auth0.com

AUTH0_AUDIENCE
https://api.mototriporganizer.com

AZURE_STATIC_WEB_APPS_API_TOKEN
<token-iz-static-web-app>

AUTH0_SECRET
<generate: openssl rand -hex 32>

AUTH0_BASE_URL
https://mototriporg-web-dev.azurestaticapps.net

AUTH0_ISSUER_BASE_URL
https://dev-gp57sox40kt34si8.us.auth0.com

AUTH0_CLIENT_ID
<your-auth0-client-id>

AUTH0_CLIENT_SECRET
<your-auth0-client-secret>

AUTH0_AUDIENCE
https://api.mototriporganizer.com

AUTH0_SCOPE
openid profile email read:trips write:trips delete:trips

NEXT_PUBLIC_API_URL
https://mototriporg-dev-api.azurewebsites.net
```

---

## ✅ Korak 7: Test Deployment

### 7.1 Trigger GitHub Actions

```powershell
# Backend
cd mototriporganizer-api
git add .
git commit -m "test: trigger deployment"
gitilo koja promena triggeruje deploy (oba workflows u istom repo)

### 7.2 Proveri Deployment

**Backend:**
- GitHub → Actions tab → Proveri workflow status
- https://mototriporg-dev-api.azurewebsites.net/health → 200 OK
- https://mototriporg-dev-api.azurewebsites.net/swagger → Swagger UI

**Frontend:**
- GitHub → Actions tab → Proveri workflow status
- https://mototriporg-web-dev.azurestaticapps.net → Landing page
- Klikni "Sign In" → Auth0 login → Dashboard

---

## 🧪 Korak 8: End-to-End Test

1. **Sign Up** na frontend-u
2. **Login** sa test korisnikom
3. **Bootstrap** se automatski dešava
4. **Kreiraj Trip**
5. **Dodaj Stage**
6. **Dodaj Item**
7. **Proveri** da se sve čuva i učitava

---

## 🆘 Troubleshooting

### Backend ne startuje
```powershell
# Proveri logs
az webapp log tail `
  --resource-group rg-mototriporganizer-dev `
  --name mototriporg-dev-api
```

### Frontend prikazuje 401 Unauthorized
- Proveri `NEXT_PUBLIC_API_URL` u GitHub Secrets
- Proveri CORS u backend `appsettings.json`

### Auth0 login ne radi
- Proveri Callback URLs u Auth0
- Dodaj Static Web App URL: `https://mototriporg-web-dev.azurestaticapps.net/api/auth/callback`

---

## 📊 Monitoring

### Application Insights

```powershell
# View logs
az monitor app-insights query `
  --app mototriporg-dev-ai `
  --analytics-query "requests | take 10"
```

### Cost Tracking

**Mesečni troškovi (~€25-30):**
- SQL Database (Basic): ~€4
- App Service (B1): ~€12
- Storage Account: ~€1
- Static Web App (Free): €0
- Key Vault: ~€0.50
- Application Insights: ~€2

---

## 🎉 Gotovo!

Sada imaš:
- ✅ Backend API na Azure App Service
- ✅ Frontend na Azure Static Web Apps
- ✅ Automatic CI/CD preko GitHub Actions
- ✅ Auth0 authentication working
- ✅ Database migrations applied

**URL-ovi:**
- **Frontend**: https://mototriporg-web-dev.azurestaticapps.net
- **Backend**: https://mototriporg-dev-api.azurewebsites.net
- **Swagger**: https://mototriporg-dev-api.azurewebsites.net/swagger

**Testiranje:**
```powershell
# Generate AUTH0_SECRET
openssl rand -hex 32
```

Srećno! 🏍️💨
