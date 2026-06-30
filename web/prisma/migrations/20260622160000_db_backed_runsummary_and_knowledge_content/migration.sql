-- AlterTable: store knowledge document bytes in the DB (serverless FS is read-only)
ALTER TABLE "KnowledgeDocument" ADD COLUMN "content" BYTEA;

-- CreateTable
CREATE TABLE "AgentRunSummary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "steps" JSONB NOT NULL DEFAULT '[]',
    "results" JSONB NOT NULL DEFAULT '{}',
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentRunSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentRunSummary_userId_idx" ON "AgentRunSummary"("userId");

-- CreateIndex
CREATE INDEX "AgentRunSummary_agentId_idx" ON "AgentRunSummary"("agentId");
