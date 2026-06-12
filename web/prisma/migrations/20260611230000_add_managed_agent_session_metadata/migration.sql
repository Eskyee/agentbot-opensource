-- AlterTable: ManagedAgentSession — add metadata used by coding-agent and invoice
-- sessions, and defaults for id/title so application-level creates succeed.
-- All changes are additive / default-only; no data is modified or dropped.
ALTER TABLE "ManagedAgentSession" ADD COLUMN IF NOT EXISTS "metadata" JSONB DEFAULT '{}';
ALTER TABLE "ManagedAgentSession" ALTER COLUMN "title" SET DEFAULT '';
