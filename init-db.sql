-- Agentbot Database Schema
-- Initial setup for agents, deployments, and users

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  name VARCHAR(255),
  plan VARCHAR(50) DEFAULT 'free',
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  subscription_status VARCHAR(50) DEFAULT 'inactive',
  subscription_start_date TIMESTAMP,
  subscription_end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  config JSONB,
  status VARCHAR(50) DEFAULT 'inactive',
  verified BOOLEAN DEFAULT FALSE,
  verification_type VARCHAR(50),
  attestation_uid VARCHAR(255),
  verifier_address VARCHAR(255),
  verified_at TIMESTAMP,
  verification_metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS deployments (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER REFERENCES agents(id) ON DELETE CASCADE,
  version VARCHAR(50),
  subdomain VARCHAR(255) UNIQUE,
  container_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deployed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  key_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_deployments_agent_id ON deployments(agent_id);
CREATE INDEX idx_deployments_status ON deployments(status);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);

-- Wallet storage for CDP wallets
-- Stores encrypted wallet seeds for user agents
CREATE TABLE IF NOT EXISTS wallets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  address VARCHAR(255) UNIQUE NOT NULL,
  wallet_seed_encrypted TEXT NOT NULL,
  network VARCHAR(50) DEFAULT 'base-mainnet', -- Updated to default mainnet
  wallet_type VARCHAR(50) DEFAULT 'cdp',
  balance_usdc DECIMAL(20, 6) DEFAULT 0,
  last_balance_check TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Underground Culture: Events Table
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER REFERENCES agents(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  venue VARCHAR(255),
  event_date TIMESTAMP NOT NULL,
  ticket_price_usdc DECIMAL(20, 6) DEFAULT 0,
  total_tickets INTEGER DEFAULT 0,
  tickets_sold INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'draft', -- draft, published, completed, cancelled
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Underground Culture: Treasury & Transactions
CREATE TABLE IF NOT EXISTS treasury_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  agent_id INTEGER REFERENCES agents(id),
  type VARCHAR(50) NOT NULL, -- income, expense, split, transfer
  category VARCHAR(50), -- tickets, booking, royalty, equipment
  amount_usdc DECIMAL(20, 6) NOT NULL,
  tx_hash VARCHAR(255) UNIQUE,
  description TEXT,
  metadata JSONB,
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, failed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Underground Culture: Royalty Splits
CREATE TABLE IF NOT EXISTS royalty_splits (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER REFERENCES agents(id) ON DELETE CASCADE,
  name VARCHAR(255),
  total_amount_usdc DECIMAL(20, 6),
  tx_hash VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS royalty_recipients (
  id SERIAL PRIMARY KEY,
  split_id INTEGER REFERENCES royalty_splits(id) ON DELETE CASCADE,
  wallet_address VARCHAR(255) NOT NULL,
  share_percentage DECIMAL(5, 2) NOT NULL, -- e.g. 40.00
  amount_usdc DECIMAL(20, 6),
  paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_events_agent_id ON events(agent_id);
CREATE INDEX idx_treasury_user_id ON treasury_transactions(user_id);
CREATE INDEX idx_treasury_agent_id ON treasury_transactions(agent_id);
CREATE INDEX idx_royalty_splits_agent_id ON royalty_splits(agent_id);
CREATE INDEX idx_royalty_recipients_split_id ON royalty_recipients(split_id);

-- Insert sample data for development
-- WARNING: Remove this in production! Demo credentials should never be used.
-- This is for local development only.
-- Note: The password hash below is intentionally incomplete for development.
-- In a real application, create users through the API with proper password hashing.
-- INSERT INTO users (email, password_hash) VALUES
--   ('demo@agentbot.com', 'use-api-to-create-users') 
-- ON CONFLICT (email) DO NOTHING;
