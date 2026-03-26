import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { authOptions } from '@/app/lib/auth'
import { prisma } from '@/app/lib/prisma'

const PLAN_COSTS: Record<string, number> = {
  solo: 29,
  collective: 69,
  label: 149,
  network: 499,
}

/**
 * GET /api/mission-control/fleet/costs
 * Returns cost breakdown for the user's fleet
 */
export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.email) {
    return NextResponse.json({ costs: [], totalSpend: 0, managedAiCost: 0, coordinationRevenue: 0 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        plan: true,
        subscriptionStatus: true,
        subscriptionStartDate: true,
        agents: {
          select: {
            id: true,
            name: true,
            status: true,
            tier: true,
            createdAt: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ costs: [], totalSpend: 0, managedAiCost: 0, coordinationRevenue: 0 })
    }

    const monthlyPlanCost = PLAN_COSTS[user.plan] || 0
    const agentCount = user.agents.length
    const activeAgents = user.agents.filter((a) => a.status === 'active' || a.status === 'running').length

    // Calculate months active since subscription start
    const startDate = user.subscriptionStartDate || new Date()
    const monthsActive = Math.max(1, Math.ceil((Date.now() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000)))
    const totalSpend = monthlyPlanCost * monthsActive

    // Costs per agent (evenly split)
    const costs = user.agents.map((agent) => ({
      agentId: agent.id,
      agentName: agent.name,
      status: agent.status,
      tier: agent.tier,
      monthlyCost: activeAgents > 0 ? Math.round((monthlyPlanCost / activeAgents) * 100) / 100 : 0,
      createdAt: agent.createdAt,
    }))

    return NextResponse.json({
      costs,
      totalSpend,
      managedAiCost: monthlyPlanCost,
      coordinationRevenue: 0, // Future: track A2A coordination earnings
      plan: user.plan,
      agentCount,
      activeAgents,
      monthsActive,
    })
  } catch (error) {
    console.error('[Costs API] Error:', error)
    return NextResponse.json({ costs: [], totalSpend: 0, managedAiCost: 0, coordinationRevenue: 0 })
  }
}


export const dynamic = 'force-dynamic';
