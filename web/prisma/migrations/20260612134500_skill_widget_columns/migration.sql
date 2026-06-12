-- AlterTable: Skill — add widget columns declared in schema.prisma but missing
-- from the live database. Their absence made every /api/skills SELECT throw,
-- forcing the fallback catalog (fake default-N ids) and breaking installs.
ALTER TABLE "Skill" ADD COLUMN IF NOT EXISTS "widgetUrl" TEXT;
ALTER TABLE "Skill" ADD COLUMN IF NOT EXISTS "widgetConfig" JSONB;

-- Skill.name is @unique in schema.prisma but the live table lacked the
-- constraint, so ensureSkillsSeeded()'s upsert failed with 42P10 (no unique
-- constraint matching ON CONFLICT) on every request — the primary cause of
-- the fallback catalog. No duplicate names existed when applied.
CREATE UNIQUE INDEX IF NOT EXISTS "Skill_name_key" ON "Skill"(name);
