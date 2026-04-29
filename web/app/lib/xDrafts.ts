import { prisma } from '@/app/lib/prisma'

export const X_DRAFT_QUEUE_SETTING_KEY = 'x_draft_queue'

export type XDraftStatus = 'draft' | 'approved' | 'rejected' | 'published'

export interface XDraft {
  id: string
  sessionId?: string | null
  mentionId?: string | null
  sourceText: string
  draftText: string
  tone: string
  status: XDraftStatus
  createdAt: string
  updatedAt: string
  scheduledFor?: string | null
  publishedPostId?: string | null
  publishedUrl?: string | null
}

function makeDraftId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export async function getXDraftQueue(userId: string): Promise<XDraft[]> {
  const setting = await prisma.userSetting.findUnique({
    where: { userId_key: { userId, key: X_DRAFT_QUEUE_SETTING_KEY } },
  })

  if (!setting) return []

  try {
    const parsed = JSON.parse(setting.value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function saveXDraftQueue(userId: string, drafts: XDraft[]) {
  await prisma.userSetting.upsert({
    where: { userId_key: { userId, key: X_DRAFT_QUEUE_SETTING_KEY } },
    update: { value: JSON.stringify(drafts.slice(0, 50)) },
    create: { userId, key: X_DRAFT_QUEUE_SETTING_KEY, value: JSON.stringify(drafts.slice(0, 50)) },
  })
}

export async function appendXDraft(userId: string, input: {
  sessionId?: string | null
  mentionId?: string | null
  sourceText: string
  draftText: string
  tone: string
  scheduledFor?: string | null
}) {
  const queue = await getXDraftQueue(userId)
  const now = new Date().toISOString()
  const draft: XDraft = {
    id: makeDraftId(),
    sessionId: input.sessionId || null,
    mentionId: input.mentionId || null,
    sourceText: input.sourceText,
    draftText: input.draftText,
    tone: input.tone,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    scheduledFor: input.scheduledFor || null,
  }

  const nextQueue = [draft, ...queue]
  await saveXDraftQueue(userId, nextQueue)
  return draft
}

export function normalizeDraftText(text: string) {
  return text.replace(/\s+/g, ' ').trim().toLowerCase()
}
