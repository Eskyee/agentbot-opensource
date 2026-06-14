/**
 * @jest-environment node
 *
 * Playground → agent bridge route. Verifies auth/ownership gates, the
 * not-generated guard, idempotency, and that a happy-path conversion mints an
 * agent and returns its A2A surface. Prisma + session are mocked.
 */
jest.mock('@/app/lib/api/rate-limit', () => ({ checkRateLimit: jest.fn().mockResolvedValue(false) }))
jest.mock('@/app/lib/getAuthSession', () => ({ getAuthSession: jest.fn() }))
jest.mock('@/app/lib/prisma', () => ({
  prisma: {
    playgroundProject: { findFirst: jest.fn() },
    agent: { findFirst: jest.fn(), create: jest.fn() },
  },
}))

import { POST } from '@/app/api/playground/projects/[id]/make-agent/route'
import { prisma } from '@/app/lib/prisma'
import { getAuthSession } from '@/app/lib/getAuthSession'

const projFindFirst = prisma.playgroundProject.findFirst as jest.Mock
const agentFindFirst = prisma.agent.findFirst as jest.Mock
const agentCreate = prisma.agent.create as jest.Mock
const sessionMock = getAuthSession as jest.Mock

const GENERATION = {
  title: 'Set Planner',
  summary: 'Plans DJ sets from a crate of tracks.',
  files: [{ path: 'src/App.tsx', content: 'export default function App(){return null}' }],
}

const params = Promise.resolve({ id: 'proj1' })
function req() {
  return new Request('http://test/api/playground/projects/proj1/make-agent', {
    method: 'POST',
  }) as unknown as Parameters<typeof POST>[0]
}

beforeEach(() => {
  jest.clearAllMocks()
  sessionMock.mockResolvedValue({ user: { id: 'user1' } })
  projFindFirst.mockResolvedValue({ id: 'proj1', userId: 'user1', name: 'set-planner', model: 'auto', publishedUrl: null, generation: GENERATION })
  agentFindFirst.mockResolvedValue(null)
  agentCreate.mockResolvedValue({ id: 'agent-new' })
})

describe('make-agent route', () => {
  it('rejects unauthenticated callers (401)', async () => {
    sessionMock.mockResolvedValue(null)
    const res = await POST(req(), { params })
    expect(res.status).toBe(401)
    expect(agentCreate).not.toHaveBeenCalled()
  })

  it('404s when the project is not the caller’s', async () => {
    projFindFirst.mockResolvedValue(null)
    const res = await POST(req(), { params })
    expect(res.status).toBe(404)
  })

  it('409s when the app has not been generated', async () => {
    projFindFirst.mockResolvedValue({ id: 'proj1', userId: 'user1', name: 'x', generation: null })
    const res = await POST(req(), { params })
    expect(res.status).toBe(409)
    expect(agentCreate).not.toHaveBeenCalled()
  })

  it('mints an agent and returns its A2A surface (201)', async () => {
    const res = await POST(req(), { params })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.agentId).toBe('agent-new')
    expect(body.existed).toBe(false)
    expect(body.cardUrl).toContain('/api/agents/agent-new/card')
    expect(body.a2aUrl).toContain('/api/agents/agent-new/a2a')

    // created as a discoverable, showcased agent with the app summary as bio
    expect(agentCreate).toHaveBeenCalledTimes(1)
    const data = agentCreate.mock.calls[0][0].data
    expect(data.userId).toBe('user1')
    expect(data.showcaseOptIn).toBe(true)
    expect(data.showcaseDescription).toContain('Plans DJ sets')
    expect(data.config.playgroundProjectId).toBe('proj1')
  })

  it('is idempotent — returns the existing agent without re-creating', async () => {
    agentFindFirst.mockResolvedValue({ id: 'agent-existing' })
    const res = await POST(req(), { params })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.agentId).toBe('agent-existing')
    expect(body.existed).toBe(true)
    expect(agentCreate).not.toHaveBeenCalled()
  })
})
