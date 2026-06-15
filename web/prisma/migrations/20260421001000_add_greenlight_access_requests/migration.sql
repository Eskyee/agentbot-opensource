CREATE TABLE "GreenlightAccessRequest" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "accessType" TEXT NOT NULL,
  "network" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "notes" TEXT,
  "planSnapshot" TEXT,
  "subscriptionSnapshot" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "GreenlightAccessRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GreenlightAccessRequest_userId_createdAt_idx"
  ON "GreenlightAccessRequest"("userId", "createdAt");

CREATE INDEX "GreenlightAccessRequest_status_createdAt_idx"
  ON "GreenlightAccessRequest"("status", "createdAt");

ALTER TABLE "GreenlightAccessRequest"
  ADD CONSTRAINT "GreenlightAccessRequest_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
