-- Migration: Add PaymentDueDate to AccommodationEntries
-- Date: 2026-03-11
-- Description: Adds optional PaymentDueDate column to AccommodationEntries table

ALTER TABLE [dbo].[AccommodationEntries]
    ADD [PaymentDueDate] DATETIME2 NULL;
GO

PRINT 'PaymentDueDate column added to AccommodationEntries successfully!';
GO
