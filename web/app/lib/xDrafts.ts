import { prisma } from '@/app/lib/prisma'

export const X_DRAFT_QUEUE_SETTING_KEY = 'x_draft_queue'

export type XDraftStatus = 'draft' | 'approved' | 'rejected' | 'published'

export interface XDraft {
  id: string
  sourceText: string
  draftText: string
  tone: string
  status: XDraftStatus
  createdAt: string
  updatedAt: string
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
  sourceText: string
  draftText: string
  tone: string
}) {
  const queue = await getXDraftQueue(userId)
  const now = new Date().toISOString()
  const draft: XDraft = {
    id: makeDraftId(),
    sourceText: input.sourceText,
    draftText: input.draftText,
    tone: input.tone,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  }

  const nextQueue = [draft, ...queue]
  await saveXDraftQueue(userId, nextQueue)
  return draft
}
