-- Migration: Add EmergencyInfos table
-- Date: 2026-03-14

CREATE TABLE EmergencyInfos (
    Id INT IDENTITY(1,1) NOT NULL,
    TripId INT NOT NULL,
    UserId INT NOT NULL,
    EmergencyContactName NVARCHAR(200) NULL,
    EmergencyContactPhone NVARCHAR(50) NULL,
    BloodType NVARCHAR(10) NULL,
    HealthInsurancePolicyNumber NVARCHAR(100) NULL,
    CreatedAt DATETIME2 NOT NULL,
    UpdatedAt DATETIME2 NULL,

    CONSTRAINT PK_EmergencyInfos PRIMARY KEY (Id),
    CONSTRAINT FK_EmergencyInfos_Trips FOREIGN KEY (TripId) REFERENCES Trips(Id) ON DELETE CASCADE,
    CONSTRAINT FK_EmergencyInfos_Users FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE NO ACTION,
    CONSTRAINT UQ_EmergencyInfos_TripId_UserId UNIQUE (TripId, UserId)
);

CREATE INDEX IX_EmergencyInfos_TripId ON EmergencyInfos (TripId);
CREATE INDEX IX_EmergencyInfos_UserId ON EmergencyInfos (UserId);
