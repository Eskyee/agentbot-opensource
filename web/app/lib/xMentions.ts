import { prisma } from '@/app/lib/prisma'

export const X_MENTION_STATE_SETTING_KEY = 'x_mention_state'

export type XMentionStateStatus = 'open' | 'resolved'

export interface XMentionState {
  id: string
  status: XMentionStateStatus
  assignedTo?: string | null
  updatedAt: string
}

export async function getXMentionStates(userId: string): Promise<XMentionState[]> {
  const setting = await prisma.userSetting.findUnique({
    where: { userId_key: { userId, key: X_MENTION_STATE_SETTING_KEY } },
  })

  if (!setting) return []

  try {
    const parsed = JSON.parse(setting.value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function saveXMentionStates(userId: string, mentions: XMentionState[]) {
  await prisma.userSetting.upsert({
    where: { userId_key: { userId, key: X_MENTION_STATE_SETTING_KEY } },
    update: { value: JSON.stringify(mentions.slice(0, 200)) },
    create: { userId, key: X_MENTION_STATE_SETTING_KEY, value: JSON.stringify(mentions.slice(0, 200)) },
  })
}
