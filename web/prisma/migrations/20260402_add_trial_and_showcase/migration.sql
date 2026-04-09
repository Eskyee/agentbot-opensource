-- Free trial support: 7-day trial for new signups
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(3);

-- Agent showcase opt-in: public gallery at /showcase
ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "showcaseOptIn" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "showcaseDescription" TEXT;

CREATE INDEX IF NOT EXISTS "Agent_showcaseOptIn_idx" ON "Agent"("showcaseOptIn");
