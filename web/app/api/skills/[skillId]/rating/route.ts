import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { ensureSkillRatingsTable } from '@/app/lib/skillRatings'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ skillId: string }> }
) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Sign in to rate skills' }, { status: 401 })
  }

  try {
    const { skillId } = await params
    const body = await request.json().catch(() => ({}))
    const rating = Number(body?.rating)

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be a whole number from 1 to 5' }, { status: 400 })
    }

    const skill = await prisma.skill.findUnique({
      where: { id: skillId },
      select: { id: true },
    })
    if (!skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 })
    }

    await ensureSkillRatingsTable()
    await prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO "SkillRating" ("id", "userId", "skillId", "rating", "createdAt", "updatedAt")
        VALUES (${crypto.randomUUID()}, ${session.user.id}, ${skillId}, ${rating}, NOW(), NOW())
        ON CONFLICT ("userId", "skillId")
        DO UPDATE SET "rating" = EXCLUDED."rating", "updatedAt" = NOW()
      `
    )

    const [summary] = await prisma.$queryRaw<Array<{ rating: number | null; ratingCount: bigint | number }>>(
      Prisma.sql`
        SELECT AVG("rating")::float AS "rating", COUNT(*) AS "ratingCount"
        FROM "SkillRating"
        WHERE "skillId" = ${skillId}
      `
    )
    const averageRating = summary?.rating ? Number(summary.rating.toFixed(1)) : 0
    const ratingCount = Number(summary?.ratingCount || 0)

    await prisma.skill.update({
      where: { id: skillId },
      data: { rating: averageRating },
    })

    return NextResponse.json({
      success: true,
      skillId,
      userRating: rating,
      rating: averageRating,
      ratingCount,
    })
  } catch (error) {
    console.error('[skill-rating] error:', error)
    return NextResponse.json({ error: 'Failed to save rating' }, { status: 500 })
  }
}
