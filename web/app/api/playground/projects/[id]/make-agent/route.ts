/**
 * POST /api/playground/projects/:id/make-agent
 *
 * The playground → agent bridge. v0/bolt stop at "static app deployed." Agentbot
 * turns a generated app into a living, payable A2A agent: this mints an Agent
 * record from the project, lists it in the directory (showcase), and points its
 * A2A card at the gateway-powered task endpoint. The app's summary becomes the
 * agent's public bio; the published URL is kept on the agent config so the card
 * can link back to what it does.
 *
 * Idempotent-ish: if this project already produced an agent, we return that one
 * instead of minting a duplicate.
 */
import { NextRequest } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { apiOk, apiError, unauthorized, notFound } from '@/app/lib/api/respond'
import { checkRateLimit } from '@/app/lib/api/rate-limit'
import { normalizeGeneration } from '@/app/api/playground/projects/_shared'

export const runtime = 'nodejs'

const ORIGIN = (process.env.NEXTAUTH_URL || 'https://agentbot.sh').replace(/\/+$/, '')

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (await checkRateLimit(req, 'write')) return apiError('Too many requests', 429)

  const session = await getAuthSession()
  if (!session?.user?.id) return unauthorized()
  const userId = session.user.id

  const { id } = await params
  const projectId = id.trim()

  const project = await prisma.playgroundProject
    .findFirst({ where: { id: projectId, userId } })
    .catch(() => null)
  if (!project) return notFound('Project not found')

  const generation = normalizeGeneration(project.generation)
  if (!generation) {
    return apiError('Generate the app before turning it into an agent', 409, 'not_generated')
  }

  // Already bridged? Return the existing agent (config.playgroundProjectId match).
  const existing = await prisma.agent
    .findFirst({
      where: { userId, config: { path: ['playgroundProjectId'], equals: projectId } },
      select: { id: true },
    })
    .catch(() => null)
  if (existing) {
    return apiOk(
      { agentId: existing.id, cardUrl: `${ORIGIN}/api/agents/${existing.id}/card`, existed: true },
      200,
    )
  }

  const name = (generation.title || project.name || 'Playground Agent').slice(0, 80)
  const bio = (generation.summary || 'An app built in the Agentbot playground, now an autonomous agent.').slice(0, 280)

  const agent = await prisma.agent
    .create({
      data: {
        userId,
        name,
        model: project.model ?? 'auto',
        status: 'active',
        showcaseOptIn: true,
        showcaseDescription: bio,
        config: {
          source: 'playground',
          playgroundProjectId: projectId,
          publishedUrl: project.publishedUrl ?? null,
        },
      },
      select: { id: true },
    })
    .catch((e) => {
      console.error('[make-agent] create failed', e)
      return null
    })

  if (!agent) return apiError('Could not create the agent', 500, 'create_failed')

  return apiOk(
    {
      agentId: agent.id,
      cardUrl: `${ORIGIN}/api/agents/${agent.id}/card`,
      a2aUrl: `${ORIGIN}/api/agents/${agent.id}/a2a`,
      directoryUrl: `${ORIGIN}/agents`,
      existed: false,
    },
    201,
  )
}
