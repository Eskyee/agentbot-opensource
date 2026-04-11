import crypto from 'crypto'

const DEFAULT_TTL_SECONDS = 60 * 60 * 4

export interface BasefmSessionTokenPayload {
  sessionId: number
  wallet: string
  userId: string | null
  exp: number
}

function getBasefmSessionSecret(): string {
  const secret =
    process.env.BASEFM_SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.MUX_TOKEN_SECRET

  if (secret) return secret

  if (process.env.NODE_ENV === 'production') {
    throw new Error('BASEFM_SESSION_SECRET, NEXTAUTH_SECRET, or MUX_TOKEN_SECRET must be set in production')
  }

  return 'basefm-session-dev-secret'
}

function signPayload(encodedPayload: string): string {
  return crypto
    .createHmac('sha256', getBasefmSessionSecret())
    .update(encodedPayload)
    .digest('base64url')
}

export function createBasefmSessionToken(args: {
  sessionId: number
  wallet: string
  userId?: string | null
  ttlSeconds?: number
}) {
  const payload: BasefmSessionTokenPayload = {
    sessionId: args.sessionId,
    wallet: args.wallet,
    userId: args.userId ?? null,
    exp: Math.floor(Date.now() / 1000) + (args.ttlSeconds ?? DEFAULT_TTL_SECONDS),
  }
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${encodedPayload}.${signPayload(encodedPayload)}`
}

export function verifyBasefmSessionToken(token: string): BasefmSessionTokenPayload | null {
  const [encodedPayload, providedSignature] = token.split('.')
  if (!encodedPayload || !providedSignature) return null

  const expectedSignature = signPayload(encodedPayload)
  const expected = Buffer.from(expectedSignature)
  const provided = Buffer.from(providedSignature)

  if (expected.length !== provided.length) return null
  if (!crypto.timingSafeEqual(expected, provided)) return null

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString()) as Partial<BasefmSessionTokenPayload>
    if (
      typeof payload.sessionId !== 'number' ||
      typeof payload.wallet !== 'string' ||
      (payload.userId !== null && payload.userId !== undefined && typeof payload.userId !== 'string') ||
      typeof payload.exp !== 'number'
    ) {
      return null
    }

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      return null
    }

    return {
      sessionId: payload.sessionId,
      wallet: payload.wallet,
      userId: payload.userId ?? null,
      exp: payload.exp,
    }
  } catch {
    return null
  }
}
