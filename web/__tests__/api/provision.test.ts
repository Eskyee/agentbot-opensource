jest.mock('@/app/lib/getAuthSession', () => ({
  getAuthSession: jest.fn(),
}))

jest.mock('@/app/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('@/app/lib/trial-utils', () => ({
  isTrialActive: jest.fn(),
}))

jest.mock('@/app/lib/security-middleware', () => ({
  getClientIP: jest.fn(() => '127.0.0.1'),
  isRateLimited: jest.fn(async () => false),
}))

jest.mock('@/app/lib/workload-gate', () => ({
  acquireWorkloadSlot: jest.fn(async () => ({ ok: true, ticket: { id: 'ticket-1' } })),
  releaseWorkloadSlot: jest.fn(async () => undefined),
}))

jest.mock('@/app/lib/backend-client', () => ({
  signedFetch: jest.fn(),
}))

jest.mock('@/app/lib/admin', () => ({
  isAdminEmail: jest.fn(() => false),
}))

import { NextRequest } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { isTrialActive } from '@/app/lib/trial-utils'
import { signedFetch } from '@/app/lib/backend-client'
import { isAdminEmail } from '@/app/lib/admin'
import { POST } from '@/app/api/provision/route'

describe('POST /api/provision', () => {
  const mockedSession = getAuthSession as jest.Mock
  const mockedTrialActive = isTrialActive as jest.Mock
  const mockedSignedFetch = signedFetch as jest.Mock
  const mockedIsAdmin = isAdminEmail as jest.Mock
  const mockedPrisma = prisma as unknown as {
    user: { findUnique: jest.Mock }
  }

  const buildRequest = (body: Record<string, unknown> = {}) =>
    new NextRequest('http://localhost/api/provision', {
      method: 'POST',
      body: JSON.stringify({
        telegramToken: 'tg-bot-token',
        plan: 'solo',
        aiProvider: 'openrouter',
        ...body,
      }),
    })

  beforeEach(() => {
    jest.clearAllMocks()
    mockedIsAdmin.mockReturnValue(false)
    mockedTrialActive.mockReturnValue(false)
  })

  test('returns 401 when no session is present', async () => {
    mockedSession.mockResolvedValue(null)

    const response = await POST(buildRequest())
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body).toMatchObject({ success: false, error: 'Authentication required' })
    expect(mockedSignedFetch).not.toHaveBeenCalled()
  })

  test('returns 403 when user has no active subscription and no trial', async () => {
    mockedSession.mockResolvedValue({
      user: { id: 'user-1', email: 'user@example.com' },
    })
    mockedPrisma.user.findUnique.mockResolvedValue({
      subscriptionStatus: 'inactive',
      trialEndsAt: null,
    })

    const response = await POST(buildRequest())
    const body = await response.json()

    expect(response.status).toBe(403)
    expect(body).toMatchObject({
      success: false,
      error: expect.stringContaining('subscription'),
    })
    expect(mockedSignedFetch).not.toHaveBeenCalled()
  })

  test('returns 202 with jobId when the backend accepts the provision job', async () => {
    mockedSession.mockResolvedValue({
      user: { id: 'user-1', email: 'user@example.com' },
    })
    mockedPrisma.user.findUnique.mockResolvedValue({
      subscriptionStatus: 'active',
      trialEndsAt: null,
      stripeSubscriptionId: 'sub_123',
    })
    mockedSignedFetch.mockResolvedValue({
      ok: true,
      status: 202,
      headers: { get: () => 'application/json' },
      json: async () => ({ job: { id: 'job-1', status: 'queued' } }),
    })

    const response = await POST(buildRequest())
    const body = await response.json()

    expect(response.status).toBe(202)
    expect(body).toMatchObject({
      success: true,
      queued: true,
      jobId: 'job-1',
      status: 'queued',
    })
  })
})
