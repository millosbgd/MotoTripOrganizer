# Auth0 Setup Guide - Moto Trip Organizer

Kompletna konfiguracija Auth0 za backend API i frontend aplikaciju.

## 🔐 Kreiranje Auth0 Aplikacije

### Korak 1: Login na Auth0
1. Idi na: https://manage.auth0.com/
2. Odaberi svoj tenant (ili kreiraj novi)

### Korak 2: Kreiraj API
**Za Backend (.NET API)**

1. **Idi na**: Applications → APIs → **Create API**
2. **Podaci**:
   - **Name**: `Moto Trip Organizer API`
   - **Identifier (Audience)**: `https://api.mototriporganizer.com`
   - **Signing Algorithm**: `RS256`
3. **Klikni**: Create

4. **Settings → Permissions (Scopes)** - dodaj:
   ```
   read:trips      - Read user's trips
   write:trips     - Create and update trips
   delete:trips    - Delete trips
   ```

5. **Settings** → Sačuvaj:
   - ✅ **Audience**: `https://api.mototriporganizer.com`
   - ✅ **Enable RBAC**: ON
   - ✅ **Add Permissions in the Access Token**: ON

### Korak 3: Kreiraj Application (za Frontend)
**Za Next.js Web App**

1. **Idi na**: Applications → Applications → **Create Application**
2. **Podaci**:
   - **Name**: `Moto Trip Organizer Web`
   - **Type**: **Regular Web Application** ✅ (Next.js je server-side!)
3. **Klikni**: Create

4. **Settings** - konfiguriši:

   **Application URIs:**
   ```
   Allowed Callback URLs:
   http://localhost:3000/api/auth/callback
   https://mototriporg-web-dev.azurestaticapps.net/api/auth/callback
   
   Allowed Logout URLs:
   http://localhost:3000
   https://mototriporg-web-dev.azurestaticapps.net
   
   Allowed Web Origins:
   http://localhost:3000
   https://mototriporg-web-dev.azurestaticapps.net
   
   Allowed Origins (CORS):
   http://localhost:3000
   https://mototriporg-web-dev.azurestaticapps.net
   ```

5. **Advanced Settings → OAuth**:
   - ✅ **JsonWebToken Signature Algorithm**: `RS256`
   - ✅ **OIDC Conformant**: ON

6. **Connections** tab:
   - Omogući: **Username-Password-Authentication**
   - Opciono: Google, GitHub, Microsoft...

7. **Sačuvaj credentials**:
   - ✅ **Domain**: `your-tenant.auth0.com`
   - ✅ **Client ID**: `AbCdEf123456...`
   - ✅ **Client Secret**: `XyZ789...` (biće potrebno)

### Korak 4: Konfiguriši Auth0 Actions (Opciono ali preporučeno)
**Dodaj custom claims u JWT token**

1. **Actions** → **Flows** → **Login**
2. **Custom** → **Build Custom**
3. **Name**: `Add User Metadata`
4. **Code**:

```javascript
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://api.mototriporganizer.com';
  
  // Add custom claims
  if (event.authorization) {
    api.idToken.setCustomClaim(`${namespace}/email`, event.user.email);
    api.idToken.setCustomClaim(`${namespace}/name`, event.user.name);
    api.accessToken.setCustomClaim(`${namespace}/email`, event.user.email);
  }
};
```

5. **Deploy** → **Add to Flow** → **Apply**

### Korak 5: Verifikuj API Pristup
**Proveri da li API dozvoljava frontend pristup**

1. **Applications → APIs** → Otvori **Moto Trip Organizer API**
2. **Machine to Machine Applications** tab
3. Pronađi **Moto Trip Organizer Web**
4. ✅ Proveri da je **Authorized** (toggle treba biti ON)
5. Ako nije, uključi ga i odaberi sve scopes

> **Napomena**: Povezivanje frontend-a sa API-jem se radi automatski kroz `audience` parametar u SDK-u. Ne postoji poseban "APIs" tab u aplikaciji.

### Korak 6: Test Users
**Kreiraj test korisnike**

1. **User Management** → **Users** → **Create User**
2. **Email**: `test@mototriporganizer.com`
3. **Password**: Postavi jak password
4. **Connection**: `Username-Password-Authentication`
5. **Create**

Napravi bar 2-3 korisnika za testiranje.

---

## 📋 Credentials Summary

**SAČUVAJ OVE PODATKE** (trebaće za konfiguraciju):

### Backend API
```bash
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://api.mototriporganizer.com
```

### Frontend SPA
```bash
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=AbCdEf123456...
AUTH0_CLIENT_SECRET=XyZ789...
AUTH0_AUDIENCE=https://api.mototriporganizer.com
AUTH0_SCOPE=openid profile email read:trips write:trips delete:trips
```

---

## 🧪 Test Auth0 Setup

### Test 1: Get Access Token (cURL)

```bash
curl --request POST \
  --url https://YOUR_TENANT.auth0.com/oauth/token \
  --header 'content-type: application/json' \
  --data '{
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "audience": "https://api.mototriporganizer.com",
    "grant_type": "client_credentials"
  }'
```

### Test 2: Decode JWT Token
1. Copy access token iz response-a
2. Idi na: https://jwt.io/
3. Paste token
4. Proveri da li postoji:
   - `iss`: `https://your-tenant.auth0.com/`
   - `aud`: `https://api.mototriporganizer.com`
   - `sub`: User ID

### Test 3: Call API sa Token-om

```bash
curl -X GET https://mototriporg-dev-api.azurewebsites.net/api/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Očekivani rezultat:
- **404** - Korisnik nije bootstrap-ovan (OK!)
- **401** - Invalid token (proveri Auth0 config)

---

## 🔧 Troubleshooting

### Problem: "Invalid audience"
**Rešenje**: Proveri da li je `audience` parameter u frontend-u tačan:
```javascript
audience: 'https://api.mototriporganizer.com'
```

### Problem: "Token expired"
**Rešenje**: Podesi **Token Expiration** u Auth0:
- API → Settings → Token Expiration → `86400` (24h)

### Problem: "CORS error"
**Rešenje**: Dodaj frontend URL u **Allowed Origins (CORS)**:
```
http://localhost:3000
https://mototriporg-web-dev.azurestaticapps.net
```

### Problem: "User not found after login"
**Rešenje**: Proveri da li je `sub` claim dostupan u JWT:
- Idi na jwt.io i dekoduj token
- Proveri `sub` field
- Backend koristi `sub` kao `Auth0Subject`

---

## 🚀 Production Checklist

Pre production deploya:

- [ ] Promeni Allowed Callback URLs (ukloni localhost)
- [ ] Promeni Allowed Logout URLs (ukloni localhost)
- [ ] Promeni Allowed Web Origins (ukloni localhost)
- [ ] Omogući MFA (Multi-Factor Authentication)
- [ ] Podesi Brute Force Protection
- [ ] Konfiguriši Password Policy (Settings → Password Policy)
- [ ] Setup Email Templates (Branding → Email Templates)
- [ ] Setup Custom Domain (opciono)
- [ ] Configure Login/Signup customization

---

## 📚 Dodatni Resursi

- [Auth0 .NET Quickstart](https://auth0.com/docs/quickstart/backend/aspnet-core-webapi)
- [Auth0 Next.js SDK](https://auth0.com/docs/quickstart/webapp/nextjs)
- [Auth0 React SDK](https://auth0.com/docs/quickstart/spa/react)

---

**Kad završiš Auth0 setup, javi mi Domain i Client ID da update-ujem konfiguraciju!** 🔐
