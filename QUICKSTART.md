# Quick Start Guide - Moto Trip Organizer

Get the API running in 5 minutes!

## Option 1: Docker Compose (Recommended for Quick Start)

### Prerequisites
- Docker Desktop installed and running

### Steps

1. **Start the stack**
   ```bash
   docker-compose up -d
   ```

2. **Wait for SQL Server to be ready** (~30 seconds)
   ```bash
   docker-compose logs -f sql-server
   ```
   Wait for: "SQL Server is now ready for client connections"

3. **Access the API**
   - Swagger UI: http://localhost:5000/swagger
   - Health Check: http://localhost:5000/health

4. **Stop the stack**
   ```bash
   docker-compose down
   ```

5. **Clean up volumes** (if needed)
   ```bash
   docker-compose down -v
   ```

## Option 2: Local Development (Visual Studio / VS Code)

### Prerequisites
- .NET 8 SDK
- SQL Server (local or Docker)
- Auth0 account

### Steps

1. **Clone the repository**
   ```bash
   git clone <your-repo>
   cd MotoTripOrganizer
   ```

2. **Start SQL Server with Docker**
   ```bash
   docker-compose up -d sql-server
   ```

3. **Update Auth0 configuration**
   
   Edit `src/MotoTripOrganizer.Api/appsettings.Development.json`:
   ```json
   {
     "Auth0": {
       "Authority": "https://YOUR-TENANT.auth0.com/",
       "Audience": "https://api.mototriporganizer.com"
     }
   }
   ```

4. **Restore packages**
   ```bash
   dotnet restore
   ```

5. **Run migrations**
   ```bash
   cd src/MotoTripOrganizer.Api
   dotnet ef database update --project ../MotoTripOrganizer.Infrastructure
   ```

6. **Run the API**
   ```bash
   dotnet run --project src/MotoTripOrganizer.Api
   ```

7. **Open Swagger**
   - Navigate to: https://localhost:5001/swagger

## Testing the API

### 1. Get JWT Token from Auth0

You need a valid JWT token. Quick ways to get one:

**Option A: Auth0 Dashboard**
1. Go to Auth0 Dashboard → Applications → Your App
2. Go to "Quick Start" → "Test" tab
3. Copy the access token

**Option B: Postman/Thunder Client**
```bash
POST https://YOUR-TENANT.auth0.com/oauth/token
Content-Type: application/json

{
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET",
  "audience": "https://api.mototriporganizer.com",
  "grant_type": "client_credentials"
}
```

### 2. Bootstrap User

First API call to create your user record:

```bash
POST /api/me/bootstrap
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "displayName": "John Doe"
}
```

Response:
```json
{
  "id": 1,
  "auth0Subject": "auth0|123456",
  "displayName": "John Doe"
}
```

### 3. Create a Trip

```bash
POST /api/trips
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "Alps Adventure 2026",
  "startDate": "2026-06-01",
  "endDate": "2026-06-07",
  "baseCurrency": "EUR"
}
```

Response:
```json
{
  "id": 1,
  "ownerUserId": 1,
  "name": "Alps Adventure 2026",
  "startDate": "2026-06-01T00:00:00",
  "endDate": "2026-06-07T00:00:00",
  "baseCurrency": "EUR"
}
```

### 4. Get Your Trips

```bash
GET /api/trips
Authorization: Bearer YOUR_JWT_TOKEN
```

### 5. Create a Stage

```bash
POST /api/trips/1/stages
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "date": "2026-06-01",
  "startText": "Munich, Germany",
  "endText": "Innsbruck, Austria",
  "plannedKm": 180,
  "notes": "Scenic route through Bavarian Alps"
}
```

### 6. Get All Stages for Trip

```bash
GET /api/trips/1/stages
Authorization: Bearer YOUR_JWT_TOKEN
```

## Common Issues

### Issue: "Unable to connect to SQL Server"
**Solution**: Ensure SQL Server container is running:
```bash
docker ps
docker-compose logs sql-server
```

### Issue: "401 Unauthorized"
**Solution**: 
1. Check JWT token is valid and not expired
2. Verify Auth0 configuration in appsettings
3. Ensure token has correct audience

### Issue: "403 Forbidden on /api/trips/X/stages"
**Solution**: You're not a member of that trip. Can only access trips you created or were invited to.

### Issue: Migration fails
**Solution**: 
```bash
# Drop and recreate database
dotnet ef database drop --force --project src/MotoTripOrganizer.Infrastructure --startup-project src/MotoTripOrganizer.Api

# Run migrations again
dotnet ef database update --project src/MotoTripOrganizer.Infrastructure --startup-project src/MotoTripOrganizer.Api
```

## Using Swagger UI

1. Click "Authorize" button in Swagger UI
2. Enter: `Bearer YOUR_JWT_TOKEN`
3. Click "Authorize"
4. All requests will now include the token

## Sample Data

In Development mode, a sample user and trip are automatically seeded:
- User: "Sample User" (auth0|sample-user-123)
- Trip: "Sample Trip to Alps"

## Next Steps

1. ✅ **Setup Auth0 properly** - Create real application
2. ✅ **Add more stages** - Build out your trip
3. ✅ **Add items** - Hotels, notes, links
4. ✅ **Track expenses** - Add expense records
5. ✅ **Invite members** (future feature)

## Useful Commands

```bash
# View logs
docker-compose logs -f api

# Restart API only
docker-compose restart api

# Check health
curl http://localhost:5000/health

# Check database health
curl http://localhost:5000/health/ready

# View database
docker exec -it mototriporganizer-sqlserver /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "YourStrong@Passw0rd"
```

## Development Workflow

1. Make code changes
2. API auto-reloads (if using `dotnet watch`)
3. Test in Swagger
4. Create migrations if database changes:
   ```bash
   dotnet ef migrations add MigrationName --project src/MotoTripOrganizer.Infrastructure --startup-project src/MotoTripOrganizer.Api
   ```

## Production Deployment

See [README.md](README.md) for production deployment instructions to:
- Azure App Service
- Azure SQL Database  
- Azure Blob Storage
- Azure Key Vault for secrets

Happy coding! 🏍️
