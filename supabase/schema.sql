-- ══════════════════════════════════════════════════════
-- GSD (Get Shit Done) — Database Schema
-- Run this in Supabase SQL Editor to create all tables
-- ══════════════════════════════════════════════════════

-- User config (single user, stores preferences and permanent memory)
CREATE TABLE IF NOT EXISTS user_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  password_hash TEXT NOT NULL DEFAULT '',
  display_name TEXT DEFAULT 'User',
  permanent_memory TEXT DEFAULT '',
  coach_system_prompt TEXT DEFAULT 'You are GSD Coach — a ruthless, no-BS accountability partner built into the "Get Shit Done" app.

PERSONALITY:
- You''re like a mix of David Goggins'' intensity with a strategic mentor''s intelligence
- Direct, sometimes harsh, but always in service of the user''s growth
- You don''t accept excuses. You acknowledge real obstacles but push through fake ones.
- You use occasional profanity naturally (not forced)
- You''re witty and sharp — not a generic motivational poster
- You remember everything. You reference past conversations, past failures, past wins.
- When the user is crushing it, you''re genuinely impressed (briefly) then push for more
- When the user is slacking, you call it out specifically with evidence from their own history

RULES:
- Never be generic. Always reference specific tasks, dates, patterns you know about.
- Keep messages punchy. 2-4 sentences max unless they ask for more.
- If they send a photo for verification, analyze it honestly. Don''t be a pushover.
- Track patterns.
- Use their stats.
- Morning check-ins: energetic, set the agenda
- Midday check-ins: progress audit, course-correct
- Evening check-ins: honest review, tomorrow''s plan',
  telegram_chat_id BIGINT,
  timezone TEXT DEFAULT 'America/Los_Angeles',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations (messages from both web + telegram)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('web', 'telegram', 'system')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Important memories extracted from conversations (Layer 3)
CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  importance INTEGER DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  category TEXT DEFAULT 'general',
  source_message_id UUID REFERENCES messages(id),
  last_accessed TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks and accountability tracking
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'awaiting_verification', 'verified', 'failed', 'skipped')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  category TEXT DEFAULT 'general',
  due_date TIMESTAMPTZ,
  scheduled_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  verification_type TEXT DEFAULT 'photo' CHECK (verification_type IN ('photo', 'video', 'text_explanation', 'auto')),
  verification_prompt TEXT,
  verification_result JSONB,
  verification_image_url TEXT,
  xp_reward INTEGER DEFAULT 10,
  xp_penalty INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ
);

-- Gamification stats
CREATE TABLE IF NOT EXISTS stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  tasks_failed INTEGER DEFAULT 0,
  tasks_verified INTEGER DEFAULT 0,
  daily_xp_log JSONB DEFAULT '[]',
  achievements JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduled check-ins configuration
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cron_expression TEXT NOT NULL,
  prompt_template TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_triggered TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_source ON messages(source);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_memories_importance ON memories(importance DESC);
CREATE INDEX IF NOT EXISTS idx_memories_last_accessed ON memories(last_accessed DESC);

-- Enable Supabase Realtime on key tables
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE stats;

-- Insert initial stats row
INSERT INTO stats (total_xp, level, current_streak, longest_streak, tasks_completed, tasks_failed, tasks_verified)
VALUES (0, 1, 0, 0, 0, 0, 0)
ON CONFLICT DO NOTHING;

-- Insert initial user_config row
INSERT INTO user_config (display_name, permanent_memory)
VALUES ('User', '')
ON CONFLICT DO NOTHING;
