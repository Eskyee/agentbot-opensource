/**
 * Tests for GET /api/provision/jobs/[jobId].
 *
 * Verifies session enforcement, ownership check, and forwarding to the
 * backend's /api/platform-jobs/:jobId endpoint.
 */

jest.mock('@/app/lib/getAuthSession', () => ({
  getAuthSession: jest.fn(),
}))

jest.mock('@/app/lib/managed-agent', () => ({
  persistManagedAgent: jest.fn(async () => undefined),
}))

jest.mock('@/app/lib/backend-client', () => ({
  signedFetch: jest.fn(),
}))

describe('GET /api/provision/jobs/[jobId]', () => {
  let GET: (req: Request, ctx: { params: Promise<{ jobId: string }> }) => Promise<Response>
  let getAuthSession: jest.Mock
  let signedFetch: jest.Mock
  let persistManagedAgent: jest.Mock

  beforeAll(async () => {
    const route = await import('@/app/api/provision/jobs/[jobId]/route')
    GET = route.GET as typeof GET
    getAuthSession = (await import('@/app/lib/getAuthSession')).getAuthSession as unknown as jest.Mock
    signedFetch = (await import('@/app/lib/backend-client')).signedFetch as unknown as jest.Mock
    persistManagedAgent = (await import('@/app/lib/managed-agent')).persistManagedAgent as unknown as jest.Mock
  })

  beforeEach(() => {
    getAuthSession.mockReset()
    signedFetch.mockReset()
    persistManagedAgent.mockReset()
    persistManagedAgent.mockResolvedValue(undefined)
  })

  const ctx = { params: Promise.resolve({ jobId: 'job-1' }) }

  test('returns 401 when there is no session', async () => {
    getAuthSession.mockResolvedValue(null)

    const response = await GET(new Request('http://localhost/api/provision/jobs/job-1'), ctx)
    expect(response.status).toBe(401)
    expect(signedFetch).not.toHaveBeenCalled()
  })

  test('returns 403 when the job belongs to a different user', async () => {
    getAuthSession.mockResolvedValue({ user: { id: 'user-A' } })
    signedFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        job: { id: 'job-1', userId: 'user-B', status: 'queued', error: null, result: null },
      }),
    })

    const response = await GET(new Request('http://localhost/api/provision/jobs/job-1'), ctx)
    expect(response.status).toBe(403)
    expect(persistManagedAgent).not.toHaveBeenCalled()
  })

  test('forwards a queued job to the caller', async () => {
    getAuthSession.mockResolvedValue({ user: { id: 'user-1' } })
    signedFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        job: { id: 'job-1', userId: 'user-1', status: 'queued', error: null, result: null, attempts: 0 },
      }),
    })

    const response = await GET(new Request('http://localhost/api/provision/jobs/job-1'), ctx)
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.job).toMatchObject({ id: 'job-1', status: 'queued' })
    expect(persistManagedAgent).not.toHaveBeenCalled()
  })

  test('persists the managed agent when the job is completed', async () => {
    getAuthSession.mockResolvedValue({ user: { id: 'user-1' } })
    signedFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        job: {
          id: 'job-1',
          userId: 'user-1',
          agentId: 'agent-1',
          status: 'completed',
          error: null,
          result: { url: 'https://agent.example.com', plan: 'solo', aiProvider: 'openrouter', agentType: 'business' },
          payload: { plan: 'solo', aiProvider: 'openrouter', agentType: 'business' },
        },
      }),
    })

    const response = await GET(new Request('http://localhost/api/provision/jobs/job-1'), ctx)
    expect(response.status).toBe(200)
    expect(persistManagedAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        agentId: 'agent-1',
        url: 'https://agent.example.com',
      }),
    )
  })
})
