/**
 * Outcome tracking — records when agents complete valuable work.
 * Called internally by the platform (negotiation, amplification, broadcast crons)
 * and externally by OpenClaw agents via bearer token.
 *
 * POST /api/outcomes  — record an outcome
 * GET  /api/outcomes  — list outcomes for authenticated user
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { getLegacyUserIdByEmail, ensureLegacyUserIdByEmail } from '@/app/lib/legacyUserId'

const VALID_TYPES = [
  'negotiation_complete',
  'amplification_complete',
  'deal_closed',
  'broadcast_complete',
  'task_complete',
  'content_published',
] as const

export async function POST(req: NextRequest) {
  // Accept either session auth (web) or bearer token auth (agent/cron)
  const auth = req.headers.get('authorization')
  const internalToken = process.env.INTERNAL_API_KEY

  let userId: number | null = null
  let agentId: number | null = null

  if (auth?.startsWith('Bearer ') && internalToken && auth === `Bearer ${internalToken}`) {
    // Internal call — userId/agentId come from body
    const body = await req.json()
    userId = body.userId ?? null
    agentId = body.agentId ?? null

    if (!VALID_TYPES.includes(body.outcomeType)) {
      return NextResponse.json({ error: 'Invalid outcome_type' }, { status: 400 })
    }

    try {
      await prisma.platform_outcomes.create({
        data: {
          user_id:      userId,
          agent_id:     agentId,
          outcome_type: body.outcomeType,
          title:        String(body.title || '').slice(0, 200),
          description:  body.description ? String(body.description).slice(0, 1000) : null,
          value_usd:    body.valueUsd ?? null,
          metadata:     body.metadata ?? null,
        },
      })
    } catch (err) {
      console.error('[outcomes] internal create failed', err)
      return NextResponse.json({ error: 'Failed to record outcome' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  }

  // Session auth path
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  userId = await ensureLegacyUserIdByEmail(session.user.email)
  if (!userId) {
    return NextResponse.json({ error: 'Session missing email' }, { status: 400 })
  }

  const body = await req.json()

  if (!VALID_TYPES.includes(body.outcomeType)) {
    return NextResponse.json({ error: 'Invalid outcome_type' }, { status: 400 })
  }

  let outcome
  try {
    outcome = await prisma.platform_outcomes.create({
      data: {
        user_id:      userId,
        agent_id:     body.agentId ?? null,
        outcome_type: body.outcomeType,
        title:        String(body.title || '').slice(0, 200),
        description:  body.description ? String(body.description).slice(0, 1000) : null,
        value_usd:    body.valueUsd ?? null,
        metadata:     body.metadata ?? null,
      },
    })
  } catch (err) {
    console.error('[outcomes] session create failed', err)
    return NextResponse.json({ error: 'Failed to record outcome' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: outcome.id })
}

export async function GET(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const limit = Math.min(50, parseInt(req.nextUrl.searchParams.get('limit') || '20'))

  const legacyId = await getLegacyUserIdByEmail(session.user.email)
  if (!legacyId) return NextResponse.json({ outcomes: [] })

  const outcomes = await prisma.platform_outcomes.findMany({
    where:   { user_id: legacyId },
    orderBy: { created_at: 'desc' },
    take:    limit,
  })

  return NextResponse.json({ outcomes })
}

