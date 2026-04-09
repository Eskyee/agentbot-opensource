jest.mock('@/app/lib/getAuthSession', () => ({
  getAuthSession: jest.fn(),
}))

jest.mock('@/app/lib/prisma', () => ({
  prisma: {
    user: {
      update: jest.fn(),
    },
  },
}))

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        retrieve: jest.fn(),
      },
    },
  }))
})

import { NextRequest } from 'next/server'
import Stripe from 'stripe'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { GET } from '@/app/api/checkout/verify/route'

describe('/api/checkout/verify', () => {
  const MockedStripe = Stripe as unknown as jest.Mock
  const mockedSession = getAuthSession as jest.Mock
  const mockedUpdate = prisma.user.update as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.STRIPE_SECRET_KEY = 'sk_test_123'
    mockedSession.mockResolvedValue({
      user: { id: 'user-1' },
    })
    mockedUpdate.mockResolvedValue({})
  })

  test('persists subscription state before returning success', async () => {
    const retrieve = jest.fn().mockResolvedValue({
      payment_status: 'paid',
      metadata: { userId: 'user-1', plan: 'collective' },
      customer: 'cus_123',
      subscription: {
        id: 'sub_123',
        status: 'active',
        current_period_end: 1_800_000_000,
      },
    })
    MockedStripe.mockImplementation(() => ({
      checkout: {
        sessions: { retrieve },
      },
    }))

    const request = new NextRequest('http://localhost/api/checkout/verify?session_id=cs_test_123')
    const response = await GET(request)
    const body = await response.json()

    expect(retrieve).toHaveBeenCalledWith('cs_test_123', { expand: ['subscription'] })
    expect(mockedUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: expect.objectContaining({
        subscriptionStatus: 'active',
        plan: 'collective',
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
      }),
    })
    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      plan: 'collective',
      status: 'active',
      customerId: 'cus_123',
      subscriptionId: 'sub_123',
    })
  })

  test('rejects sessions that belong to another user', async () => {
    const retrieve = jest.fn().mockResolvedValue({
      payment_status: 'paid',
      metadata: { userId: 'user-2', plan: 'solo' },
      customer: 'cus_123',
      subscription: null,
    })
    MockedStripe.mockImplementation(() => ({
      checkout: {
        sessions: { retrieve },
      },
    }))

    const request = new NextRequest('http://localhost/api/checkout/verify?session_id=cs_test_456')
    const response = await GET(request)

    expect(response.status).toBe(403)
    expect(mockedUpdate).not.toHaveBeenCalled()
  })
})
