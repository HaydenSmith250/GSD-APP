-- Migration: Add recurring_pattern to tasks
-- Run this in the Supabase SQL Editor

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS recurring_pattern TEXT CHECK (recurring_pattern IN ('daily', 'weekdays', 'weekly'));
