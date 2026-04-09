/**
 * GET /api/gamification/profile
 * 
 * Get user's gamification profile (badges, points, level)
 */

import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { 
  getUserBadges, 
  getUserPoints, 
  calculateLevel, 
  getLeaderboard,
  BADGES 
} from '@/app/lib/gamification'
import { updateLoginStreak } from '@/app/lib/gamification'

export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Update login streak on each profile view (daily login)
    const { streak, badgeAwarded } = await updateLoginStreak(userId)

    // Get user data
    const [badges, points] = await Promise.all([
      getUserBadges(userId),
      getUserPoints(userId)
    ])

    const { level, title, nextLevel } = calculateLevel(points)

    // Get leaderboard (top 10)
    const leaderboard = await getLeaderboard(10)
    const userRank = leaderboard.findIndex(u => u.userId === userId) + 1

    return NextResponse.json({
      badges,
      points,
      level,
      title,
      nextLevel,
      progress: Math.round((points / nextLevel) * 100),
      streak,
      badgeAwarded,
      leaderboard: leaderboard.slice(0, 5), // Top 5
      userRank: userRank || null,
      availableBadges: BADGES.filter(b => !badges.find(ub => ub.id === b.id))
    })

  } catch (error) {
    console.error('[Gamification Profile] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
