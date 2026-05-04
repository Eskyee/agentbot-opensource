/**
 * Smoke tests for /api/webhooks/stripe.
 *
 * Verifies:
 *   - Signature-verification rejects bad signatures with 400.
 *   - Idempotency-first: a duplicate event returns 200 without re-running side effects.
 *   - 200 is returned to Stripe before deferred side effects run, and the
 *     side effects are scheduled via next/server's `after()`.
 *   - The deferred handler updates the user on checkout.session.completed.
 */

const afterCallbacks: Array<() => unknown | Promise<unknown>> = []

jest.mock('next/server', () => {
  const actual = jest.requireActual('next/server')
  return {
    ...actual,
    after: (callback: () => unknown | Promise<unknown>) => {
      afterCallbacks.push(callback)
    },
  }
})

const flushAfter = async () => {
  while (afterCallbacks.length > 0) {
    const cb = afterCallbacks.shift()!
    await cb()
  }
}

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
    afterCallbacks.length = 0
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
    expect(mockedPrisma.processedStripeEvent.create).not.toHaveBeenCalled()
  })

  test('returns 200 fast, deferring side effects to after() — duplicate events short-circuit', async () => {
    // Simulate the Prisma unique-constraint violation that Stripe retries hit.
    mockedPrisma.processedStripeEvent.create.mockRejectedValue(
      Object.assign(new Error('duplicate'), { code: 'P2002' }),
    )
    constructEventMock.mockReturnValue({
      id: 'evt_dup',
      type: 'checkout.session.completed',
      data: { object: { metadata: { userId: 'user-1', plan: 'solo' } } },
    })

    const request = new Request('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      body: 'raw',
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({ received: true, deduped: true })
    // Critical: deduped events must NOT schedule any side-effect work.
    expect(afterCallbacks).toHaveLength(0)
    expect(mockedPrisma.user.update).not.toHaveBeenCalled()
  })

  test('claims the event before responding 200, and defers user update to after()', async () => {
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

    // 200 returned BEFORE any side effect runs.
    expect(response.status).toBe(200)
    expect(mockedPrisma.processedStripeEvent.create).toHaveBeenCalledWith({
      data: { eventId: 'evt_1', type: 'checkout.session.completed' },
    })
    expect(mockedPrisma.user.update).not.toHaveBeenCalled()
    expect(afterCallbacks).toHaveLength(1)

    // Now flush the deferred work and confirm the user got updated.
    await flushAfter()

    expect(mockedPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          plan: 'solo',
          stripeCustomerId: 'cus_1',
          stripeSubscriptionId: 'sub_1',
          subscriptionStatus: 'active',
        }),
      }),
    )
  })
})
