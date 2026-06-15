CREATE TABLE "PlaygroundProject" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IDLE',
    "template" TEXT NOT NULL DEFAULT 'VITE-REACT-TS',
    "model" TEXT,
    "provider" TEXT,
    "prompt" TEXT,
    "publishedUrl" TEXT,
    "deploymentProvider" TEXT,
    "deploymentId" TEXT,
    "deploymentState" TEXT,
    "generation" JSONB,
    "archivedAt" TIMESTAMP(3),
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlaygroundProject_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PlaygroundProject_userId_idx" ON "PlaygroundProject"("userId");
CREATE INDEX "PlaygroundProject_userId_status_idx" ON "PlaygroundProject"("userId", "status");
CREATE INDEX "PlaygroundProject_lastActiveAt_idx" ON "PlaygroundProject"("lastActiveAt");

ALTER TABLE "PlaygroundProject" ADD CONSTRAINT "PlaygroundProject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
