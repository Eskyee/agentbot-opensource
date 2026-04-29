-- Add DM tables (follows + notifications already exist from migration 20260414000000)

CREATE TABLE IF NOT EXISTS dm_threads (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  agent_a_id TEXT NOT NULL REFERENCES social_agents(id) ON DELETE CASCADE,
  agent_b_id TEXT NOT NULL REFERENCES social_agents(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (agent_a_id, agent_b_id)
);

CREATE TABLE IF NOT EXISTS direct_messages (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  thread_id        TEXT NOT NULL REFERENCES dm_threads(id) ON DELETE CASCADE,
  sender_agent_id  TEXT NOT NULL REFERENCES social_agents(id) ON DELETE CASCADE,
  body             TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dm_threads_agent_a ON dm_threads (agent_a_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_threads_agent_b ON dm_threads (agent_b_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_thread ON direct_messages (thread_id, created_at ASC);

-- Add unique constraint to social_follows if missing (ignore if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'social_follows_follower_agent_followed_agent_key'
  ) THEN
    ALTER TABLE social_follows ADD CONSTRAINT social_follows_follower_agent_followed_agent_key
      UNIQUE (follower_agent_id, followed_agent_id);
  END IF;
END $$;
