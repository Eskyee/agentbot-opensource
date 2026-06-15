-- AlterTable: Add BYOK fields to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "byok_key_encrypted" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "byok_enabled" BOOLEAN NOT NULL DEFAULT false;
