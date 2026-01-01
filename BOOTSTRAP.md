# Bootstrap Flow - User Authentication & Registration

## 🔄 Kako Radi Bootstrap?

### Problem
JWT token iz Auth0 sadrži `sub` (subject) claim koji je Auth0 jedinstveni identifikator (npr. `auth0|123456`), ali NE sadrži naš interni `user_id` iz baze podataka.

### Rešenje - UserIdResolverMiddleware
Middleware automatski:
1. ✅ Čita `sub` claim iz JWT tokena
2. ✅ Traži User zapis u bazi sa tim Auth0Subject
3. ✅ Dodaje `user_id` claim u trenutni request
4. ✅ `CurrentUserService.UserId` sada radi!

## 📋 API Endpoints

### 1. GET /api/me
**Vraća trenutnog korisnika**

```http
GET /api/me
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200 OK):**
```json
{
  "id": 1,
  "auth0Subject": "auth0|123456",
  "displayName": "John Doe"
}
```

**Response (404 Not Found):**
```json
{
  "message": "User not found. Please call /api/me/bootstrap first."
}
```

### 2. POST /api/me/bootstrap
**Kreira User zapis u bazi (prva prijava)**

```http
POST /api/me/bootstrap
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "displayName": "John Doe"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "auth0Subject": "auth0|123456",
  "displayName": "John Doe"
}
```

## 🔀 Bootstrap Flow Diagram

```
┌──────────────┐
│  Frontend    │
│  (First      │
│   Login)     │
└──────┬───────┘
       │
       │ 1. Login via Auth0
       ↓
┌──────────────┐
│    Auth0     │──→ Issues JWT with "sub" claim
└──────┬───────┘
       │
       │ 2. GET /api/me (check if user exists)
       ↓
┌──────────────────────────────────────┐
│  API - UserIdResolverMiddleware      │
├──────────────────────────────────────┤
│ • Reads "sub" from JWT               │
│ • Looks up User in DB                │
│ • If found: adds "user_id" claim     │
│ • If NOT found: continues (OK)       │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────┐
│  GET /api/me     │
│  Response:       │
│  404 Not Found   │ ← User doesn't exist yet
└──────┬───────────┘
       │
       │ 3. POST /api/me/bootstrap
       ↓
┌──────────────────────────────────────┐
│  POST /api/me/bootstrap              │
├──────────────────────────────────────┤
│ • Creates User record in DB          │
│ • Auth0Subject = "sub" from JWT      │
│ • DisplayName = from request body    │
│ • Returns UserDto with new ID        │
└──────┬───────────────────────────────┘
       │
       │ 4. Subsequent requests
       ↓
┌──────────────────────────────────────┐
│  Any API Request                     │
├──────────────────────────────────────┤
│  UserIdResolverMiddleware NOW finds  │
│  the user in DB and adds "user_id"   │
│  claim automatically!                │
└──────────────────────────────────────┘
       │
       ↓
┌──────────────────┐
│  CurrentUserService.UserId works! ✅ │
└──────────────────┘
```

## 🎯 Frontend Implementation

### React/TypeScript Example

```typescript
// auth.service.ts
export class AuthService {
  async bootstrapUser(token: string, displayName: string): Promise<User> {
    // 1. Check if user exists
    try {
      const user = await this.getCurrentUser(token);
      return user; // User already bootstrapped
    } catch (error) {
      if (error.status === 404) {
        // 2. User doesn't exist, bootstrap
        return await this.createUser(token, displayName);
      }
      throw error;
    }
  }

  async getCurrentUser(token: string): Promise<User> {
    const response = await fetch('/api/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw { status: response.status };
    }

    return await response.json();
  }

  async createUser(token: string, displayName: string): Promise<User> {
    const response = await fetch('/api/me/bootstrap', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ displayName })
    });

    if (!response.ok) {
      throw new Error('Bootstrap failed');
    }

    return await response.json();
  }
}

// Usage in App.tsx
useEffect(() => {
  const initUser = async () => {
    if (isAuthenticated) {
      const token = await getAccessTokenSilently();
      const user = await authService.bootstrapUser(token, userProfile.name);
      setCurrentUser(user);
    }
  };

  initUser();
}, [isAuthenticated]);
```

## 🔒 Security Notes

### ✅ Što Je Bezbedno
1. JWT token se verifikuje preko Auth0 (signature, expiry, audience)
2. Auth0Subject je garantovano jedinstven i ne može se falsifikovati
3. Middleware radi lookup u bazi na svakom requestu (ili može se dodati caching)
4. UserId se dodaje kao claim samo za trenutni request (ne menja token)

### ⚠️ Performance Considerations

**Trenutno:** Middleware radi DB query na svakom requestu.

**Opcije za optimizaciju:**

#### Opcija A: Memory Cache (Preporučeno za mali broj korisnika)
```csharp
// U Startup-u
builder.Services.AddMemoryCache();

// U middleware-u
if (!cache.TryGetValue(auth0Subject, out int userId))
{
    userId = await dbContext.Users...;
    cache.Set(auth0Subject, userId, TimeSpan.FromMinutes(30));
}
```

#### Opcija B: Redis Cache (Preporučeno za produkciju)
```csharp
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = "localhost:6379";
});
```

#### Opcija C: Auth0 Actions (Dodaj user_id u token)
```javascript
// Auth0 Action (Post Login)
exports.onExecutePostLogin = async (event, api) => {
  const userId = event.user.app_metadata.user_id;
  if (userId) {
    api.idToken.setCustomClaim('user_id', userId);
  }
};
```

## 📊 Testiranje

### Curl Commands

```bash
# 1. Get JWT token from Auth0
TOKEN="eyJhbGc..."

# 2. Check if user exists
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/me

# 3. If 404, bootstrap user
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"displayName":"John Doe"}' \
  http://localhost:5000/api/me/bootstrap

# 4. Verify user exists now
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/me
```

### Expected Behavior

| Scenario | GET /api/me | POST /api/me/bootstrap |
|----------|-------------|------------------------|
| **Prvi login (user ne postoji)** | 404 Not Found | 200 OK (kreira usera) |
| **Drugi login (user postoji)** | 200 OK (vraća usera) | 200 OK (vraća postojećeg) |
| **Invalid JWT** | 401 Unauthorized | 401 Unauthorized |

## 🚀 Deployment Checklist

- ✅ Configure Auth0 (Authority, Audience)
- ✅ Test bootstrap flow with real JWT token
- ✅ Consider adding Memory/Redis cache for performance
- ✅ Monitor database query performance
- ✅ Add Application Insights logging
- ✅ Consider Auth0 Actions for user_id in token (optional)

## 📝 Summary

**Bootstrap je sada potpuno funkcionalan!** 🎉

1. ✅ `UserIdResolverMiddleware` automatski rešava UserId
2. ✅ `GET /api/me` proverava da li user postoji
3. ✅ `POST /api/me/bootstrap` kreira novog usera
4. ✅ `CurrentUserService.UserId` radi nakon bootstrapa
5. ✅ Svi Trip servisi mogu da koriste UserId

**Flow:**
1. Frontend dobije JWT od Auth0
2. Pozove `GET /api/me` → 404 (user ne postoji)
3. Pozove `POST /api/me/bootstrap` → 200 (user kreiran)
4. Svi naredni requesti imaju `user_id` claim automatski!
