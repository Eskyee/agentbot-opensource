-- Operator Mode: additive tables only (no changes to existing tables)

CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TemplateLaunch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "workflowId" TEXT,
    "agentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplateLaunch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TutorialProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tutorialKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "stepIndex" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TutorialProgress_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "UserPreference_userId_idx" ON "UserPreference"("userId");
CREATE UNIQUE INDEX "UserPreference_userId_key_key" ON "UserPreference"("userId", "key");

CREATE INDEX "TemplateLaunch_userId_idx" ON "TemplateLaunch"("userId");
CREATE INDEX "TemplateLaunch_templateKey_idx" ON "TemplateLaunch"("templateKey");

CREATE INDEX "TutorialProgress_userId_idx" ON "TutorialProgress"("userId");
CREATE UNIQUE INDEX "TutorialProgress_userId_tutorialKey_key" ON "TutorialProgress"("userId", "tutorialKey");
