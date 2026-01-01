# GitHub Setup Guide - Moto Trip Organizer

Kompletna konfiguracija za 2 GitHub repozitorijuma: Backend API i Frontend Web.

## 📦 Repository Structure

```
🔹 mototriporganizer-api (Backend)
   ├─ src/
   ├─ infrastructure/
   ├─ .github/workflows/
   └─ README.md

🔹 mototriporganizer-web (Frontend)  
   ├─ src/
   ├─ public/
   ├─ .github/workflows/
   └─ README.md
```

---

## 🚀 Korak 1: Kreiraj GitHub Repositories

### Backend Repository

1. **Idi na**: https://github.com/new
2. **Repository name**: `mototriporganizer-api`
3. **Description**: `.NET 8 Web API for Moto Trip Organizer - Clean Architecture`
4. **Visibility**: Private (ili Public)
5. **Initialize**:
   - ☑️ Add a README file
   - ☑️ Add .gitignore: **VisualStudio**
   - ☐ Choose a license (opciono: MIT)
6. **Create repository**

### Frontend Repository

1. **Idi na**: https://github.com/new
2. **Repository name**: `mototriporganizer-web`
3. **Description**: `Next.js 14 Frontend for Moto Trip Organizer`
4. **Visibility**: Private (ili Public)
5. **Initialize**:
   - ☑️ Add a README file
   - ☑️ Add .gitignore: **Node**
   - ☐ Choose a license (opciono: MIT)
6. **Create repository**

---

## 🔐 Korak 2: Konfiguriši GitHub Secrets

### Backend Secrets (mototriporganizer-api)

**Settings → Secrets and variables → Actions → New repository secret**

#### Secret 1: `AZURE_CREDENTIALS`
**Value** (JSON iz Service Principal-a):
```json
{
  "clientId": "<service-principal-client-id>",
  "clientSecret": "<service-principal-client-secret>",
  "subscriptionId": "2660f749-55ec-4cfe-990e-399f3ae12241",
  "tenantId": "5efc35a6-4227-4361-90e7-55b689ef24b0",
  "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
  "resourceManagerEndpointUrl": "https://management.azure.com/",
  "activeDirectoryGraphResourceId": "https://graph.windows.net/",
  "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
  "galleryEndpointUrl": "https://gallery.azure.com/",
  "managementEndpointUrl": "https://management.core.windows.net/"
}
```

#### Secret 2: `SQL_ADMIN_PASSWORD`
**Value**: Password za SQL Server admin

#### Secret 3: `AUTH0_DOMAIN`
**Value**: `your-tenant.auth0.com`

#### Secret 4: `AUTH0_AUDIENCE`
**Value**: `https://api.mototriporganizer.com`

### Frontend Secrets (mototriporganizer-web)

**Settings → Secrets and variables → Actions → New repository secret**

#### Secret 1: `AZURE_STATIC_WEB_APPS_API_TOKEN`
**Value**: (dobijaš nakon kreiranja Azure Static Web App - kasnije)

#### Secret 2: `AUTH0_CLIENT_ID`
**Value**: Client ID iz Auth0

#### Secret 3: `AUTH0_CLIENT_SECRET`
**Value**: Client Secret iz Auth0

#### Secret 4: `AUTH0_DOMAIN`
**Value**: `your-tenant.auth0.com`

#### Secret 5: `NEXT_PUBLIC_API_URL`
**Value**: `https://mototriporg-dev-api.azurewebsites.net`

---

## 🔧 Korak 3: Environment Variables (opciono)

**Settings → Environments → New environment**

### Environment: `development`
- `AZURE_RESOURCE_GROUP`: `rg-mototriporganizer-dev`
- `AZURE_WEB_APP_NAME`: `mototriporg-dev-api`

### Environment: `production`
- `AZURE_RESOURCE_GROUP`: `rg-mototriporganizer-prod`
- `AZURE_WEB_APP_NAME`: `mototriporg-prod-api`

---

## 📤 Korak 4: Push Existing Code

### Backend (iz trenutnog foldera)

```powershell
# Inicijalizuj git (ako već nije)
git init

# Dodaj remote
git remote add origin https://github.com/YOUR_USERNAME/mototriporganizer-api.git

# Pull README i .gitignore sa GitHub-a
git pull origin main --allow-unrelated-histories

# Dodaj sve fajlove
git add .

# Commit
git commit -m "Initial commit: .NET 8 API with Clean Architecture"

# Push
git push -u origin main
```

### Frontend (kad bude spreman)

```powershell
cd ../mototriporganizer-web

git init
git remote add origin https://github.com/YOUR_USERNAME/mototriporganizer-web.git
git pull origin main --allow-unrelated-histories
git add .
git commit -m "Initial commit: Next.js 14 frontend"
git push -u origin main
```

---

## 🔄 Korak 5: GitHub Actions Workflow

### Backend Workflow
**Automatski deploy na push to `main` branch**

Fajl: `.github/workflows/azure-deploy.yml`
```yaml
name: Deploy Backend to Azure

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0.x'
      
      - name: Build
        run: dotnet build --configuration Release
      
      - name: Test
        run: dotnet test --no-build
      
      - name: Publish
        run: dotnet publish src/MotoTripOrganizer.Api/MotoTripOrganizer.Api.csproj -c Release -o ./publish
      
      - name: Login to Azure
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      
      - name: Deploy to Azure Web App
        uses: azure/webapps-deploy@v3
        with:
          app-name: mototriporg-dev-api
          package: ./publish
```

### Frontend Workflow
**Automatski deploy na push to `main` branch**

Fajl: `.github/workflows/azure-static-web-apps.yml`
```yaml
name: Deploy Frontend to Azure Static Web Apps

on:
  push:
    branches: [ main ]
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches: [ main ]

jobs:
  build_and_deploy:
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
    runs-on: ubuntu-latest
    name: Build and Deploy
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: true
      
      - name: Build And Deploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/"
          api_location: ""
          output_location: ".next"
```

---

## 🧪 Korak 6: Test GitHub Actions

### Test Backend Deploy

1. **Push kod na GitHub**:
   ```powershell
   git add .
   git commit -m "test: trigger GitHub Actions"
   git push
   ```

2. **Idi na**: GitHub → Actions tab
3. **Proveri**: Workflow run status
4. **Uspeh**: ✅ Green checkmark
5. **Test API**: 
   ```bash
   curl https://mototriporg-dev-api.azurewebsites.net/health
   ```

### Test Frontend Deploy

1. **Push kod na GitHub**:
   ```powershell
   git push
   ```

2. **Proveri**: GitHub Actions
3. **Otvori**: Static Web App URL
4. **Proveri**: Login radi

---

## 🔒 Security Best Practices

### Branch Protection

**Settings → Branches → Add rule**

- ✅ Branch name pattern: `main`
- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Require conversation resolution before merging

### Secret Scanning

**Settings → Code security and analysis**

- ✅ Enable **Dependency graph**
- ✅ Enable **Dependabot alerts**
- ✅ Enable **Dependabot security updates**
- ✅ Enable **Secret scanning**

---

## 📊 Monitoring

### GitHub Actions Monitoring

1. **Actions** tab → Workflow runs
2. Klikni na run → View logs
3. Download logs ako treba debug-ovati

### Azure Monitoring (iz GitHub)

```bash
# Install Azure CLI GitHub Action extension
az extension add --name application-insights

# View app logs
az webapp log tail \
  --name mototriporg-dev-api \
  --resource-group rg-mototriporganizer-dev
```

---

## 🆘 Troubleshooting

### Problem: "Authentication failed"
**Rešenje**: Proveri `AZURE_CREDENTIALS` secret
```bash
# Test Service Principal
az login --service-principal \
  -u CLIENT_ID \
  -p CLIENT_SECRET \
  --tenant TENANT_ID
```

### Problem: "Resource not found"
**Rešenje**: Proveri resource group name i web app name u workflow

### Problem: "Deployment failed"
**Rešenje**: Proveri deployment logs:
1. GitHub Actions → Failed run → View raw logs
2. Azure Portal → App Service → Deployment Center → Logs

---

## 📚 Dodatni Resursi

- [GitHub Actions for Azure](https://github.com/Azure/actions)
- [Azure Web Apps Deploy Action](https://github.com/Azure/webapps-deploy)
- [Azure Static Web Apps Deploy Action](https://github.com/Azure/static-web-apps-deploy)

---

**Sad možeš kreirati GitHub repozitorijume i konfigurišeš secrets!** 🚀
