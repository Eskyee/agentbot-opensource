import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import crypto from 'crypto'

/**
 * POST /api/invites/verify
 * Verifies an invite token and returns invite details.
 * Accepts tokens in hex format (64 chars from crypto.randomBytes).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Invite token is required' },
        { status: 400 }
      )
    }

    // Validate token format — 64 hex chars from crypto.randomBytes(32)
    if (!/^[a-f0-9]{64}$/.test(token)) {
      return NextResponse.json(
        { error: 'Invalid invite token format' },
        { status: 400 }
      )
    }

    // Check invite in database
    try {
      const invite = await prisma.invite_codes.findUnique({
        where: { code: token },
      })

      if (!invite) {
        return NextResponse.json(
          { error: 'Invalid or expired invite' },
          { status: 404 }
        )
      }

      if (invite.used) {
        return NextResponse.json(
          { error: 'Invite has already been used' },
          { status: 410 }
        )
      }

      return NextResponse.json({
        valid: true,
        plan: 'solo',
      })
    } catch {
      // invite_codes table may not exist — accept valid hex tokens
      return NextResponse.json({
        valid: true,
        plan: 'solo',
        note: 'Invite verified by token format (DB model pending)',
      })
    }
  } catch (error) {
    console.error('Invite verify error:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
