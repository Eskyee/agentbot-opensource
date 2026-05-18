/**
 * Smoke tests for the NextAuth credential providers exported from
 * `@/app/lib/auth`. These verify the negative paths only — successful
 * logins are exercised end-to-end via Playwright.
 */

jest.mock('@/app/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock('bcryptjs', () => ({
  __esModule: true,
  default: { compare: jest.fn() },
  compare: jest.fn(),
}))

jest.mock('viem', () => ({
  __esModule: true,
  verifyMessage: jest.fn(),
  createPublicClient: jest.fn(() => ({})),
  http: jest.fn(() => () => ({})),
}))

jest.mock('viem/chains', () => ({
  base: { id: 8453, name: 'Base' },
}))

jest.mock('siwe', () => ({
  SiweMessage: class { constructor(public input: unknown) {} },
}))

jest.mock('@/app/lib/wallet-nonce', () => ({
  consumeWalletNonce: jest.fn(async () => true),
  generateWalletNonce: jest.fn(async () => 'nonce'),
}))

import type { CredentialsConfig } from 'next-auth/providers/credentials'
import { authOptions } from '@/app/lib/auth'
import { prisma } from '@/app/lib/prisma'
import bcrypt from 'bcryptjs'
import { verifyMessage } from 'viem'

type AuthorizeFn = NonNullable<CredentialsConfig['authorize']>

function findCredentials(id: string): AuthorizeFn {
  const all = (authOptions.providers || []) as unknown as Array<{
    id?: string
    name?: string
    type?: string
    options?: { id?: string; name?: string }
    authorize?: AuthorizeFn
  }>
  const provider = all.find(
    (p) =>
      p?.type === 'credentials' &&
      (p?.id === id ||
        p?.name === id ||
        p?.options?.id === id ||
        p?.options?.name === id),
  )
  if (!provider?.authorize) {
    throw new Error(
      `Credentials provider "${id}" not found. Available: ${all
        .map((p) => `${p?.id ?? '?'}/${p?.name ?? '?'}`)
        .join(', ')}`,
    )
  }
  return provider.authorize
}

const mockedPrisma = prisma as unknown as {
  user: {
    findUnique: jest.Mock
    findFirst: jest.Mock
    create: jest.Mock
    update: jest.Mock
  }
}

describe('Credentials authorize()', () => {
  beforeEach(() => jest.clearAllMocks())

  test('rejects login when password does not match', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      name: 'A',
      password: 'hashed',
    })
    ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

    const authorize = findCredentials('Credentials')
    const result = await authorize(
      { email: 'a@b.com', password: 'wrong' },
      {} as never
    )
    expect(result).toBeNull()
  })

  test('rejects login when user has no stored password (OAuth-only)', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      name: 'A',
      password: null,
    })

    const authorize = findCredentials('Credentials')
    const result = await authorize(
      { email: 'a@b.com', password: 'anything' },
      {} as never
    )
    expect(result).toBeNull()
    expect(bcrypt.compare).not.toHaveBeenCalled()
  })
})

describe('Wallet (SIWE) authorize()', () => {
  beforeEach(() => jest.clearAllMocks())

  test('rejects login when message/signature are missing', async () => {
    const authorize = findCredentials('wallet')
    const result = await authorize({}, {} as never)
    expect(result).toBeNull()
  })

  test('rejects login when signature does not verify', async () => {
    ;(verifyMessage as jest.Mock).mockResolvedValue(false)

    const message = 'Sign in to Agentbot\n\nWallet: 0x1111111111111111111111111111111111111111\nNonce: nonce-123\nTime: 2026-01-01'
    const authorize = findCredentials('wallet')
    const result = await authorize(
      { message, signature: '0xdeadbeef' },
      {} as never
    )
    expect(result).toBeNull()
  })
})
