import { createBasefmSessionToken, verifyBasefmSessionToken } from '@/app/lib/basefmSession'

describe('baseFM session tokens', () => {
  beforeEach(() => {
    process.env.BASEFM_SESSION_SECRET = 'test-basefm-secret'
  })

  test('round-trips a valid session token payload', () => {
    const token = createBasefmSessionToken({
      sessionId: 42,
      wallet: '0xabc123',
      userId: 'user-1',
      ttlSeconds: 60,
    })

    expect(verifyBasefmSessionToken(token)).toMatchObject({
      sessionId: 42,
      wallet: '0xabc123',
      userId: 'user-1',
    })
  })

  test('rejects tampered tokens', () => {
    const token = createBasefmSessionToken({
      sessionId: 42,
      wallet: '0xabc123',
      userId: null,
      ttlSeconds: 60,
    })

    const [payload] = token.split('.')
    expect(verifyBasefmSessionToken(`${payload}.invalid-signature`)).toBeNull()
  })
})
