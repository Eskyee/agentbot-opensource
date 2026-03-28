import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import crypto from 'crypto'

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

  const teamId = `team-${crypto.randomBytes(6).toString('hex')}`
  const agentCount = PLAN_AGENT_COUNTS[plan]

  console.log(
    `[Provision/Team] User ${session.user.id} deploying team: teamId=${teamId} plan=${plan} template=${templateKey} agents=${agentCount}`
  )

  // Kick off background provisioning via the existing /api/provision route.
  // Each agent in the team is provisioned independently.
  const backendUrl = process.env.BACKEND_API_URL?.trim()
  const internalKey = process.env.INTERNAL_API_KEY?.trim()

  if (backendUrl && internalKey) {
    // Fire-and-forget: spawn N agents in background (don't block the response)
    Promise.allSettled(
      Array.from({ length: agentCount }, (_, i) =>
        fetch(`${backendUrl}/api/provision`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${internalKey}`,
            'X-User-Email': session.user?.email ?? '',
            'X-User-Id': session.user?.id ?? '',
          },
          body: JSON.stringify({
            userId: `${teamId}-agent-${i + 1}`,
            plan,
            email: session.user?.email,
            autoProvision: true,
            agentType: 'business',
            teamId,
            templateKey,
          }),
          signal: AbortSignal.timeout(15_000),
        }).catch(err =>
          console.error(`[Provision/Team] Agent ${i + 1} provision error:`, err)
        )
      )
    ).catch(() => {})
  }

  return NextResponse.json({
    success: true,
    teamId,
    plan,
    templateKey,
    agentCount,
    message: `Team provisioning started. ${agentCount} agents are being deployed.`,
  })
}

export const dynamic = 'force-dynamic'
