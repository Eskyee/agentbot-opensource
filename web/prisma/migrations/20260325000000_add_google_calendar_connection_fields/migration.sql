-- Persist Google Calendar credentials on User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleCalendarAccessToken" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleCalendarRefreshToken" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleCalendarId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleCalendarTimezone" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleCalendarTokenExpiresAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleCalendarConnectedAt" TIMESTAMP(3);
