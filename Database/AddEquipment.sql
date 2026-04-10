-- ============================================================
-- AddEquipment migration
-- Tabele: EquipmentCatalogItems, TripEquipmentEntries
-- Seed: 30 stavki šifarnika opreme
-- ============================================================

-- ── 1. Šifarnik opreme ──────────────────────────────────────

CREATE TABLE [EquipmentCatalogItems] (
    [Id]          INT            NOT NULL IDENTITY(1,1),
    [Name]        NVARCHAR(200)  NOT NULL,
    [Description] NVARCHAR(500)  NULL,
    [Category]    NVARCHAR(100)  NOT NULL,
    CONSTRAINT [PK_EquipmentCatalogItems] PRIMARY KEY ([Id])
);

CREATE INDEX [IX_EquipmentCatalogItems_Category]
    ON [EquipmentCatalogItems] ([Category]);

CREATE UNIQUE INDEX [IX_EquipmentCatalogItems_Name]
    ON [EquipmentCatalogItems] ([Name]);

-- ── 2. Unosi opreme po tripu ────────────────────────────────

CREATE TABLE [TripEquipmentEntries] (
    [Id]                     INT            NOT NULL IDENTITY(1,1),
    [TripId]                 INT            NOT NULL,
    [EquipmentCatalogItemId] INT            NOT NULL,
    [CarriedByUserId]        INT            NOT NULL,
    [Quantity]               INT            NOT NULL DEFAULT 1,
    [Note]                   NVARCHAR(500)  NULL,
    [CreatedByUserId]        INT            NOT NULL,
    [UpdatedByUserId]        INT            NULL,
    [CreatedAt]              DATETIME2      NOT NULL,
    [UpdatedAt]              DATETIME2      NULL,
    [RowVersion]             ROWVERSION     NOT NULL,
    CONSTRAINT [PK_TripEquipmentEntries] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_TripEquipmentEntries_Trips]
        FOREIGN KEY ([TripId]) REFERENCES [Trips]([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_TripEquipmentEntries_EquipmentCatalogItems]
        FOREIGN KEY ([EquipmentCatalogItemId]) REFERENCES [EquipmentCatalogItems]([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_TripEquipmentEntries_Users_CarriedBy]
        FOREIGN KEY ([CarriedByUserId]) REFERENCES [Users]([Id]) ON DELETE NO ACTION
);

CREATE INDEX [IX_TripEquipmentEntries_TripId]
    ON [TripEquipmentEntries] ([TripId]);

CREATE INDEX [IX_TripEquipmentEntries_EquipmentCatalogItemId]
    ON [TripEquipmentEntries] ([EquipmentCatalogItemId]);

CREATE INDEX [IX_TripEquipmentEntries_CarriedByUserId]
    ON [TripEquipmentEntries] ([CarriedByUserId]);

-- ── 3. Seed šifarnika ───────────────────────────────────────

INSERT INTO [EquipmentCatalogItems] ([Name], [Description], [Category]) VALUES
-- Alat
(N'Set za krpljenje guma',      N'Gumeni lepkovi, zakrpe, alat za vađenje uloška ventila',     N'Alat'),
(N'Kompresor za gume',          N'Prenosni električni kompresor / ručna pumpa',                  N'Alat'),
(N'Motorna dizalica',           N'Kompaktna dizalica ili stand za motocikl',                     N'Alat'),
(N'Osnovna kutija alata',       N'Ključevi, odvijači, klješta, imbus ključevi',                  N'Alat'),
(N'Set viličastih ključeva',    N'Komplet otvorenih ključeva raznih veličina',                   N'Alat'),
(N'Set nasadnih ključeva',      N'Komplet nasadnih ključeva sa račnom',                          N'Alat'),
(N'Rezervni lanci i karike',    N'Rezervni motociklistički lanac ili master karike',             N'Alat'),
(N'Gumeni čekić',               N'Za montažu i demontažu bez oštećenja',                         N'Alat'),
(N'Lepljiva / izolir traka',    N'Električna i gaffer traka za improvizovane popravke',          N'Alat'),
(N'Zip vezice (asortiman)',      N'Plastične vezice raznih veličina',                             N'Alat'),
-- Gorivo i mazivo
(N'Rezervno ulje za motor',     N'Litara+ motornog ulja odgovarajuće viskoznosti',               N'Gorivo i mazivo'),
(N'Kočiona tečnost',            N'DOT 4 ili DOT 5.1 kočiona tečnost',                            N'Gorivo i mazivo'),
(N'Rashladna tečnost',          N'Antifriz / destilisana voda za sistem hlađenja',               N'Gorivo i mazivo'),
(N'Mazivo za lanac',            N'Sprej ili tečno mazivo za lanac motocikla',                    N'Gorivo i mazivo'),
(N'Rezervni kanister za gorivo',N'Plastični sigurnosni kanister 5L',                             N'Gorivo i mazivo'),
-- Električna oprema
(N'Booster / startna baterija', N'Prenosni litijumski booster za paljenje motocikla',            N'Električna oprema'),
(N'Rezervni osigurači i žarulje',N'Komplet osigurača raznih amperaža i rezervnih sijalica',     N'Električna oprema'),
(N'Multimetar',                 N'Digitalni multimetar za dijagnostiku elektrike',               N'Električna oprema'),
(N'Power bank',                 N'Prenosna baterija za punjenje uređaja na putu',                N'Električna oprema'),
(N'Punjač za bateriju motocikla',N'Pametni punjač (CTEK ili sličan)',                            N'Električna oprema'),
(N'Baterijska lampa / fenjer',  N'Jaka LED lampa za rad u mraku',                               N'Električna oprema'),
-- Sigurnost
(N'Reflektujući prsluk',        N'CE sertifikovan reflektujući prsluk (obavezan u nekim zemljama)', N'Sigurnost'),
(N'Uže za vuču',                N'Čelično ili sintetičko uže za vuču motocikla',                 N'Sigurnost'),
(N'Vatrogasni aparat',          N'Kompaktni S2 aparat za motocikle',                             N'Sigurnost'),
-- Navigacija
(N'GPS uređaj / navigacija',    N'Dedicated GPS uređaj ili nosač telefona sa navigacijom',       N'Navigacija'),
-- Medicinska oprema
(N'Set prve pomoći',            N'Kompletna torba prve pomoći prilagođena motociklistima',       N'Medicinska oprema'),
-- Lična oprema
(N'Kišna oprema (pončo/kombinezon)', N'Vodootporna kišna oprema za vozača',                     N'Lična oprema'),
(N'Bungee kordoni i mrežice',   N'Za pričvršćivanje prtljaga na motocikl',                      N'Lična oprema'),
(N'Sigurnosna traka za prtljag',N'Ratchet ili cam buckle strop trake',                          N'Lična oprema'),
(N'Rezervne rukavice',          N'Rezervni par motociklističkih rukavica',                       N'Lična oprema');

-- ── 4. EF Migrations history zapis ─────────────────────────
-- Sprečava da EF pokuša da ponovo primeni migraciju

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260410120000_AddEquipment', N'8.0.11');
