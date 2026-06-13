/**
 * GET /api/agents/directory — the public A2A agent index.
 *
 * This is the discovery layer of the on-chain agent economy: a paginated, public
 * list of every agent whose owner opted into the showcase (showcaseOptIn). Each
 * entry carries enough to decide whether to hire the agent — its skills, whether
 * it's payable (USDC rail), its A2A endpoint, and its earned reputation
 * (completed + paid task counts, which are durable and can't be faked).
 *
 * Why it's a moat: the index + reputation are anchored to on-chain settlement no
 * pure-SaaS competitor has. More discoverable, payable agents → more reason to
 * deploy here. The data compounds; the code doesn't.
 *
 * Query params:
 *   - q:        free-text filter over name / description / skill name+tag
 *   - skill:    filter to agents advertising a skill whose tag or name matches
 *   - payable:  'true' → only agents with a USDC rail
 *   - sort:     'reputation' (default) | 'recent' | 'name'
 *   - cursor:   opaque pagination cursor (agent id)
 *   - limit:    page size (1–50, default 24)
 */
import { NextRequest } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { buildAgentCard } from '@/app/lib/agent-card'
import { apiOk, apiError } from '@/app/lib/api/respond'
import { checkRateLimit } from '@/app/lib/api/rate-limit'
import { getReputations } from '@/app/lib/a2a-tasks'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_LIMIT = 50
const DEFAULT_LIMIT = 24

export type DirectoryEntry = {
  id: string
  name: string
  description: string
  model: string | null
  status: string
  endpoint: string
  payable: boolean
  payment?: { network: string; asset: string; address: string }
  skills: Array<{ id: string; name: string; tags: string[] }>
  reputation: { completed: number; paid: number; lastAt: string | null }
}

function clampLimit(raw: string | null): number {
  const n = Number(raw)
  if (!Number.isFinite(n)) return DEFAULT_LIMIT
  return Math.min(MAX_LIMIT, Math.max(1, Math.floor(n)))
}

export async function GET(req: NextRequest) {
  if (await checkRateLimit(req, 'read')) {
    return apiError('Too many requests', 429)
  }

  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim().toLowerCase()
  const skillFilter = (searchParams.get('skill') || '').trim().toLowerCase()
  const payableOnly = searchParams.get('payable') === 'true'
  const sort = searchParams.get('sort') || 'reputation'
  const cursor = (searchParams.get('cursor') || '').trim()
  const limit = clampLimit(searchParams.get('limit'))

  // Pull showcased agents. We over-fetch a little so post-filtering (skills,
  // payable, reputation sort) still yields a full page; the cursor keeps it
  // bounded. Reputation/skill filtering can't be expressed as a single SQL
  // predicate here, so we hydrate then rank in-process.
  const agents = await prisma.agent
    .findMany({
      where: { showcaseOptIn: true },
      include: {
        installedSkills: { include: { skill: true } },
        user: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    })
    .catch(() => [])

  if (agents.length === 0) {
    return apiOk({ agents: [], nextCursor: null, total: 0 }, 200, {
      'Cache-Control': 'public, max-age=60',
      'Access-Control-Allow-Origin': '*',
    })
  }

  // One wallet lookup per owner (deduped) → payment rails.
  const ownerIds = Array.from(new Set(agents.map((a) => a.userId)))
  const wallets = await prisma.wallet
    .findMany({
      where: { userId: { in: ownerIds } },
      select: { userId: true, address: true, network: true },
    })
    .catch(() => [])
  const walletByOwner = new Map(wallets.map((w) => [w.userId, w]))

  // Durable reputation counters (Redis-backed, no TTL).
  const reputations = await getReputations(agents.map((a) => a.id))

  // Build directory entries via the shared card builder (single source of truth
  // for skills + payment shape), then apply filters.
  let entries: DirectoryEntry[] = agents.map((agent) => {
    const wallet = walletByOwner.get(agent.userId)
    const card = buildAgentCard(
      {
        id: agent.id,
        name: agent.name,
        model: agent.model,
        status: agent.status,
        showcaseDescription: agent.showcaseDescription ?? undefined,
        installedSkills: agent.installedSkills.map((s) => ({
          enabled: s.enabled,
          skill: { name: s.skill.name, description: s.skill.description, category: s.skill.category },
        })),
      },
      wallet ? { walletAddress: wallet.address, network: wallet.network } : undefined,
    )
    const payment = card['x-agentbot']?.payments
    return {
      id: agent.id,
      name: card.name,
      description: card.description,
      model: agent.model ?? null,
      status: agent.status,
      endpoint: card.url,
      payable: Boolean(payment),
      ...(payment ? { payment } : {}),
      skills: card.skills.map((s) => ({ id: s.id, name: s.name, tags: s.tags })),
      reputation: reputations.get(agent.id) ?? { completed: 0, paid: 0, lastAt: null },
    }
  })

  if (payableOnly) entries = entries.filter((e) => e.payable)

  if (skillFilter) {
    entries = entries.filter((e) =>
      e.skills.some(
        (s) => s.id === skillFilter || s.name.toLowerCase().includes(skillFilter) || s.tags.some((t) => t.toLowerCase() === skillFilter),
      ),
    )
  }

  if (q) {
    entries = entries.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.skills.some((s) => s.name.toLowerCase().includes(q) || s.tags.some((t) => t.toLowerCase().includes(q))),
    )
  }

  // Ranking. Reputation = paid-weighted (paid work counts more than free).
  if (sort === 'name') {
    entries.sort((a, b) => a.name.localeCompare(b.name))
  } else if (sort === 'recent') {
    entries.sort((a, b) => (b.reputation.lastAt || '').localeCompare(a.reputation.lastAt || ''))
  } else {
    const score = (e: DirectoryEntry) => e.reputation.paid * 3 + e.reputation.completed
    entries.sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name))
  }

  const total = entries.length

  // Cursor pagination over the ranked list (stable: cursor = last id of page).
  let start = 0
  if (cursor) {
    const idx = entries.findIndex((e) => e.id === cursor)
    start = idx >= 0 ? idx + 1 : 0
  }
  const page = entries.slice(start, start + limit)
  const nextCursor = start + limit < total ? page[page.length - 1]?.id ?? null : null

  return apiOk({ agents: page, nextCursor, total }, 200, {
    'Cache-Control': 'public, max-age=60',
    'Access-Control-Allow-Origin': '*',
  })
}
