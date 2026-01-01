# Migration Commands

This file contains common EF Core migration commands for reference.

## Prerequisites
Ensure you're in the Infrastructure project directory or specify the startup project.

## Create Initial Migration

```bash
# From Infrastructure project folder
cd src/MotoTripOrganizer.Infrastructure
dotnet ef migrations add InitialCreate --startup-project ../MotoTripOrganizer.Api
```

## Apply Migrations to Database

```bash
# Update database to latest migration
dotnet ef database update --startup-project ../MotoTripOrganizer.Api

# Update to a specific migration
dotnet ef database update MigrationName --startup-project ../MotoTripOrganizer.Api
```

## Remove Last Migration (if not applied)

```bash
dotnet ef migrations remove --startup-project ../MotoTripOrganizer.Api
```

## Generate SQL Script

```bash
# Generate script for all migrations
dotnet ef migrations script --startup-project ../MotoTripOrganizer.Api -o migration.sql

# Generate script from one migration to another
dotnet ef migrations script FromMigration ToMigration --startup-project ../MotoTripOrganizer.Api -o migration.sql
```

## List Migrations

```bash
dotnet ef migrations list --startup-project ../MotoTripOrganizer.Api
```

## Drop Database (Development only!)

```bash
dotnet ef database drop --startup-project ../MotoTripOrganizer.Api --force
```

## Connection String
The migrations use the connection string from `appsettings.Development.json`:
```
Server=localhost,1433;Database=MotoTripOrganizer;User Id=sa;Password=YourStrong@Passw0rd;TrustServerCertificate=True;
```

## Notes
- Always review generated migrations before applying
- Test migrations on a non-production database first
- Keep migration files in source control
- For production, generate SQL scripts and review before applying
