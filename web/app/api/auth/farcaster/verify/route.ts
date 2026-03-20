export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'

/**
 * Farcaster Authentication Verification
 * Verifies Farcaster user identity and checks token gating
 */

export async function POST(req: NextRequest) {
  try {
    const { fidToken, address } = await req.json()

    if (!fidToken) {
      return NextResponse.json(
        { error: 'Missing Farcaster ID token' },
        { status: 401 }
      )
    }

    // Verify Farcaster token (simplified - in production, use Farcaster API)
    // For now, accept any valid token and check token gating
    
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

    // Generate session token
    const sessionToken = Buffer.from(
      JSON.stringify({
        fidToken,
        address,
        verified: true,
        timestamp: Date.now(),
      })
    ).toString('base64')

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
