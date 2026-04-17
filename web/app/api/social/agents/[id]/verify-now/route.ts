/**
 * POST /api/social/agents/[id]/verify-now
 *
 * On-demand X verification — checks the X API immediately for the
 * challenge code instead of waiting for the hourly cron job.
 *
 * Required env var: X_API_BEARER_TOKEN
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { ensureLocalUser } from '@/lib/social/identity'

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
    console.error(`[verify-now] X API error ${res.status}: ${err}`)
    return false
  }

  const payload = await res.json()
  const tweets: { text: string }[] = payload?.data ?? []
  return tweets.some(t => t.text.includes(code))
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const localUser = await ensureLocalUser(session.user.id)

    const bearerToken = process.env.X_API_BEARER_TOKEN?.trim()
    if (!bearerToken) {
      return NextResponse.json(
        { error: 'X API not configured — verification will happen via scheduled check' },
        { status: 503 },
      )
    }

    // Find the pending claim for this agent + user
    const claim = await prisma.agentClaim.findUnique({
      where: { agentId_userId: { agentId: id, userId: localUser.id } },
    })

    if (!claim) {
      return NextResponse.json({ error: 'No claim found — start a claim first' }, { status: 404 })
    }

    if (claim.status === 'verified') {
      return NextResponse.json({ status: 'already_verified', claim })
    }

    if (claim.status !== 'x_pending') {
      return NextResponse.json({ error: `Claim status is ${claim.status}, not x_pending` }, { status: 400 })
    }

    if (!claim.xChallengeCode) {
      return NextResponse.json({ error: 'No challenge code on this claim' }, { status: 400 })
    }

    // Check expiry — use updateMany with status guard so we don't overwrite
    // a concurrent cron verification that already flipped this claim to 'verified'.
    if (claim.expiresAt && claim.expiresAt < new Date()) {
      const { count } = await prisma.agentClaim.updateMany({
        where: { id: claim.id, status: 'x_pending' },
        data: { status: 'expired', updatedAt: new Date() },
      })
      if (count === 0) {
        // Claim was already resolved (e.g. verified by cron) — return fresh state
        const refreshed = await prisma.agentClaim.findUnique({ where: { id: claim.id } })
        return NextResponse.json({ status: refreshed?.status === 'verified' ? 'already_verified' : 'expired', claim: refreshed })
      }
      return NextResponse.json({ status: 'expired', error: 'Claim has expired — start a new one' }, { status: 410 })
    }

    // Search X for the challenge code
    const found = await searchXForCode(claim.xChallengeCode, bearerToken)

    if (!found) {
      return NextResponse.json({
        status: 'not_found',
        message: 'Challenge code not found on X yet. Make sure your post is public and try again in a minute.',
      })
    }

    // Atomic verify: interactive transaction ensures both the status guard
    // AND the trustScore increment succeed or fail together.
    // updateMany with status='x_pending' prevents double-increment under
    // Read Committed isolation (concurrent "Check Now" or hourly cron).
    const now = new Date()
    const result = await prisma.$transaction(async (tx) => {
      const { count } = await tx.agentClaim.updateMany({
        where: { id: claim.id, status: 'x_pending' },
        data: { status: 'verified', verifiedAt: now, updatedAt: now },
      })

      if (count === 0) {
        // Another request (or the cron) already verified this claim
        const refreshed = await tx.agentClaim.findUnique({ where: { id: claim.id } })
        return { alreadyHandled: true as const, claim: refreshed }
      }

      // Claim flipped — safe to increment trustScore exactly once
      await tx.socialAgent.update({
        where: { id: claim.agentId },
        data: {
          verificationStatus: 'verified',
          trustScore: { increment: 50 },
          updatedAt: now,
        },
      })

      const updatedClaim = await tx.agentClaim.findUnique({ where: { id: claim.id } })
      return { alreadyHandled: false as const, claim: updatedClaim }
    })

    if (result.alreadyHandled) {
      return NextResponse.json({ status: 'already_verified', claim: result.claim })
    }

    return NextResponse.json({ status: 'verified', claim: result.claim })
  } catch (error) {
    console.error('[verify-now] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
