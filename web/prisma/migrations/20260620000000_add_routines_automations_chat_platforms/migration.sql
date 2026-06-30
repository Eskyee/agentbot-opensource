-- CreateTable
CREATE TABLE "Routine" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "prompt" TEXT NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'openrouter/auto',
    "status" TEXT NOT NULL DEFAULT 'active',
    "repositories" JSONB NOT NULL DEFAULT '[]',
    "connectors" JSONB NOT NULL DEFAULT '[]',
    "environment" JSONB NOT NULL DEFAULT '{}',
    "triggers" JSONB NOT NULL DEFAULT '[]',
    "lastRunAt" TIMESTAMP(3),
    "runCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Routine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutineRun" (
    "id" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "trigger" TEXT NOT NULL,
    "input" TEXT,
    "output" TEXT,
    "error" TEXT,
    "duration" INTEGER,
    "tokensUsed" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "RoutineRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Automation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "triggers" JSONB NOT NULL DEFAULT '[]',
    "conditions" JSONB NOT NULL DEFAULT '[]',
    "action" JSONB NOT NULL DEFAULT '{}',
    "mcpServers" JSONB NOT NULL DEFAULT '[]',
    "acuLimit" INTEGER,
    "invocationLimit" INTEGER,
    "invocationWindow" TEXT,
    "lastFiredAt" TIMESTAMP(3),
    "fireCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Automation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationRun" (
    "id" TEXT NOT NULL,
    "automationId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "triggerType" TEXT NOT NULL,
    "triggerPayload" JSONB,
    "output" TEXT,
    "error" TEXT,
    "duration" INTEGER,
    "sessionId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AutomationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatPlatformConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "credentials" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'connected',
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatPlatformConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "McpServer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'connected',
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "McpServer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Routine_userId_idx" ON "Routine"("userId");

-- CreateIndex
CREATE INDEX "Routine_userId_status_idx" ON "Routine"("userId", "status");

-- CreateIndex
CREATE INDEX "RoutineRun_routineId_idx" ON "RoutineRun"("routineId");

-- CreateIndex
CREATE INDEX "RoutineRun_routineId_startedAt_idx" ON "RoutineRun"("routineId", "startedAt");

-- CreateIndex
CREATE INDEX "Automation_userId_idx" ON "Automation"("userId");

-- CreateIndex
CREATE INDEX "Automation_userId_status_idx" ON "Automation"("userId", "status");

-- CreateIndex
CREATE INDEX "AutomationRun_automationId_idx" ON "AutomationRun"("automationId");

-- CreateIndex
CREATE INDEX "AutomationRun_automationId_startedAt_idx" ON "AutomationRun"("automationId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ChatPlatformConnection_userId_platform_key" ON "ChatPlatformConnection"("userId", "platform");

-- CreateIndex
CREATE INDEX "ChatPlatformConnection_userId_idx" ON "ChatPlatformConnection"("userId");

-- CreateIndex
CREATE INDEX "McpServer_userId_idx" ON "McpServer"("userId");

-- AddForeignKey
ALTER TABLE "Routine" ADD CONSTRAINT "Routine_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineRun" ADD CONSTRAINT "RoutineRun_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "Routine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Automation" ADD CONSTRAINT "Automation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationRun" ADD CONSTRAINT "AutomationRun_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "Automation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatPlatformConnection" ADD CONSTRAINT "ChatPlatformConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "McpServer" ADD CONSTRAINT "McpServer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
