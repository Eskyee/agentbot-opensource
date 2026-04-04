/**
 * notifications.ts - Real-time Notification System
 * 
 * In-app notifications for user engagement
 */

import { prisma } from './prisma'

export type NotificationType = 
  | 'achievement' 
  | 'badge' 
  | 'referral' 
  | 'system'
  | 'agent'
  | 'message'
  | 'billing'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  data?: Record<string, any>
  createdAt: Date
}

export interface NotificationPreferences {
  email: boolean
  push: boolean
  inApp: boolean
  types: Record<NotificationType, boolean>
}

/**
 * Create a notification
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  data
}: {
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
}): Promise<Notification> {
  const notification = await prisma.$executeRaw`
    INSERT INTO notifications (id, user_id, type, title, message, read, data, created_at)
    VALUES (${crypto.randomUUID()}, ${userId}, ${type}, ${title}, ${message}, false, ${JSON.stringify(data || {})}, NOW())
    RETURNING *
  `

  // In a real implementation, you'd emit to WebSocket here
  // emitNotification(userId, notification)

  return {
    id: crypto.randomUUID(),
    userId,
    type,
    title,
    message,
    read: false,
    data,
    createdAt: new Date()
  }
}

/**
 * Get user's notifications
 */
export async function getNotifications(
  userId: string, 
  options: { unreadOnly?: boolean; limit?: number } = {}
): Promise<Notification[]> {
  const { unreadOnly = false, limit = 20 } = options

  const notifications = await prisma.$queryRaw<Notification[]>`
    SELECT 
      id,
      user_id as "userId",
      type,
      title,
      message,
      read,
      data::text as "data",
      created_at as "createdAt"
    FROM notifications
    WHERE user_id = ${userId}
    ${unreadOnly ? 'AND read = false' : ''}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `

  return notifications.map(n => ({
    ...n,
    data: n.data ? JSON.parse(String(n.data)) : undefined,
    createdAt: new Date(n.createdAt)
  }))
}

/**
 * Mark notification as read
 */
export async function markAsRead(userId: string, notificationId: string): Promise<void> {
  await prisma.$executeRaw`
    UPDATE notifications
    SET read = true
    WHERE id = ${notificationId} AND user_id = ${userId}
  `
}

/**
 * Mark all as read
 */
export async function markAllAsRead(userId: string): Promise<void> {
  await prisma.$executeRaw`
    UPDATE notifications
    SET read = true
    WHERE user_id = ${userId} AND read = false
  `
}

/**
 * Get unread count
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const result = await prisma.$queryRaw<{ count: number }[]>`
    SELECT COUNT(*) as count
    FROM notifications
    WHERE user_id = ${userId} AND read = false
  `

  return Number(result[0]?.count || 0)
}

/**
 * Delete old notifications (cleanup)
 */
export async function deleteOldNotifications(days: number = 30): Promise<number> {
  const result = await prisma.$executeRaw`
    DELETE FROM notifications
    WHERE created_at < NOW() - INTERVAL '${days} days'
    AND read = true
  `

  return result
}

/**
 * Notification helpers for common events
 */

export async function notifyBadgeAwarded(userId: string, badgeName: string, badgeIcon: string): Promise<void> {
  await createNotification({
    userId,
    type: 'badge',
    title: 'New Badge Earned!',
    message: `You earned the ${badgeIcon} ${badgeName} badge!`,
    data: { badgeName, badgeIcon }
  })
}

export async function notifyReferralConverted(userId: string, referralName: string): Promise<void> {
  await createNotification({
    userId,
    type: 'referral',
    title: 'Referral Converted!',
    message: `${referralName} signed up using your referral link. You earned £10 credit!`,
    data: { credit: 10 }
  })
}

export async function notifyLevelUp(userId: string, level: number, title: string): Promise<void> {
  await createNotification({
    userId,
    type: 'achievement',
    title: 'Level Up!',
    message: `Congratulations! You reached Level ${level} - ${title}`,
    data: { level, title }
  })
}

export async function notifyAgentDeployed(userId: string, agentName: string): Promise<void> {
  await createNotification({
    userId,
    type: 'agent',
    title: 'Agent Deployed',
    message: `Your agent "${agentName}" is now live and ready to use!`,
    data: { agentName }
  })
}

export async function notifyStreakMilestone(userId: string, streak: number): Promise<void> {
  await createNotification({
    userId,
    type: 'achievement',
    title: 'Login Streak!',
    message: `🔥 ${streak} day login streak! Keep it up!`,
    data: { streak }
  })
}

export async function notifyWelcomeBack(userId: string, daysSinceLastLogin: number): Promise<void> {
  if (daysSinceLastLogin > 7) {
    await createNotification({
      userId,
      type: 'system',
      title: 'Welcome Back!',
      message: `It's been ${daysSinceLastLogin} days! Here's what you missed...`,
      data: { daysSinceLastLogin }
    })
  }
}
