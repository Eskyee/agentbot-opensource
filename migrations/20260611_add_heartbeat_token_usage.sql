-- Migration: Add Heartbeat and TokenUsage tables for dashboard monitoring
-- Run this against your Neon database

CREATE TABLE IF NOT EXISTS "Heartbeat" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "port" INTEGER,
    "uptime" TEXT,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Heartbeat_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Heartbeat_agentId_key" ON "Heartbeat"("agentId");
CREATE INDEX IF NOT EXISTS "Heartbeat_userId_idx" ON "Heartbeat"("userId");
CREATE INDEX IF NOT EXISTS "Heartbeat_agentId_lastSeen_idx" ON "Heartbeat"("agentId", "lastSeen");
CREATE INDEX IF NOT EXISTS "Heartbeat_status_idx" ON "Heartbeat"("status");

CREATE TABLE IF NOT EXISTS "TokenUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agentId" TEXT,
    "model" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'openrouter',
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "latencyMs" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TokenUsage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "TokenUsage_userId_idx" ON "TokenUsage"("userId");
CREATE INDEX IF NOT EXISTS "TokenUsage_model_idx" ON "TokenUsage"("model", "createdAt");
CREATE INDEX IF NOT EXISTS "TokenUsage_provider_idx" ON "TokenUsage"("provider");
CREATE INDEX IF NOT EXISTS "TokenUsage_createdAt_idx" ON "TokenUsage"("createdAt");
CREATE INDEX IF NOT EXISTS "TokenUsage_userId_createdAt_idx" ON "TokenUsage"("userId", "createdAt");
