/**
 * Smoke tests for /api/webhooks/stripe.
 *
 * Exercises the high-level signature-verification branch and the
 * happy-path checkout.session.completed update.
 */

jest.mock('@/app/lib/stripe', () => {
  const constructEvent = jest.fn()
  return { stripe: { webhooks: { constructEvent } } }
})

jest.mock('@/app/lib/prisma', () => ({
  prisma: {
    processedStripeEvent: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    user: {
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    ad_campaigns: {
      update: jest.fn(),
    },
  },
}))

jest.mock('@/app/lib/alerts', () => ({
  alertStripeFailure: jest.fn(),
  sendAlert: jest.fn(),
}))

jest.mock('@/app/lib/email', () => ({
  sendPaymentReceiptEmail: jest.fn(async () => undefined),
}))

jest.mock('@/app/lib/backend-client', () => ({
  signedFetch: jest.fn(async () => ({
    ok: true,
    status: 202,
    headers: { get: () => 'application/json' },
    json: async () => ({ job: { id: 'job-1' } }),
    text: async () => '',
  })),
}))

jest.mock('next/headers', () => ({
  headers: async () => ({ get: (k: string) => (k === 'stripe-signature' ? 'sig_test' : null) }),
}))

describe('POST /api/webhooks/stripe', () => {
  let POST: (req: Request) => Promise<Response>
  let constructEventMock: jest.Mock
  let mockedPrisma: {
    processedStripeEvent: { findUnique: jest.Mock; create: jest.Mock }
    user: { update: jest.Mock; updateMany: jest.Mock }
  }

  beforeAll(async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
    const route = await import('@/app/api/webhooks/stripe/route')
    POST = route.POST as typeof POST
    const { stripe } = await import('@/app/lib/stripe')
    constructEventMock = stripe.webhooks.constructEvent as unknown as jest.Mock
    const { prisma } = await import('@/app/lib/prisma')
    mockedPrisma = prisma as unknown as typeof mockedPrisma
  })

  beforeEach(() => {
    constructEventMock.mockReset()
    mockedPrisma.processedStripeEvent.findUnique.mockReset()
    mockedPrisma.processedStripeEvent.create.mockReset()
    mockedPrisma.user.update.mockReset()
  })

  test('rejects requests with an invalid Stripe signature', async () => {
    constructEventMock.mockImplementation(() => {
      throw new Error('Webhook signature verification failed')
    })

    const request = new Request('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      body: JSON.stringify({ id: 'evt_invalid', type: 'checkout.session.completed' }),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toMatchObject({ error: 'Invalid signature' })
  })

  test('updates user subscription on checkout.session.completed', async () => {
    mockedPrisma.processedStripeEvent.findUnique.mockResolvedValue(null)
    mockedPrisma.processedStripeEvent.create.mockResolvedValue({})
    mockedPrisma.user.update.mockResolvedValue({})

    constructEventMock.mockReturnValue({
      id: 'evt_1',
      type: 'checkout.session.completed',
      data: {
        object: {
          customer_details: { email: 'buyer@example.com' },
          customer_email: 'buyer@example.com',
          customer: 'cus_1',
          subscription: 'sub_1',
          metadata: { userId: 'user-1', plan: 'solo' },
          amount_total: 2900,
        },
      },
    })

    const request = new Request('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      body: 'raw-body-bytes',
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
    expect(mockedPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          plan: 'solo',
          stripeCustomerId: 'cus_1',
          stripeSubscriptionId: 'sub_1',
          subscriptionStatus: 'active',
        }),
      })
    )
  })
})
