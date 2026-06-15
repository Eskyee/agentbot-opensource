-- Multi-Tenant Row-Level Security Migration
-- Run: npx prisma migrate dev --name add-rls

-- Step 1: Create a function to set current user context
CREATE OR REPLACE FUNCTION set_current_user_id(user_id TEXT)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id, true);
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create a function to get current user context
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.current_user_id', true);
END;
$$ LANGUAGE plpgsql;

-- Step 3: Enable RLS on all user-scoped tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Agent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ScheduledTask" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AgentMemory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AgentFile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InstalledSkill" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AgentSwarm" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Workflow" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Wallet" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ApiKey" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies (users can only see their own data)
-- User table: users can only see/update themselves
CREATE POLICY user_isolation ON "User"
  USING (id = get_current_user_id());

-- Agent table
CREATE POLICY agent_isolation ON "Agent"
  USING ("userId" = get_current_user_id());

-- ScheduledTask table
CREATE POLICY task_isolation ON "ScheduledTask"
  USING ("userId" = get_current_user_id());

-- AgentMemory table
CREATE POLICY memory_isolation ON "AgentMemory"
  USING ("userId" = get_current_user_id());

-- AgentFile table
CREATE POLICY file_isolation ON "AgentFile"
  USING ("userId" = get_current_user_id());

-- InstalledSkill table
CREATE POLICY skill_isolation ON "InstalledSkill"
  USING ("userId" = get_current_user_id());

-- AgentSwarm table
CREATE POLICY swarm_isolation ON "AgentSwarm"
  USING ("userId" = get_current_user_id());

-- Workflow table
CREATE POLICY workflow_isolation ON "Workflow"
  USING ("userId" = get_current_user_id());

-- Wallet table
CREATE POLICY wallet_isolation ON "Wallet"
  USING ("userId" = get_current_user_id());

-- ApiKey table
CREATE POLICY apikey_isolation ON "ApiKey"
  USING ("userId" = get_current_user_id());

-- Account table
CREATE POLICY account_isolation ON "Account"
  USING ("userId" = get_current_user_id());

-- Session table
CREATE POLICY session_isolation ON "Session"
  USING ("userId" = get_current_user_id());

-- Step 5: Create admin bypass (admins see everything)
CREATE POLICY admin_bypass ON "User"
  USING (
    get_current_user_id() IN (
      SELECT id FROM "User" WHERE role = 'admin'
    )
  );

-- Step 6: Create indexes for RLS performance
CREATE INDEX IF NOT EXISTS idx_agent_user_id ON "Agent"("userId");
CREATE INDEX IF NOT EXISTS idx_task_user_id ON "ScheduledTask"("userId");
CREATE INDEX IF NOT EXISTS idx_memory_user_id ON "AgentMemory"("userId");
CREATE INDEX IF NOT EXISTS idx_file_user_id ON "AgentFile"("userId");
CREATE INDEX IF NOT EXISTS idx_skill_user_id ON "InstalledSkill"("userId");
CREATE INDEX IF NOT EXISTS idx_swarm_user_id ON "AgentSwarm"("userId");
CREATE INDEX IF NOT EXISTS idx_workflow_user_id ON "Workflow"("userId");
CREATE INDEX IF NOT EXISTS idx_wallet_user_id ON "Wallet"("userId");
CREATE INDEX IF NOT EXISTS idx_apikey_user_id ON "ApiKey"("userId");
