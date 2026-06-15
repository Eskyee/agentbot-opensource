import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { fetchUserMentionsFromX } from '@/app/lib/xApi'
import { getXDraftQueue, appendXDraft } from '@/app/lib/xDrafts'
import { generateXDraft } from '@/app/lib/xDraftGenerator'

/**
 * GET /api/cron/x-monitor
 *
 * Runs every 15 minutes. For each user with X connected:
 * 1. Fetch their recent mentions
 * 2. Skip mentions that already have drafts
 * 3. Generate AI drafts for new mentions
 *
 * Auth: Bearer token matching CRON_SECRET (same pattern as x-publish).
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find all users with X account connected
  const xAccounts = await prisma.userSetting.findMany({
    where: { key: 'x_api_account' },
    select: { userId: true },
  })

  if (xAccounts.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, results: [] })
  }

  const results: Array<{
    userId: string
    mentions: number
    newDrafts: number
    errors: number
  }> = []

  for (const { userId } of xAccounts) {
    let mentions: Awaited<ReturnType<typeof fetchUserMentionsFromX>> = []
    try {
      mentions = await fetchUserMentionsFromX(userId)
    } catch (e) {
      console.error(`[x-monitor] Failed to fetch mentions for ${userId}:`, e)
      results.push({ userId, mentions: 0, newDrafts: 0, errors: 1 })
      continue
    }

    if (mentions.length === 0) {
      results.push({ userId, mentions: 0, newDrafts: 0, errors: 0 })
      continue
    }

    // Get existing drafts to dedupe by mentionId
    const existingDrafts = await getXDraftQueue(userId)
    const existingMentionIds = new Set(
      existingDrafts
        .filter((d) => d.mentionId)
        .map((d) => d.mentionId)
    )

    let newDrafts = 0
    let errors = 0

    for (const mention of mentions) {
      // Skip if we already have a draft for this mention
      if (existingMentionIds.has(mention.id)) continue

      try {
        // Generate AI draft from the mention text
        const draftText = await generateXDraft(mention.text, 'direct')

        await appendXDraft(userId, {
          sourceText: mention.text,
          draftText,
          tone: 'direct',
          mentionId: mention.id,
        })

        // Track this mention so we don't double-draft within the same run
        existingMentionIds.add(mention.id)
        newDrafts++
      } catch (e) {
        console.error(`[x-monitor] Draft failed for mention ${mention.id} (user ${userId}):`, e)
        errors++
      }
    }

    results.push({ userId, mentions: mentions.length, newDrafts, errors })
  }

  return NextResponse.json({
    ok: true,
    processed: xAccounts.length,
    results,
  })
}
