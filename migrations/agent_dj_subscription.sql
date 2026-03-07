-- Agent DJ Subscription System
-- Allows agents to follow human DJs and get notified when they go live

-- Table: Agent subscriptions to DJs
CREATE TABLE "AgentDJFollows" (
    "id" TEXT PRIMARY KEY DEFAULT cuid(),
    "agentId" TEXT NOT NULL,
    "djWalletAddress" TEXT NOT NULL,
    "djName" TEXT,
    "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique constraint: one subscription per agent per DJ
CREATE UNIQUE INDEX "AgentDJFollows_agentId_djWalletAddress_unique" 
ON "AgentDJFollows"("agentId", "djWalletAddress");

-- Table: Stream listening activity log
CREATE TABLE "AgentStreamActivity" (
    "id" TEXT PRIMARY KEY DEFAULT cuid(),
    "agentId" TEXT NOT NULL,
    "djWalletAddress" TEXT NOT NULL,
    "djName" TEXT,
    "streamId" TEXT NOT NULL,
    "playbackId" TEXT,
    "hlsUrl" TEXT,
    "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "startedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "endedAt" TIMESTAMP WITH TIME ZONE,
    "durationSeconds" INTEGER
);

-- Index for querying activity by agent
CREATE INDEX "AgentStreamActivity_agentId_idx" 
ON "AgentStreamActivity"("agentId");

-- Index for querying activity by user
CREATE INDEX "AgentStreamActivity_userId_idx" 
ON "AgentStreamActivity"("userId");
