import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { publishPostToX } from '@/app/lib/xApi'
import { normalizeDraftText, type XDraft } from '@/app/lib/xDrafts'


export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = Date.now()
  const settings = await prisma.userSetting.findMany({
    where: { key: 'x_draft_queue' },
    select: { userId: true, value: true },
  })

  const results: Array<{ userId: string; published: number; failed: number }> = []

  for (const setting of settings) {
    let drafts: XDraft[] = []
    try {
      const parsed = JSON.parse(setting.value)
      drafts = Array.isArray(parsed) ? parsed : []
    } catch {
      continue
    }

    let published = 0
    let failed = 0
    const publishedNormalized = new Set(
      drafts
        .filter((draft) => draft.status === 'published')
        .map((draft) => normalizeDraftText(draft.draftText))
    )

    for (const draft of drafts) {
      if (draft.status !== 'approved' || !draft.scheduledFor) continue
      const scheduledTime = Date.parse(draft.scheduledFor)
      if (!Number.isFinite(scheduledTime) || scheduledTime > now) continue

      const normalized = normalizeDraftText(draft.draftText)
      if (publishedNormalized.has(normalized)) {
        failed += 1
        continue
      }

      try {
        const post = await publishPostToX(setting.userId, draft.draftText)
        draft.status = 'published'
        draft.updatedAt = new Date().toISOString()
        draft.publishedPostId = post.postId
        draft.publishedUrl = post.url
        publishedNormalized.add(normalized)
        published += 1
      } catch {
        failed += 1
      }
    }

    await prisma.userSetting.update({
      where: { userId_key: { userId: setting.userId, key: 'x_draft_queue' } },
      data: { value: JSON.stringify(drafts.slice(0, 50)) },
    }).catch(() => null)

    if (published || failed) {
      results.push({ userId: setting.userId, published, failed })
    }
  }

  return NextResponse.json({ ok: true, results })
}
