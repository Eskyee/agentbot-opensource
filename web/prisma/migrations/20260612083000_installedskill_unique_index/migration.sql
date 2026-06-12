-- AlterTable: InstalledSkill — add the compound unique index that schema.prisma
-- declares (@@unique([userId, agentId, skillId])) but the live table was missing.
-- Required for findUnique(userId_agentId_skillId) dedupe + P2002 handling in
-- app/api/skills/route.ts. Applied to production 2026-06-12 (no duplicates existed).
CREATE UNIQUE INDEX IF NOT EXISTS "InstalledSkill_userId_agentId_skillId_key"
  ON "InstalledSkill"("userId", "agentId", "skillId");
