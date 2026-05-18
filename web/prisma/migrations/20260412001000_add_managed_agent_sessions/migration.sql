CREATE TABLE "ManagedAgentSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "workflowRunId" TEXT,
  "providerSessionId" TEXT,
  "agentId" TEXT,
  "environmentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ManagedAgentSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ManagedAgentSession_workflowRunId_key" ON "ManagedAgentSession"("workflowRunId");
CREATE INDEX "ManagedAgentSession_userId_updatedAt_idx" ON "ManagedAgentSession"("userId", "updatedAt");
CREATE INDEX "ManagedAgentSession_type_idx" ON "ManagedAgentSession"("type");

ALTER TABLE "ManagedAgentSession"
ADD CONSTRAINT "ManagedAgentSession_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
