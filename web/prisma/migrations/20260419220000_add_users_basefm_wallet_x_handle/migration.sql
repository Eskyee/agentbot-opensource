-- Fixes production schema drift: Prisma schema declared these columns on `users`
-- but no migration ever created them, so baseFM wallet save and X handle save
-- fail with Prisma P2022 "column does not exist" on UPDATE.
--
-- Both columns are nullable with no default — purely additive, zero-risk,
-- no backfill required. Existing rows are untouched.

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "basefm_wallet" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "x_handle" TEXT;
