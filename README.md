# Moto Trip Organizer - MVP

A production-grade ASP.NET Core 8 Web API for organizing motorcycle trips with stages, items, expenses, and attachments.

## 🏗️ Architecture

Clean Architecture with 4 layers:
- **Domain**: Entities, Enums, Exceptions
- **Application**: DTOs, Services, Validators
- **Infrastructure**: EF Core, Repositories, Azure Blob Storage, Auth
- **API**: Controllers, Middleware, Configuration

## 🔑 Key Principles

### "Trip is Sacred"
Every domain entity is scoped to a TripId, and **every API request must verify the caller is a Trip member**. Non-members receive a `403 Forbidden`.

### "No Community"
Users can belong to multiple trips but **can never see data outside trips they belong to**. No global user lists or cross-trip queries.

### Server is Source of Truth
No offline sync assumptions. All data operations go through the server.

## 🛠️ Tech Stack

- **.NET 8** - Latest LTS version
- **ASP.NET Core Web API** - RESTful API
- **Entity Framework Core 8** (Code First) - ORM with SQL Server
- **Auth0** - JWT Bearer authentication
- **Azure Blob Storage** - File attachments (metadata in SQL)
- **Swagger/OpenAPI** - API documentation
- **FluentValidation** - Request validation
- **Serilog** - Structured logging
- **HealthChecks** - SQL Server health monitoring
- **Docker** - Containerization with docker-compose

## 📦 Domain Model

### Entities
- **User** - Application user (linked to Auth0)
- **Trip** - Core aggregate root with owner and members
- **TripMember** - Membership with role (Owner/Editor/Viewer)
- **Stage** - Trip leg (e.g., Day 1: Munich → Innsbruck)
- **Item** - Notes, links, hotels (trip or stage-level)
- **Expense** - Expense tracking with category and currency
- **Attachment** - File metadata (stored in Azure Blob)

### Concurrency Control
Stage, Item, and Expense entities use **RowVersion** for optimistic concurrency control.

## 🚀 Getting Started

### Prerequisites
- .NET 8 SDK
- Docker Desktop (for local SQL Server)
- Auth0 account (for authentication)
- Azure Storage account (or Azurite for local dev)

### Local Development Setup

1. **Clone and restore packages**
   ```bash
   git clone <repository-url>
   cd MotoTripOrganizer
   dotnet restore
   ```

2. **Start SQL Server with Docker Compose**
   ```bash
   docker-compose up -d sql-server
   ```

3. **Update Auth0 configuration**
   Edit `src/MotoTripOrganizer.Api/appsettings.Development.json`:
   ```json
   {
     "Auth0": {
       "Authority": "https://your-tenant.auth0.com/",
       "Audience": "https://api.mototriporganizer.com"
     }
   }
   ```

4. **Run migrations**
   ```bash
   cd src/MotoTripOrganizer.Infrastructure
   dotnet ef migrations add InitialCreate --startup-project ../MotoTripOrganizer.Api
   dotnet ef database update --startup-project ../MotoTripOrganizer.Api
   ```

5. **Run the API**
   ```bash
   cd ../MotoTripOrganizer.Api
   dotnet run
   ```

6. **Access Swagger UI**
   Navigate to: `https://localhost:5001/swagger`

### Running with Docker Compose

```bash
docker-compose up --build
```

API will be available at `http://localhost:5000`

## 📡 API Endpoints

### Authentication
- `POST /api/me/bootstrap` - Create user record after first login

### Trips
- `GET /api/trips` - Get all user's trips
- `GET /api/trips/{tripId}` - Get trip details
- `POST /api/trips` - Create new trip

### Stages
- `GET /api/trips/{tripId}/stages` - Get all stages
- `POST /api/trips/{tripId}/stages` - Create stage
- `PUT /api/trips/{tripId}/stages/{stageId}` - Update stage

### Items
- `GET /api/trips/{tripId}/items` - Get all items
- `POST /api/trips/{tripId}/items` - Create item

### Expenses
- `GET /api/trips/{tripId}/expenses` - Get all expenses
- `POST /api/trips/{tripId}/expenses` - Create expense
- `GET /api/trips/{tripId}/expenses/summary` - Get expense summary

## 🔐 Authorization

All endpoints (except `/health`) require JWT Bearer authentication from Auth0.

Trip membership is enforced via `TripAuthorizationService`:
- Every controller action calls `EnsureTripAccessAsync(tripId)`
- Non-members receive `403 Forbidden`
- No cross-trip data access is possible

## 🧪 Testing

```bash
cd tests/MotoTripOrganizer.Tests
dotnet test
```

## 📊 Database Migrations

### Create a new migration
```bash
cd src/MotoTripOrganizer.Infrastructure
dotnet ef migrations add <MigrationName> --startup-project ../MotoTripOrganizer.Api
```

### Apply migrations
```bash
dotnet ef database update --startup-project ../MotoTripOrganizer.Api
```

### Seed data
Sample data is automatically seeded in Development environment (see `DbSeeder.cs`).

## 🐳 Docker Support

### Build image
```bash
docker build -t mototriporganizer-api -f src/MotoTripOrganizer.Api/Dockerfile .
```

### Run with docker-compose
```bash
docker-compose up
```

## 🔧 Configuration

Key configuration settings in `appsettings.json`:

- **ConnectionStrings:DefaultConnection** - SQL Server connection
- **Auth0:Authority** - Auth0 tenant URL
- **Auth0:Audience** - API audience identifier
- **AzureStorage:ConnectionString** - Azure Blob Storage
- **Cors:AllowedOrigins** - Allowed frontend origins

## 📝 Logging

Serilog is configured with:
- Console output
- File output (`logs/mototriporganizer-*.log`)
- Structured JSON logging
- Request/response logging

## 🏥 Health Checks

- `GET /health` - Basic health check
- `GET /health/ready` - Database readiness check

## 🔒 Security Best Practices

1. **JWT Authentication** - All requests authenticated via Auth0
2. **Trip-scoped Authorization** - Every operation verifies membership
3. **Concurrency Control** - RowVersion prevents lost updates
4. **Input Validation** - FluentValidation on all requests
5. **Error Handling** - ProblemDetails responses
6. **HTTPS Enforced** - TLS required in production
7. **Secrets Management** - Use User Secrets or Azure Key Vault

## 📚 Additional Notes

### Migration Strategy
- Code First approach with EF Core
- Auto-migration in Development (see `Program.cs`)
- Manual migration scripts for Production

### Blob Storage
- Files stored in Azure Blob Storage
- Only metadata (URL, filename, size) in SQL
- Consider implementing SAS tokens for direct client uploads

### Future Enhancements (Post-MVP)
- Member invitation system
- Real-time notifications (SignalR)
- Export trip data (PDF/Excel)
- Map integration for stages
- Currency conversion API
- Mobile app support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

[Your License Here]

## 👥 Authors

[Your Name/Team]
# Trigger deployment 22:13:58
