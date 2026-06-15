ALTER TABLE "invite_codes"
  ADD COLUMN IF NOT EXISTS "email" TEXT,
  ADD COLUMN IF NOT EXISTS "audience" TEXT NOT NULL DEFAULT 'headliner',
  ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMPTZ(6);

CREATE INDEX IF NOT EXISTS "idx_invite_codes_audience" ON "invite_codes"("audience");
