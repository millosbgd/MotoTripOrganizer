-- Rollback: Remove NoteEntries table
-- Date: 2026-02-25
-- Description: Removes NoteEntries table if needed (rollback migration)

-- Drop indexes
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_NoteEntries_UpdatedByUserId' AND object_id = OBJECT_ID('NoteEntries'))
    DROP INDEX [IX_NoteEntries_UpdatedByUserId] ON [dbo].[NoteEntries];
GO

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_NoteEntries_CreatedByUserId' AND object_id = OBJECT_ID('NoteEntries'))
    DROP INDEX [IX_NoteEntries_CreatedByUserId] ON [dbo].[NoteEntries];
GO

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_NoteEntries_CreatedAt' AND object_id = OBJECT_ID('NoteEntries'))
    DROP INDEX [IX_NoteEntries_CreatedAt] ON [dbo].[NoteEntries];
GO

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_NoteEntries_TripId' AND object_id = OBJECT_ID('NoteEntries'))
    DROP INDEX [IX_NoteEntries_TripId] ON [dbo].[NoteEntries];
GO

-- Drop foreign keys
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_NoteEntries_Users_UpdatedByUserId')
    ALTER TABLE [dbo].[NoteEntries] DROP CONSTRAINT [FK_NoteEntries_Users_UpdatedByUserId];
GO

IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_NoteEntries_Users_CreatedByUserId')
    ALTER TABLE [dbo].[NoteEntries] DROP CONSTRAINT [FK_NoteEntries_Users_CreatedByUserId];
GO

IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_NoteEntries_Trips_TripId')
    ALTER TABLE [dbo].[NoteEntries] DROP CONSTRAINT [FK_NoteEntries_Trips_TripId];
GO

-- Drop table
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'NoteEntries')
    DROP TABLE [dbo].[NoteEntries];
GO

PRINT 'NoteEntries table removed successfully!';
GO
