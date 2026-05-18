CREATE TABLE IF NOT EXISTS "SkillRating" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "skillId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SkillRating_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SkillRating_userId_skillId_key" ON "SkillRating"("userId", "skillId");
CREATE INDEX IF NOT EXISTS "SkillRating_skillId_idx" ON "SkillRating"("skillId");
CREATE INDEX IF NOT EXISTS "SkillRating_userId_idx" ON "SkillRating"("userId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'SkillRating_skillId_fkey'
  ) THEN
    ALTER TABLE "SkillRating"
      ADD CONSTRAINT "SkillRating_skillId_fkey"
      FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'SkillRating_userId_fkey'
  ) THEN
    ALTER TABLE "SkillRating"
      ADD CONSTRAINT "SkillRating_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
