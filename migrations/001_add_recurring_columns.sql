-- Migration: Add recurring transaction columns to expenses table
-- Run this in the Supabase SQL editor (Database > SQL Editor) to fix the
-- PGRST204 "column not found in schema cache" error.

-- Add is_recurring column (defaults to false for existing rows)
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;

-- Add recurrence_interval column (NULL for non-recurring rows)
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS recurrence_interval TEXT;

-- Add last_recurrence_date column (NULL for non-recurring rows)
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS last_recurrence_date TEXT;

-- Verify the changes (optional – run separately to confirm)
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'expenses' ORDER BY ordinal_position;
