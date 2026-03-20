export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'

/**
 * Farcaster Token Refresh
 * Refreshes Farcaster authentication tokens
 */

export async function POST(req: NextRequest) {
  try {
    const { refreshToken } = await req.json()

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Missing refresh token' },
        { status: 400 }
      )
    }

    // Decode refresh token
    const decoded = JSON.parse(
      Buffer.from(refreshToken, 'base64').toString('utf-8')
    )

    if (!decoded.fidToken) {
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      )
    }

    // Generate new session token
    const newSessionToken = Buffer.from(
      JSON.stringify({
        fidToken: decoded.fidToken,
        address: decoded.address,
        verified: true,
        timestamp: Date.now(),
        refreshedAt: new Date().toISOString(),
      })
    ).toString('base64')

    return NextResponse.json({
      success: true,
      sessionToken: newSessionToken,
      expiresIn: 86400, // 24 hours
      message: 'Token refreshed successfully',
    })
  } catch (error) {
    console.error('Token refresh failed:', error)
    return NextResponse.json(
      { error: 'Token refresh failed' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/auth/farcaster/refresh',
    methods: ['POST'],
    description: 'Refreshes Farcaster authentication token',
    required: ['refreshToken'],
  })
}
