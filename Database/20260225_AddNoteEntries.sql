-- Migration: Add NoteEntries table
-- Date: 2026-02-25
-- Description: Creates NoteEntries table for trip notes with user tracking

-- Create NoteEntries table
CREATE TABLE [dbo].[NoteEntries] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [TripId] INT NOT NULL,
    [Content] NVARCHAR(MAX) NOT NULL,
    [CreatedByUserId] INT NOT NULL,
    [UpdatedByUserId] INT NULL,
    [CreatedAt] DATETIME2 NOT NULL,
    [UpdatedAt] DATETIME2 NULL,
    [RowVersion] ROWVERSION NOT NULL,
    CONSTRAINT [PK_NoteEntries] PRIMARY KEY CLUSTERED ([Id] ASC)
);
GO

-- Add foreign key to Trips table
ALTER TABLE [dbo].[NoteEntries]
    ADD CONSTRAINT [FK_NoteEntries_Trips_TripId] 
    FOREIGN KEY([TripId]) 
    REFERENCES [dbo].[Trips] ([Id]) 
    ON DELETE CASCADE;
GO

-- Add foreign key to Users table for CreatedByUserId
ALTER TABLE [dbo].[NoteEntries]
    ADD CONSTRAINT [FK_NoteEntries_Users_CreatedByUserId] 
    FOREIGN KEY([CreatedByUserId]) 
    REFERENCES [dbo].[Users] ([Id]);
GO

-- Add foreign key to Users table for UpdatedByUserId
ALTER TABLE [dbo].[NoteEntries]
    ADD CONSTRAINT [FK_NoteEntries_Users_UpdatedByUserId] 
    FOREIGN KEY([UpdatedByUserId]) 
    REFERENCES [dbo].[Users] ([Id]);
GO

-- Create index on TripId for faster queries
CREATE NONCLUSTERED INDEX [IX_NoteEntries_TripId] 
    ON [dbo].[NoteEntries]([TripId] ASC);
GO

-- Create index on CreatedAt for sorting
CREATE NONCLUSTERED INDEX [IX_NoteEntries_CreatedAt] 
    ON [dbo].[NoteEntries]([CreatedAt] ASC);
GO

-- Create index on CreatedByUserId
CREATE NONCLUSTERED INDEX [IX_NoteEntries_CreatedByUserId] 
    ON [dbo].[NoteEntries]([CreatedByUserId] ASC);
GO

-- Create index on UpdatedByUserId
CREATE NONCLUSTERED INDEX [IX_NoteEntries_UpdatedByUserId] 
    ON [dbo].[NoteEntries]([UpdatedByUserId] ASC) 
    WHERE [UpdatedByUserId] IS NOT NULL;
GO

PRINT 'NoteEntries table created successfully!';
GO
