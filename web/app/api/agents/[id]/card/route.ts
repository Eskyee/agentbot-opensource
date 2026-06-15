/**
 * GET /api/agents/:id/card — public A2A Agent Card for a discoverable agent.
 *
 * Privacy: only agents whose owner opted into the showcase (showcaseOptIn) are
 * publicly discoverable. The owner can always fetch their own card. The card
 * advertises enabled skills and, when a wallet exists, the USDC payment rail so
 * external A2A agents can hire and pay this agent.
 */
import { NextRequest } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { buildAgentCard } from '@/app/lib/agent-card'
import { apiOk, notFound } from '@/app/lib/api/respond'
import { checkRateLimit } from '@/app/lib/api/rate-limit'

export const runtime = 'nodejs'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (await checkRateLimit(req, 'read')) {
    return notFound() // cheap, opaque under abuse
  }

  const { id } = await params
  const agentId = id.trim()
  if (!agentId) return notFound('Agent not found')

  const agent = await prisma.agent
    .findUnique({
      where: { id: agentId },
      include: {
        installedSkills: { include: { skill: true } },
        user: { select: { id: true } },
      },
    })
    .catch(() => null)

  if (!agent) return notFound('Agent not found')

  // Discovery gate: public only if showcased; otherwise owner-only.
  if (!agent.showcaseOptIn) {
    const session = await getAuthSession()
    if (session?.user?.id !== agent.userId) return notFound('Agent not found')
  }

  // Optional payment rail — the owner's wallet, address only (never secrets).
  const wallet = await prisma.wallet
    .findFirst({ where: { userId: agent.userId }, select: { address: true, network: true } })
    .catch(() => null)

  const card = buildAgentCard(
    {
      id: agent.id,
      name: agent.name,
      model: agent.model,
      status: agent.status,
      showcaseDescription: agent.showcaseDescription,
      installedSkills: agent.installedSkills.map((s) => ({
        enabled: s.enabled,
        skill: { name: s.skill.name, description: s.skill.description, category: s.skill.category },
      })),
    },
    wallet ? { walletAddress: wallet.address, network: wallet.network } : undefined,
  )

  return apiOk(card, 200, {
    'Cache-Control': 'public, max-age=300',
    'Access-Control-Allow-Origin': '*',
  })
}
