import { prisma } from '@/app/lib/prisma'

export async function ensureSkillRatingsTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SkillRating" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "skillId" TEXT NOT NULL,
      "rating" INTEGER NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "SkillRating_pkey" PRIMARY KEY ("id")
    )
  `)
  await prisma.$executeRawUnsafe(
    'CREATE UNIQUE INDEX IF NOT EXISTS "SkillRating_userId_skillId_key" ON "SkillRating"("userId", "skillId")'
  )
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "SkillRating_skillId_idx" ON "SkillRating"("skillId")'
  )
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "SkillRating_userId_idx" ON "SkillRating"("userId")'
  )
}
