/**
 * GET /api/trust/stats — live signals for the public trust/status page.
 *
 * Aggregates the things that make agents willing to transact here: how many
 * agents are discoverable, how the learned router is performing (and what it's
 * saved), and whether on-chain settlement is live. Cheap, public, cacheable.
 */
import { prisma } from '@/app/lib/prisma'
import { apiOk } from '@/app/lib/api/respond'
import { getFlywheelStats } from '@/app/lib/gateway-flywheel'
import { isSettlementConfigured } from '@/app/lib/x402-settle'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const [agentsListed, flywheel] = await Promise.all([
    prisma.agent.count({ where: { showcaseOptIn: true } }).catch(() => 0),
    getFlywheelStats().catch(() => null),
  ])

  return apiOk(
    {
      directory: { agentsListed },
      routing: flywheel
        ? {
            totalRouted: flywheel.totalRouted,
            successRate: flywheel.overallSuccessRate,
            estimatedUsdSaved: flywheel.estimatedUsdSaved,
            topModels: flywheel.topModels,
          }
        : null,
      settlement: { onChain: isSettlementConfigured() },
      status: 'operational',
      generatedAt: new Date().toISOString(),
    },
    200,
    { 'Cache-Control': 'public, max-age=60', 'Access-Control-Allow-Origin': '*' },
  )
}
