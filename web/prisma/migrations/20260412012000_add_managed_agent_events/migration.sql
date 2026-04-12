CREATE TABLE "ManagedAgentEvent" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ManagedAgentEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ManagedAgentEvent_eventId_key" ON "ManagedAgentEvent"("eventId");
CREATE INDEX "ManagedAgentEvent_sessionId_occurredAt_idx" ON "ManagedAgentEvent"("sessionId", "occurredAt");

ALTER TABLE "ManagedAgentEvent"
ADD CONSTRAINT "ManagedAgentEvent_sessionId_fkey"
FOREIGN KEY ("sessionId") REFERENCES "ManagedAgentSession"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
