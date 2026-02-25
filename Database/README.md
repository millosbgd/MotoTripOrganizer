# Database Migration Scripts

Ovaj folder sadrži SQL skripte za migration baze podataka.

## Kako koristiti skripte

### Povezivanje na Azure SQL bazu

Možeš koristiti Azure Data Studio, SQL Server Management Studio (SSMS), ili PowerShell.

#### Opcija 1: Azure Data Studio / SSMS
1. Otvori Azure Data Studio ili SSMS
2. Konektuj se na Azure SQL server:
   - Server: `mototriporg-dev-sql.database.windows.net`
   - Database: `mototriporg-dev-db`
   - Authentication: SQL Login ili Azure AD
3. Otvori SQL skriptu iz ovog foldera
4. Izvrši skriptu (F5)

#### Opcija 2: PowerShell sa sqlcmd
```powershell
# Instaliraj sqlcmd ako nije već instaliran
# winget install sqlcmd

# Izvrši migraciju
sqlcmd -S mototriporg-dev-sql.database.windows.net -d mototriporg-dev-db -U <username> -P <password> -i .\Database\20260225_AddNoteEntries.sql
```

#### Opcija 3: Azure CLI
```powershell
# Izvrši skriptu preko Azure CLI
az sql db execute -g rg-mototriporganizer-dev -s mototriporg-dev-sql -n mototriporg-dev-db --file .\Database\20260225_AddNoteEntries.sql
```

## Dostupne migracije

### 20260225_AddNoteEntries.sql
- **Opis**: Kreira tabelu `NoteEntries` za beleške na tripu
- **Funkcionalnost**: 
  - Polje `Content` za tekst beleške (NVARCHAR(MAX))
  - Praćenje ko je kreirao (`CreatedByUserId`)
  - Praćenje ko je izmenio (`UpdatedByUserId`)
  - Timestampovi (`CreatedAt`, `UpdatedAt`)
  - Foreign keys prema `Trips` i `Users` tabelama
  - Indeksi za bolju performansu

### 20260225_AddNoteEntries_Rollback.sql
- **Opis**: Vraća (rollback) promene iz gornye migracije
- **Koristi**: Ako treba da obrišeš `NoteEntries` tabelu

## Best Practices

1. **Backup pre migracije**: Uvek napravi backup baze pre izvršavanja migracije
2. **Test na dev bazi**: Prvo testiraj na development bazi
3. **Provera**: Proveri da li je migracija uspela sa:
   ```sql
   SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'NoteEntries';
   ```
4. **Rollback**: Ako nešto pođe po zlu, koristi rollback skriptu

## Napomene

- Svi datumi su u formatu `YYYYMMDD_` za lako sortiranje
- Svaka migracija ima rollback skriptu
- Skripte koriste `GO` separator za batch execution
- Indeksi su optimizovani za česte queries (po TripId i CreatedAt)
