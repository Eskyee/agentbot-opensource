import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import crypto from 'crypto'
import { isTrialActive } from '@/app/lib/trial-utils'
import { signedFetch } from '@/app/lib/backend-client'

/**
 * POST /api/provision/team
 * Provisions a coordinated AI agent team for the authenticated user.
 *
 * Body: { plan: 'collective' | 'label', templateKey: string }
 * Returns: { success: true, teamId: string } | { error: string }
 *
 * Agent count by plan:
 *   collective → 3 agents
 *   label      → 10 agents
 */

const PLAN_AGENT_COUNTS: Record<string, number> = {
  collective: 3,
  label: 10,
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { plan?: string; templateKey?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { plan, templateKey } = body

  if (!plan || !PLAN_AGENT_COUNTS[plan]) {
    return NextResponse.json(
      { error: `Invalid plan — must be one of: ${Object.keys(PLAN_AGENT_COUNTS).join(', ')}` },
      { status: 400 }
    )
  }

  if (!templateKey) {
    return NextResponse.json({ error: 'templateKey is required' }, { status: 400 })
  }

  // Look up stripeSubscriptionId from DB (set by Stripe webhook on checkout)
  let stripeSubscriptionId: string | null = null
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeSubscriptionId: true, subscriptionStatus: true, trialEndsAt: true },
    })
    stripeSubscriptionId = dbUser?.stripeSubscriptionId ?? null

    // Enforce active subscription (admin bypass handled by backend)
    const trialActive = isTrialActive(dbUser?.trialEndsAt)
    if (!stripeSubscriptionId && !trialActive && dbUser?.subscriptionStatus !== 'active') {
      return NextResponse.json(
        { error: 'Active subscription required. Please purchase a plan first.' },
        { status: 402 }
      )
    }
  } catch (err) {
    console.warn('[Provision/Team] Failed to look up stripeSubscriptionId:', err)
  }

  const teamId = `team-${crypto.randomBytes(6).toString('hex')}`
  const agentCount = PLAN_AGENT_COUNTS[plan]

  console.log(
    `[Provision/Team] User ${session.user.id} deploying team: teamId=${teamId} plan=${plan} template=${templateKey} agents=${agentCount}`
  )

  // Kick off background provisioning via the existing /api/provision route.
  // Each agent in the team is provisioned independently.
  // Use after() so provisioning completes after the response is sent.
  after(async () => {
    await Promise.allSettled(
      Array.from({ length: agentCount }, (_, i) =>
        signedFetch('/api/provision', {
          method: 'POST',
          headers: {
            'X-User-Plan': plan || 'collective',
            'X-Stripe-Subscription-Id': stripeSubscriptionId || '',
          },
          body: JSON.stringify({
            userId: `${teamId}-agent-${i + 1}`,
            plan,
            email: session.user?.email,
            stripeSubscriptionId,
            autoProvision: true,
            agentType: 'business',
            teamId,
            templateKey,
          }),
          signal: AbortSignal.timeout(15_000),
        }, {
          id: session.user?.id ?? '',
          email: session.user?.email ?? '',
          role: session.user?.isAdmin ? 'admin' : 'user',
        }).catch(err =>
          console.error(`[Provision/Team] Agent ${i + 1} provision error:`, err)
        )
      )
    )
  })

  return NextResponse.json({
    success: true,
    teamId,
    plan,
    templateKey,
    agentCount,
    message: `Team provisioning started. ${agentCount} agents are being deployed.`,
  })
}

