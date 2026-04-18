import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,                      // max connections in pool
  idleTimeoutMillis: 30000,     // close idle clients after 30s
  connectionTimeoutMillis: 10000, // fail fast if can't connect in 10s
});

// Catch idle client errors — don't crash, pool reconnects automatically
pool.on('error', (err) => {
  console.error('[DB] Idle client error (non-fatal):', err.message);
});

const SCHEMA = `
-- Core tables
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'solo',
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallets (
  id SERIAL PRIMARY KEY,
  address TEXT UNIQUE NOT NULL,
  encrypted_private_key TEXT,              -- legacy column name (kept for compatibility)
  wallet_seed_encrypted TEXT,              -- CDP wallet metadata (encrypted)
  balance_usdc NUMERIC DEFAULT 0,
  user_id TEXT,                            -- owner user ID
  agent_id INTEGER REFERENCES agents(id) ON DELETE CASCADE,
  network TEXT DEFAULT 'base',             -- chain/network identifier
  wallet_type TEXT DEFAULT 'cdp',          -- cdp | local
  last_balance_check TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration: add columns that wallet.ts inserts (safe on existing DBs)
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS wallet_seed_encrypted TEXT;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS network TEXT DEFAULT 'base';
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS wallet_type TEXT DEFAULT 'cdp';

CREATE TABLE IF NOT EXISTS bitcoin_wallets (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  label TEXT,
  derivation_scheme_encrypted TEXT NOT NULL,
  network TEXT NOT NULL DEFAULT 'btc',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events & Treasury
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER REFERENCES agents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  venue TEXT,
  event_date TIMESTAMPTZ,
  ticket_price_usdc NUMERIC DEFAULT 0,
  total_tickets INTEGER DEFAULT 0,
  tickets_sold INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS treasury_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  agent_id INTEGER REFERENCES agents(id),
  type TEXT,                               -- transfer | coordination | orphan_wallet | etc.
  category TEXT NOT NULL DEFAULT 'general',
  action TEXT,
  description TEXT,                        -- human-readable description
  amount_usdc NUMERIC DEFAULT 0,
  tx_hash TEXT,                            -- on-chain transaction hash
  status TEXT DEFAULT 'confirmed',         -- confirmed | pending | failed | needs_reconciliation
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration: add columns used by bus.ts and wallet.ts (safe on existing DBs)
ALTER TABLE treasury_transactions ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE treasury_transactions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE treasury_transactions ADD COLUMN IF NOT EXISTS tx_hash TEXT;
ALTER TABLE treasury_transactions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'confirmed';

-- Royalty splits
CREATE TABLE IF NOT EXISTS royalty_splits (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER REFERENCES agents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  total_amount_usdc NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS royalty_recipients (
  id SERIAL PRIMARY KEY,
  split_id INTEGER REFERENCES royalty_splits(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  percentage NUMERIC NOT NULL,
  paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deployments
CREATE TABLE IF NOT EXISTS deployments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  agent_id INTEGER REFERENCES agents(id),
  status TEXT DEFAULT 'pending',
  render_service_id TEXT,
  subdomain TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings (negotiation service)
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER REFERENCES agents(id),
  event_id INTEGER REFERENCES events(id),
  talent_agent_id TEXT,              -- agent ID of the talent being booked (A2A)
  talent_name TEXT,                  -- display name of talent
  status TEXT DEFAULT 'pending',
  proposed_price_usdc NUMERIC,
  offer_amount_usdc NUMERIC,         -- alias used by negotiation service
  final_price_usdc NUMERIC,
  metadata JSONB DEFAULT '{}',       -- full offer payload
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social amplification
CREATE TABLE IF NOT EXISTS social_campaigns (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  agent_id INTEGER REFERENCES agents(id),
  platform TEXT NOT NULL,
  content TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social_amplifications (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES social_campaigns(id) ON DELETE CASCADE,
  partner_agent_id TEXT,
  reward_amount_usdc NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'requested',
  post_url TEXT,
  engagement_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API keys (hashed — raw key is never stored)
-- Insert rows here when issuing keys; validate with: SELECT user_id, plan FROM api_keys WHERE key_hash = $1 AND revoked = FALSE
CREATE TABLE IF NOT EXISTS api_keys (
  id BIGSERIAL PRIMARY KEY,
  key_hash TEXT UNIQUE NOT NULL,        -- SHA-256 hex of the raw Bearer token
  user_id TEXT NOT NULL,                -- owner
  plan TEXT NOT NULL DEFAULT 'solo',
  label TEXT,                           -- human-readable nickname (e.g. "prod key")
  revoked BOOLEAN NOT NULL DEFAULT FALSE,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash) WHERE revoked = FALSE;
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);

-- Invite codes (replaces in-memory inviteCodes map — survives restarts)
CREATE TABLE IF NOT EXISTS invite_codes (
  code TEXT PRIMARY KEY,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);
-- Backfill-safe: add expires_at for deployments that created the table before this column existed.
-- NULL expires_at means "never expires" (preserves existing codes).
ALTER TABLE invite_codes ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Agent registrations (replaces in-memory registrations map — survives restarts)
CREATE TABLE IF NOT EXISTS agent_registrations (
  user_id TEXT PRIMARY KEY,
  mode TEXT NOT NULL DEFAULT 'home',
  gateway_token TEXT,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active'
);

-- Container metrics: real time-series samples (replaces fabricated variance data)
-- Sampled on each metrics request and stored for historical queries.
CREATE TABLE IF NOT EXISTS container_metrics (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  container_name TEXT NOT NULL,
  cpu_percent NUMERIC,
  mem_percent NUMERIC,
  message_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  sampled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Correct model_metrics schema (ai.ts uses tier, latency_ms, success, source columns)
CREATE TABLE IF NOT EXISTS model_metrics (
  id BIGSERIAL PRIMARY KEY,
  model TEXT NOT NULL,
  tier TEXT,
  latency_ms INTEGER,
  success BOOLEAN,
  source TEXT,
  user_id TEXT,
  agent_id TEXT,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cost_usdc NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration: add columns missing from old schema (safe on existing DBs)
ALTER TABLE model_metrics ADD COLUMN IF NOT EXISTS tier TEXT;
ALTER TABLE model_metrics ADD COLUMN IF NOT EXISTS latency_ms INTEGER;
ALTER TABLE model_metrics ADD COLUMN IF NOT EXISTS success BOOLEAN;
ALTER TABLE model_metrics ADD COLUMN IF NOT EXISTS source TEXT;

-- Migration: bookings — add columns used by negotiation service (safe on existing DBs)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS talent_agent_id TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS talent_name TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS offer_amount_usdc NUMERIC;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Scheduled tasks (used by inline scheduler in scheduler.ts)
CREATE TABLE IF NOT EXISTS scheduled_tasks (
  id BIGSERIAL PRIMARY KEY,
  agent_id TEXT,
  user_id TEXT,
  config JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',   -- pending | running | completed | failed
  next_run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_due
  ON scheduled_tasks(status, next_run_at)
  WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS platform_jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  agent_id TEXT,
  lane TEXT NOT NULL DEFAULT 'deploy',
  job_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  priority INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error TEXT,
  payload JSONB NOT NULL DEFAULT '{}',
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_jobs_status_run_at
  ON platform_jobs(status, run_at, priority DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_platform_jobs_user_status
  ON platform_jobs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_platform_jobs_lane_status
  ON platform_jobs(lane, status);

-- Indexes for performance
-- Core FK indexes (prevent full-table scans on joins)
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_treasury_user_id ON treasury_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_treasury_agent_id ON treasury_transactions(agent_id);
CREATE INDEX IF NOT EXISTS idx_treasury_category ON treasury_transactions(category);
CREATE INDEX IF NOT EXISTS idx_events_agent_id ON events(agent_id);
CREATE INDEX IF NOT EXISTS idx_deployments_user_id ON deployments(user_id);
CREATE INDEX IF NOT EXISTS idx_deployments_agent_id ON deployments(agent_id);
CREATE INDEX IF NOT EXISTS idx_royalty_splits_agent_id ON royalty_splits(agent_id);
CREATE INDEX IF NOT EXISTS idx_royalty_recipients_split_id ON royalty_recipients(split_id);
CREATE INDEX IF NOT EXISTS idx_bookings_agent_id ON bookings(agent_id);
CREATE INDEX IF NOT EXISTS idx_bookings_event_id ON bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_wallets_agent_id ON wallets(agent_id);
CREATE INDEX IF NOT EXISTS idx_bitcoin_wallets_user_id ON bitcoin_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_bitcoin_wallets_agent_id ON bitcoin_wallets(agent_id);
CREATE INDEX IF NOT EXISTS idx_social_campaigns_user_id ON social_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_social_campaigns_agent_id ON social_campaigns(agent_id);
CREATE INDEX IF NOT EXISTS idx_social_amplifications_campaign_id ON social_amplifications(campaign_id);
-- Metrics time-series indexes (range queries on sampled_at are the hot path)
CREATE INDEX IF NOT EXISTS idx_container_metrics_user_time ON container_metrics(user_id, sampled_at DESC);
CREATE INDEX IF NOT EXISTS idx_model_metrics_user ON model_metrics(user_id, created_at DESC);
-- Invite codes
CREATE INDEX IF NOT EXISTS idx_invite_codes_used ON invite_codes(used);
-- Composite indexes for common query patterns (agent+date, agent+status, user+category)
CREATE INDEX IF NOT EXISTS idx_events_agent_date ON events(agent_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_agent_status ON bookings(agent_id, status);
CREATE INDEX IF NOT EXISTS idx_treasury_user_category ON treasury_transactions(user_id, category);
`;

export async function initDatabase(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.warn('[DB] DATABASE_URL not set — skipping schema initialization');
    return;
  }

  try {
    // Test connection before running schema
    const client = await pool.connect();
    console.log('[DB] Connection successful');
    client.release();

    console.log('[DB] Initializing database schema...');
    await pool.query(SCHEMA);
    console.log('[DB] Schema initialized successfully');
  } catch (error: any) {
    const errorInfo = {
      message: error.message || '(empty)',
      code: error.code || '(no code)',
      detail: error.detail || '(no detail)',
      host: error.address || '(unknown)',
      port: error.port || '(unknown)',
    };
    console.error('[DB] Schema initialization failed:', JSON.stringify(errorInfo));
    // Re-throw so callers can decide whether to abort startup
    throw error;
  }
}

export default initDatabase;
