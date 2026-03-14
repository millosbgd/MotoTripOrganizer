-- Migration: Add IsPublic column to NoteEntries
-- Date: 2026-03-14
-- Description: Adds IsPublic flag to NoteEntries - public notes visible to all trip members,
--              private notes visible only to the creator.

ALTER TABLE NoteEntries
ADD IsPublic BIT NOT NULL DEFAULT 0;
