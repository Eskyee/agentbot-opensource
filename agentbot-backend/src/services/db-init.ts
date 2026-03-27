import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
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
  encrypted_private_key TEXT NOT NULL,
  balance_usdc NUMERIC DEFAULT 0,
  agent_id INTEGER REFERENCES agents(id) ON DELETE CASCADE,
  last_balance_check TIMESTAMPTZ,
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
  category TEXT NOT NULL,
  action TEXT,
  amount_usdc NUMERIC DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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
  status TEXT DEFAULT 'pending',
  proposed_price_usdc NUMERIC,
  final_price_usdc NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Model metrics (AI usage tracking)
CREATE TABLE IF NOT EXISTS model_metrics (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  agent_id INTEGER REFERENCES agents(id),
  model TEXT NOT NULL,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cost_usdc NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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
CREATE INDEX IF NOT EXISTS idx_social_campaigns_user_id ON social_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_social_campaigns_agent_id ON social_campaigns(agent_id);
CREATE INDEX IF NOT EXISTS idx_social_amplifications_campaign_id ON social_amplifications(campaign_id);
-- Metrics time-series indexes (range queries on sampled_at are the hot path)
CREATE INDEX IF NOT EXISTS idx_container_metrics_user_time ON container_metrics(user_id, sampled_at DESC);
CREATE INDEX IF NOT EXISTS idx_model_metrics_user ON model_metrics(user_id, created_at DESC);
-- Invite codes
CREATE INDEX IF NOT EXISTS idx_invite_codes_used ON invite_codes(used);
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
