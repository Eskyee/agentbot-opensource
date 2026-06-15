-- Usage tracking for cost dashboard
CREATE TABLE IF NOT EXISTS usage_logs (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  agent_id VARCHAR(255) NOT NULL,
  model VARCHAR(100) NOT NULL,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cost_usd DECIMAL(10, 6) DEFAULT 0,
  endpoint VARCHAR(255),
  latency_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for dashboard queries
CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_agent_id ON usage_logs(agent_id);
CREATE INDEX idx_usage_logs_created_at ON usage_logs(created_at);
CREATE INDEX idx_usage_logs_user_created ON usage_logs(user_id, created_at);
CREATE INDEX idx_usage_logs_agent_created ON usage_logs(agent_id, created_at);

-- Add to Prisma schema
