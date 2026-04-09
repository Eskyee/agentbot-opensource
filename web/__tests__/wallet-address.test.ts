jest.mock('@/app/lib/getAuthSession', () => ({
  getAuthSession: jest.fn(),
}))

jest.mock('@/app/lib/prisma', () => ({
  prisma: {
    wallet: {
      findFirst: jest.fn(),
    },
  },
}))

import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { GET } from '@/app/api/wallet/address/route'

describe('/api/wallet/address', () => {
  const mockedSession = getAuthSession as jest.Mock
  const mockedFindFirst = prisma.wallet.findFirst as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns the stored managed wallet when one exists', async () => {
    mockedSession.mockResolvedValue({
      user: { id: 'user-1', email: '0x1111111111111111111111111111111111111111@wallet.agentbot' },
    })
    mockedFindFirst.mockResolvedValue({
      address: '0x2222222222222222222222222222222222222222',
      network: 'base',
      walletType: 'cdp',
    })

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      authenticated: true,
      address: '0x2222222222222222222222222222222222222222',
      network: 'base',
      type: 'cdp',
      source: 'managed',
    })
  })

  test('falls back to the signed-in Base wallet address when no managed wallet exists', async () => {
    mockedSession.mockResolvedValue({
      user: { id: 'user-1', email: '0x1111111111111111111111111111111111111111@wallet.agentbot' },
    })
    mockedFindFirst.mockResolvedValue(null)

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      authenticated: true,
      address: '0x1111111111111111111111111111111111111111',
      network: 'base',
      type: 'base-auth',
      source: 'session',
    })
  })
})
