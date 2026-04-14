/**
 * GET /api/cron/verify-x-claims
 * Scheduled hourly by Vercel Cron.
 *
 * Finds all pending X verification claims, searches X for the challenge code,
 * and auto-approves on match or expires overdue claims.
 *
 * Required env vars:
 *   CRON_SECRET         — shared secret checked by Vercel
 *   X_API_BEARER_TOKEN  — Twitter/X API v2 Bearer Token
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export const dynamic = 'force-dynamic'

async function searchXForCode(code: string, bearerToken: string): Promise<boolean> {
  const params = new URLSearchParams({
    query: code,
    max_results: '10',
    'tweet.fields': 'text,created_at',
  })

  const res = await fetch(`https://api.x.com/2/tweets/search/recent?${params}`, {
    headers: { Authorization: `Bearer ${bearerToken}` },
    signal: AbortSignal.timeout(8000),
    cache: 'no-store',
  })

  if (!res.ok) {
    const err = await res.text()
    console.error(`[verify-x-claims] X API error ${res.status}: ${err}`)
    return false
  }

  const payload = await res.json()
  const tweets: { text: string }[] = payload?.data ?? []
  return tweets.some(t => t.text.includes(code))
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const bearerToken = process.env.X_API_BEARER_TOKEN?.trim()
  if (!bearerToken) {
    console.warn('[verify-x-claims] X_API_BEARER_TOKEN not set — skipping')
    return NextResponse.json({ skipped: true, reason: 'X_API_BEARER_TOKEN not configured' })
  }

  const now = new Date()

  // Fetch pending claims — cap at 10 per run to stay within X rate limits
  const pending = await prisma.agentClaim.findMany({
    where: { status: 'x_pending' },
    orderBy: { createdAt: 'asc' },
    take: 10,
  })

  let verified = 0
  let expired = 0

  for (const claim of pending) {
    // Expire overdue claims
    if (claim.expiresAt && claim.expiresAt < now) {
      await prisma.agentClaim.update({
        where: { id: claim.id },
        data: { status: 'expired', updatedAt: now },
      })
      expired++
      console.log(`[verify-x-claims] Expired claim ${claim.id} for agent ${claim.agentId}`)
      continue
    }

    if (!claim.xChallengeCode) continue

    try {
      const found = await searchXForCode(claim.xChallengeCode, bearerToken)

      if (found) {
        // Approve claim and update agent in a transaction
        await prisma.$transaction([
          prisma.agentClaim.update({
            where: { id: claim.id },
            data: { status: 'verified', verifiedAt: now, updatedAt: now },
          }),
          prisma.socialAgent.update({
            where: { id: claim.agentId },
            data: {
              verificationStatus: 'verified',
              trustScore: { increment: 50 },
              updatedAt: now,
            },
          }),
        ])
        verified++
        console.log(`[verify-x-claims] Verified claim ${claim.id} for agent ${claim.agentId}`)
      } else {
        console.log(`[verify-x-claims] Code ${claim.xChallengeCode} not found on X yet`)
      }
    } catch (err) {
      console.error(`[verify-x-claims] Error checking claim ${claim.id}:`, err)
    }
  }

  return NextResponse.json({
    checked: pending.length,
    verified,
    expired,
    remaining: pending.length - verified - expired,
  })
}
