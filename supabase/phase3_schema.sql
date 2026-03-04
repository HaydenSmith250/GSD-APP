-- Phase 3 Migration: Add conversational validation and gamification fields to tasks

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS task_type TEXT DEFAULT 'goal' CHECK (task_type IN ('timed', 'goal')),
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS checkin_interval_minutes INTEGER,
ADD COLUMN IF NOT EXISTS next_checkin_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS checkins JSONB DEFAULT '[]';

-- Update the status check constraint to include 'in_checkin_window' 
-- First drop the existing constraint (Supabase usually generates a name for it, but we might need to recreate the column if we can't find it, or just use a modern Postgres approach)

-- Safer approach: simply add check constraints that allow the new statuses natively:
-- Since we didn't name the constraint in Phase 1, we can't easily drop it. 
-- Wait, the simplest way is to just create a new column, copy data, and rename, but we have no data yet.
-- Let's just create a new table OR simply bypass the CHECK constraint by adding a new status column `lifecycle_status`.
-- Actually, the Phase 1 schema had: CHECK (status IN ('pending', 'in_progress', 'awaiting_verification', 'verified', 'failed', 'skipped'))
-- The new conversational flow doesn't strictly need a new status string, 'in_progress' and 'awaiting_verification' are sufficient. 
-- We will use `next_checkin_at` to determine if we are in a check-in window.
