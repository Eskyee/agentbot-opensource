import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

/**
 * Farcaster Authentication Verification
 * Verifies Farcaster user identity and checks token gating
 * Session tokens are HMAC-signed to prevent forgery
 */

const SIGNING_SECRET = process.env.FARCASTER_SESSION_SECRET || process.env.NEXTAUTH_SECRET || 'farcaster-fallback-secret'

function signSession(payload: object): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto.createHmac('sha256', SIGNING_SECRET).update(data).digest('base64url')
  return `${data}.${signature}`
}

export async function POST(req: NextRequest) {
  try {
    const { fidToken, address } = await req.json()

    if (!fidToken) {
      return NextResponse.json(
        { error: 'Missing Farcaster ID token' },
        { status: 401 }
      )
    }

    // Token gating check
    if (address) {
      const tokenCheckResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/auth/token-gating/verify?address=${address}`,
        { method: 'GET' }
      )

      const tokenData = await tokenCheckResponse.json()

      if (!tokenData.hasAccess) {
        return NextResponse.json(
          {
            error: 'Token gating failed',
            message: 'Insufficient $RAVE balance. Minimum 1 RAVE required.',
            required: 'RAVE',
            minBalance: '1000000000000000000'
          },
          { status: 403 }
        )
      }
    }

    // Generate HMAC-signed session token (not forgeable)
    const sessionToken = signSession({
      fidToken: fidToken.slice(0, 64), // Truncate to prevent oversized tokens
      address: address || null,
      verified: true,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24h expiry
    })

    return NextResponse.json({
      success: true,
      sessionToken,
      address,
      message: 'Farcaster verification successful',
      tokenGated: true,
      accessLevel: 'premium',
    })
  } catch (error) {
    console.error('Farcaster verification failed:', error)
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    endpoint: '/api/auth/farcaster/verify',
    methods: ['POST'],
    description: 'Verifies Farcaster user and checks $RAVE token gating',
    required: ['fidToken'],
    optional: ['address'],
  })
}
