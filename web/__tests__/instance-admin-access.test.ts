jest.mock('@/app/lib/getAuthSession', () => ({
  getAuthSession: jest.fn(),
}))

jest.mock('@/app/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('@/app/lib/admin', () => ({
  isAdminEmail: jest.fn(),
}))

import { getAuthSession } from '@/app/lib/getAuthSession'
import { isAdminEmail } from '@/app/lib/admin'
import { prisma } from '@/app/lib/prisma'
import { verifyInstanceOwnership } from '@/app/api/instance/_auth'
import { getOwnedOpenClawUser } from '@/app/api/instance/_runtime'

describe('instance admin access', () => {
  const mockedSession = getAuthSession as jest.Mock
  const mockedIsAdminEmail = isAdminEmail as jest.Mock
  const mockedUser = prisma.user as unknown as {
    findFirst: jest.Mock
    findUnique: jest.Mock
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockedIsAdminEmail.mockReset()
    mockedUser.findFirst.mockReset()
    mockedUser.findUnique.mockReset()
  })

  test('allows admins to verify ownership by target instance id', async () => {
    mockedSession.mockResolvedValue({
      user: {
        id: 'admin-user',
        email: 'admin@example.com',
      },
    })
    mockedIsAdminEmail.mockReturnValue(true)
    mockedUser.findFirst.mockResolvedValue({ id: 'target-user' })

    const result = await verifyInstanceOwnership('instance-123')

    expect(result).toBe(true)
    expect(mockedUser.findFirst).toHaveBeenCalledWith({
      where: { openclawInstanceId: 'instance-123' },
      select: { id: true },
    })
  })

  test('allows admins to resolve another users runtime for control actions', async () => {
    mockedSession.mockResolvedValue({
      user: {
        id: 'admin-user',
        email: 'admin@example.com',
      },
    })
    mockedIsAdminEmail.mockReturnValue(true)
    mockedUser.findFirst.mockResolvedValue({
      id: 'target-user',
      openclawInstanceId: 'instance-123',
      openclawUrl: 'https://runtime.example.com',
      plan: 'solo',
    })

    const result = await getOwnedOpenClawUser('instance-123')

    expect('user' in result).toBe(true)
    if ('user' in result) {
      expect(result.user).toMatchObject({
        id: 'target-user',
        openclawInstanceId: 'instance-123',
        openclawUrl: 'https://runtime.example.com',
      })
    }
  })
})
