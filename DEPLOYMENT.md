# 🚀 MotoTripOrganizer - Deployment Guide

## 📋 Pregled

Aplikacija se sastoji od:
- **Backend**: .NET 8 Web API → Azure App Service
- **Frontend**: Next.js → Vercel

## 🔄 Automatski Deployment (GitHub Integration)

### Backend → Azure (GitHub Actions)

**Kako radi:**
1. Push na `main` branch
2. GitHub Actions automatski detektuje izmene u:
   - `src/**`
   - `infrastructure/**`
   - `.github/workflows/azure-backend-deploy.yml`
3. Workflow build-uje, pakuje i deploy-uje na Azure
4. Health check provera nakon deployment-a

**Provera statusa:**
- URL: https://github.com/millosbgd/MotoTripOrganizer/actions
- Workflow: "Deploy Backend to Azure App Service"

**Deployed Endpoints:**
- API: https://mototriporg-dev-api.azurewebsites.net
- Health Check: https://mototriporg-dev-api.azurewebsites.net/health

---

### Frontend → Vercel (Manual Deployment via CLI)

**VAŽNO:** Vercel GitHub integration trenutno NIJE aktivna!  
Frontend se deploy-uje **ISKLJUČIVO** preko CLI-a pomoću `deploy-all.ps1` skripte.

**Zašto ne radi automatski?**
- Vercel mora biti povezan sa GitHub repo-om preko Vercel dashboard-a
- To trenutno nije podešeno, zato koristimo CLI deployment

---

## 🛠️ Manual Deployment (Preporučeno)

### Skripta: `deploy-all.ps1`

**Šta radi:**
1. ✅ Build-uje backend (.NET publish)
2. ✅ Pakuje u ZIP
3. ✅ Deploy-uje na Azure Web App
4. ✅ Restartuje Azure app
5. ✅ Deploy-uje frontend na Vercel (CLI)

**Kako pokrenuti:**

```powershell
.\deploy-all.ps1
```

**Output:**
```
🚀 Starting full deployment...
📦 Building backend...
✅ Backend build successful
🚢 Deploying backend to Azure...
✅ Backend deployed
🌐 Deploying frontend to Vercel...
✅ Frontend deployed
🎉 Full deployment completed successfully!
```

---

## ⚠️ TROUBLESHOOTING

### Problem 1: "Error: The specified token is not valid"

**Simptom:**
```
Error: The specified token is not valid. Use `vercel login` to generate a new token.
❌ Frontend deployment failed!
```

**Rešenje:**
```powershell
cd mototriporganizer-web
vercel login
```

**Koraci:**
1. Pokreni `vercel login`
2. Terminal će pokazati: `Visit https://vercel.com/oauth/device?user_code=XXXX-XXXX`
3. Pritisni ENTER (otvoriće browser automatski)
4. Login-uj se na Vercel
5. Potvrdi autorizaciju
6. Terminal će pokazati: `✅ Success! Your authentication token was created`

**VAŽNO:** Login ostaje aktivan, ne moraš ga ponavljati svaki put!

---

### Problem 2: Backend se ne deploy-uje automatski

**Proveri:**
1. Da li si push-ovao izmene u `src/` folderu?
2. GitHub Actions se NE triggeru-je za izmene u `mototriporganizer-web/`!

**Path filteri (šta triggeru-je workflow):**
```yaml
paths:
  - 'src/**'              # Backend kod
  - 'infrastructure/**'   # Infra config
  - '.github/workflows/azure-backend-deploy.yml'
```

**Ako promeniš samo frontend:**
- GitHub Actions se NEĆE pokrenuti
- Frontend mora ručno da se deploy-uje (`deploy-all.ps1`)

---

### Problem 3: Frontend se deploy-ovao ali promene nisu vidljive

**Razlozi:**
1. **Browser cache** - Hard refresh: `Ctrl + Shift + R` (Chrome/Edge) ili `Ctrl + F5`
2. **Vercel edge cache** - Deployment može trebati 1-2 minuta da se propagira globalno
3. **Wrong deployment** - Proveri da li deployment URL odgovara production-u

**Kako proveriti deployment:**
```powershell
cd mototriporganizer-web
vercel ls
```

Trebalo bi da vidiš:
```
mototriporganizer-web   Production   https://mototriporganizer-web.vercel.app   XX min
```

---

## 📦 Deployment Proces - Korak po Korak

### 1. Izmene u kodu

```powershell
# Bilo gde u projektu
git add -A
git commit -m "Opis izmene"
git push
```

### 2a. Ako si menjao BACKEND (`src/`)

✅ **GitHub Actions automatski deploy-uje na Azure**
- Proveri: https://github.com/millosbgd/MotoTripOrganizer/actions
- Čekaj 2-3 minuta
- Deployment ID će biti vidljiv u workflow logu

### 2b. Ako si menjao FRONTEND (`mototriporganizer-web/`)

❌ **GitHub Actions se NEĆE pokrenuti!**

✅ **Moraš ručno deploy-ovati:**
```powershell
.\deploy-all.ps1
```

**ILI samo frontend:**
```powershell
cd mototriporganizer-web
vercel --prod --yes
```

### 2c. Ako si menjao OBA

```powershell
# Najlakše:
.\deploy-all.ps1

# ILI:
# - GitHub Actions će deploy-ovati backend automatski
# - Frontend moraš ručno (vidi 2b)
```

---

## 🔑 Credentials & Secrets

### Azure (GitHub Secrets)

Da bi GitHub Actions radio, potreban je secret:
- `AZURE_CREDENTIALS` - Azure Service Principal JSON

**Gde se nalazi:**
- GitHub → Settings → Secrets and variables → Actions
- Secret name: `AZURE_CREDENTIALS`

**Ko ga je kreirao:** 
- Početni setup projekta
- NE diraj osim ako ne znaš šta radiš!

### Vercel (Local CLI)

**Token lokacija:**
- Windows: `C:\Users\<Username>\.vercel\auth.json`
- Kreiran sa: `vercel login`

**Ako nisi login-ovan:**
```powershell
vercel login
```

---

## 🎯 Quick Reference

| Akcija | Komanda |
|--------|---------|
| Full deployment (backend + frontend) | `.\deploy-all.ps1` |
| Samo frontend | `cd mototriporganizer-web; vercel --prod --yes` |
| Login Vercel (prvi put) | `vercel login` |
| Check Vercel deployments | `cd mototriporganizer-web; vercel ls` |
| GitHub Actions status | https://github.com/millosbgd/MotoTripOrganizer/actions |
| Backend URL | https://mototriporg-dev-api.azurewebsites.net |
| Frontend URL | https://mototriporganizer-web.vercel.app |

---

## 🐛 Known Issues

### Issue #1: Nested `publish/` folders

**Simptom:**
```
warning MSB3026: Could not copy "...\publish\publish\web.config"
```

**Uzrok:** 
- Multiple dotnet publish run-ova kreiraju nested foldere

**Rešenje:**
```powershell
Remove-Item -Recurse -Force src/MotoTripOrganizer.Api/publish
.\deploy-all.ps1
```

### Issue #2: GitHub Actions ne vidiš nove run-ove

**Simptom:**
- Push-ovao si kod
- GitHub Actions se ne pojavljuje u listi

**Uzrok:**
- Izmene nisu u `src/`, `infrastructure/` ili workflow fajlu
- Path filter blokira trigger

**Rešenje:**
- Promeni bilo šta u `src/` (npr. dodaj komentar)
- Push ponovo

---

## 📚 Dodatni Resources

- **GitHub Repo:** https://github.com/millosbgd/MotoTripOrganizer
- **Vercel Dashboard:** https://vercel.com (login-uj se da vidiš projekte)
- **Azure Portal:** https://portal.azure.com (Resource: mototriporg-dev-api)

---

## ✅ Pre-deployment Checklist

Prije `deploy-all.ps1`:

- [ ] Kod je commit-ovan i push-ovan na GitHub
- [ ] Nema TypeScript/ESLint grešaka u frontend-u
- [ ] Backend build-uje lokalno bez grešaka
- [ ] Vercel CLI je login-ovan (`vercel whoami` ne vraća grešku)
- [ ] Azure CLI je login-ovan (`az account show` ne vraća grešku)

---

**Poslednja izmena:** 2026-02-25  
**Verzija dokumenta:** 1.0  
**Autor:** GitHub Copilot (sa tvog jebanja 😄)
