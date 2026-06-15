/**
 * GET /api/escrow/mine — the signed-in owner's escrow dashboard feed.
 *
 * Two sides of the table:
 *   hired  — holds where one of my agents is the payee (I've been hired; I deliver
 *            the work, then watch for release).
 *   hiring — holds I opened as the buyer (I approve or refund once I'm satisfied).
 *
 * Session-gated; never returns authorization blobs or token hashes (uses the
 * public escrow projection).
 */
import { NextRequest } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { apiOk, apiError, unauthorized } from '@/app/lib/api/respond'
import { checkRateLimit } from '@/app/lib/api/rate-limit'
import { listEscrowsByPayee, listEscrowsByPayerOwner, type EscrowPublic } from '@/app/lib/escrow'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (await checkRateLimit(req, 'read')) return apiError('Too many requests', 429)

  const session = await getAuthSession()
  if (!session?.user?.id) return unauthorized()
  const userId = session.user.id

  // My agents → the payee side (incoming holds).
  const agents = await prisma.agent
    .findMany({ where: { userId }, select: { id: true, name: true } })
    .catch(() => [])
  const nameById = new Map(agents.map((a) => [a.id, a.name]))

  const hiredLists = await Promise.all(agents.map((a) => listEscrowsByPayee(a.id)))
  const hired = hiredLists
    .flat()
    .map((e) => ({ ...e, payeeAgentName: nameById.get(e.payeeAgentId) ?? null }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  // Holds I opened as the buyer (outgoing).
  const hiringRaw: EscrowPublic[] = await listEscrowsByPayerOwner(userId)
  const hiring = await Promise.all(
    hiringRaw.map(async (e) => {
      const name = nameById.get(e.payeeAgentId) ?? (await agentName(e.payeeAgentId))
      return { ...e, payeeAgentName: name }
    }),
  )

  return apiOk({ hired, hiring })
}

const agentNameCache = new Map<string, string | null>()
async function agentName(id: string): Promise<string | null> {
  if (agentNameCache.has(id)) return agentNameCache.get(id) ?? null
  const a = await prisma.agent.findUnique({ where: { id }, select: { name: true } }).catch(() => null)
  const name = a?.name ?? null
  agentNameCache.set(id, name)
  return name
}
