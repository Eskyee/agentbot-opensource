jest.mock('@/app/lib/getAuthSession', () => ({
  getAuthSession: jest.fn(),
}))

jest.mock('@/app/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}))

import { NextRequest } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { POST } from '@/app/api/v1/credits/route'

describe('/api/v1/credits', () => {
  const mockedSession = getAuthSession as jest.Mock
  const mockedUser = prisma.user as unknown as {
    findUnique: jest.Mock
    update: jest.Mock
    updateMany: jest.Mock
  }

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.OPENCLAW_GATEWAY_URL = 'https://gateway.example.com'
    process.env.OPENCLAW_GATEWAY_TOKEN = 'gateway-token'
    mockedSession.mockResolvedValue({
      user: { id: 'user-1', email: 'user@example.com' },
    })
    mockedUser.findUnique
      .mockResolvedValueOnce({ id: 'user-1', referralCredits: 5 })
      .mockResolvedValueOnce({ referralCredits: 5 })
    mockedUser.updateMany.mockResolvedValue({ count: 1 })
    mockedUser.update.mockResolvedValue({})
    global.fetch = jest.fn()
  })

  test('refunds the credit when the upstream gateway responds with an error status', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 429,
      headers: new Headers({ 'content-type': 'application/json' }),
      text: jest.fn().mockResolvedValue(JSON.stringify({ error: 'rate_limited' })),
    })

    const request = new NextRequest('http://localhost/api/v1/credits', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'hi' }],
      }),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(429)
    expect(body).toMatchObject({ error: 'rate_limited' })
    expect(mockedUser.updateMany).toHaveBeenCalledWith({
      where: { id: 'user-1', referralCredits: { gte: 1 } },
      data: { referralCredits: { decrement: 1 } },
    })
    expect(mockedUser.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { referralCredits: { increment: 1 } },
    })
    expect(response.headers.get('X-Credits-Refunded')).toBe('1')
  })
})
