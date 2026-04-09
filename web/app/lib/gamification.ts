/**
 * gamification.ts - Gamification System
 * 
 * Achievements, badges, levels, and rewards to engage users
 */

import { prisma } from './prisma'

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  category: 'onboarding' | 'usage' | 'social' | 'achievement'
  points: number
  condition: string
}

export interface UserStats {
  userId: string
  totalMessages: number
  totalAgents: number
  totalDeployments: number
  totalReferrals: number
  loginStreak: number
  lastLogin: Date
  points: number
  level: number
}

export const BADGES: Badge[] = [
  // Onboarding badges
  {
    id: 'onboarding_complete',
    name: 'Getting Started',
    description: 'Complete the onboarding process',
    icon: '🚀',
    category: 'onboarding',
    points: 100,
    condition: 'Complete all onboarding steps'
  },
  {
    id: 'first_agent',
    name: 'Agent Creator',
    description: 'Create your first AI agent',
    icon: '🤖',
    category: 'onboarding',
    points: 50,
    condition: 'Create 1 agent'
  },
  
  // Usage badges
  {
    id: 'message_100',
    name: 'Century Club',
    description: 'Send 100 messages through your agents',
    icon: '💬',
    category: 'usage',
    points: 100,
    condition: '100 messages'
  },
  {
    id: 'message_1000',
    name: 'Message Master',
    description: 'Send 1,000 messages through your agents',
    icon: '📨',
    category: 'usage',
    points: 500,
    condition: '1000 messages'
  },
  {
    id: 'agent_3',
    name: 'Agent Army',
    description: 'Create 3 agents',
    icon: '⚔️',
    category: 'usage',
    points: 150,
    condition: '3 agents'
  },
  {
    id: 'agent_10',
    name: 'Agent Overlord',
    description: 'Create 10 agents',
    icon: '👑',
    category: 'usage',
    points: 500,
    condition: '10 agents'
  },
  
  // Social badges
  {
    id: 'first_referral',
    name: 'Referrer',
    description: 'Refer your first user',
    icon: '🎁',
    category: 'social',
    points: 100,
    condition: '1 referral'
  },
  {
    id: 'referral_5',
    name: 'Influencer',
    description: 'Refer 5 users',
    icon: '🌟',
    category: 'social',
    points: 500,
    condition: '5 referrals'
  },
  
  // Achievement badges
  {
    id: 'login_streak_7',
    name: 'Week Warrior',
    description: 'Login 7 days in a row',
    icon: '🔥',
    category: 'achievement',
    points: 200,
    condition: '7 day streak'
  },
  {
    id: 'login_streak_30',
    name: 'Monthly Master',
    description: 'Login 30 days in a row',
    icon: '📅',
    category: 'achievement',
    points: 1000,
    condition: '30 day streak'
  },
  {
    id: 'early_adopter',
    name: 'Early Adopter',
    description: 'Joined during beta',
    icon: '🌅',
    category: 'achievement',
    points: 500,
    condition: 'Beta user'
  }
]

/**
 * Award a badge to a user
 */
export async function awardBadge(userId: string, badgeId: string): Promise<boolean> {
  const badge = BADGES.find(b => b.id === badgeId)
  if (!badge) return false

  // Check if already awarded
  const existing = await prisma.userSetting.findFirst({
    where: { userId, key: `badge_${badgeId}` }
  })

  if (existing) return false

  // Award badge
  await prisma.userSetting.create({
    data: {
      userId,
      key: `badge_${badgeId}`,
      value: JSON.stringify({
        awardedAt: new Date().toISOString(),
        points: badge.points
      })
    }
  })

  // Add points to user
  await addPoints(userId, badge.points)

  return true
}

/**
 * Get user's badges
 */
export async function getUserBadges(userId: string): Promise<Badge[]> {
  const badgeSettings = await prisma.userSetting.findMany({
    where: { 
      userId, 
      key: { startsWith: 'badge_' } 
    }
  })

  const badgeIds = badgeSettings.map(b => b.key.replace('badge_', ''))
  return BADGES.filter(b => badgeIds.includes(b.id))
}

/**
 * Add points to user
 */
export async function addPoints(userId: string, points: number): Promise<void> {
  const currentPoints = await getUserPoints(userId)
  const newPoints = currentPoints + points

  await prisma.userSetting.upsert({
    where: { userId_key: { userId, key: 'gamification_points' } },
    update: { value: String(newPoints) },
    create: {
      userId,
      key: 'gamification_points',
      value: String(newPoints)
    }
  })
}

/**
 * Get user's total points
 */
export async function getUserPoints(userId: string): Promise<number> {
  const setting = await prisma.userSetting.findFirst({
    where: { userId, key: 'gamification_points' }
  })

  return setting ? parseInt(setting.value) || 0 : 0
}

/**
 * Calculate user level based on points
 */
export function calculateLevel(points: number): { level: number; title: string; nextLevel: number } {
  const levels = [
    { min: 0, title: 'Newcomer' },
    { min: 100, title: 'Beginner' },
    { min: 500, title: 'Intermediate' },
    { min: 1000, title: 'Advanced' },
    { min: 2500, title: 'Expert' },
    { min: 5000, title: 'Master' },
    { min: 10000, title: 'Legend' }
  ]

  let level = 1
  let title = levels[0].title
  let nextLevel = 100

  for (let i = levels.length - 1; i >= 0; i--) {
    if (points >= levels[i].min) {
      level = i + 1
      title = levels[i].title
      nextLevel = i < levels.length - 1 ? levels[i + 1].min : levels[i].min * 2
      break
    }
  }

  return { level, title, nextLevel }
}

/**
 * Update login streak
 */
export async function updateLoginStreak(userId: string): Promise<{ streak: number; badgeAwarded?: string }> {
  const lastLoginSetting = await prisma.userSetting.findFirst({
    where: { userId, key: 'last_login' }
  })

  const now = new Date()
  let streak = 1

  if (lastLoginSetting) {
    const lastLogin = new Date(lastLoginSetting.value)
    const diffDays = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      // Consecutive day
      const streakSetting = await prisma.userSetting.findFirst({
        where: { userId, key: 'login_streak' }
      })
      streak = streakSetting ? parseInt(streakSetting.value) + 1 : 1
    } else if (diffDays > 1) {
      // Streak broken
      streak = 1
    } else {
      // Same day, maintain streak
      const streakSetting = await prisma.userSetting.findFirst({
        where: { userId, key: 'login_streak' }
      })
      streak = streakSetting ? parseInt(streakSetting.value) : 1
    }
  }

  // Update streak
  await prisma.userSetting.upsert({
    where: { userId_key: { userId, key: 'login_streak' } },
    update: { value: String(streak) },
    create: { userId, key: 'login_streak', value: String(streak) }
  })

  // Update last login
  await prisma.userSetting.upsert({
    where: { userId_key: { userId, key: 'last_login' } },
    update: { value: now.toISOString() },
    create: { userId, key: 'last_login', value: now.toISOString() }
  })

  // Check for streak badges
  let badgeAwarded: string | undefined
  if (streak >= 30) {
    const awarded = await awardBadge(userId, 'login_streak_30')
    if (awarded) badgeAwarded = 'login_streak_30'
  } else if (streak >= 7) {
    const awarded = await awardBadge(userId, 'login_streak_7')
    if (awarded) badgeAwarded = 'login_streak_7'
  }

  return { streak, badgeAwarded }
}

/**
 * Get leaderboard (top users by points)
 */
export async function getLeaderboard(limit: number = 10): Promise<Array<{
  userId: string
  name: string
  points: number
  level: number
  title: string
}>> {
  // Get all users with points
  const usersWithPoints = await prisma.userSetting.findMany({
    where: { key: 'gamification_points' },
    orderBy: { value: 'desc' },
    take: limit,
    include: { user: { select: { id: true, name: true } } }
  })

  return usersWithPoints.map(setting => {
    const points = parseInt(setting.value) || 0
    const { level, title } = calculateLevel(points)
    return {
      userId: setting.userId,
      name: setting.user?.name || 'Anonymous',
      points,
      level,
      title
    }
  })
}

/**
 * Check and award badges based on conditions
 */
export async function checkAndAwardBadges(userId: string): Promise<string[]> {
  const awarded: string[] = []

  // Get user stats
  const agentCount = await prisma.agent.count({ where: { userId } })
  const points = await getUserPoints(userId)

  // Check agent badges
  if (agentCount >= 10) {
    if (await awardBadge(userId, 'agent_10')) awarded.push('agent_10')
  } else if (agentCount >= 3) {
    if (await awardBadge(userId, 'agent_3')) awarded.push('agent_3')
  } else if (agentCount >= 1) {
    if (await awardBadge(userId, 'first_agent')) awarded.push('first_agent')
  }

  // Check message badges (would need message count from somewhere)
  // This is a placeholder - you'd need to track messages

  // Check referral badges
  const referralCount = await prisma.referral.count({ where: { referrerId: userId } })
  if (referralCount >= 5) {
    if (await awardBadge(userId, 'referral_5')) awarded.push('referral_5')
  } else if (referralCount >= 1) {
    if (await awardBadge(userId, 'first_referral')) awarded.push('first_referral')
  }

  return awarded
}
