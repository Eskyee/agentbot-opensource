/**
 * GET /api/registration/token
 * 
 * Get gateway token for user (internal API for Edge Runtime)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId required' },
        { status: 400 }
      )
    }

    const registration = await prisma.$queryRaw<
      { gateway_token: string | null }[]
    >`
      SELECT gateway_token 
      FROM agent_registrations 
      WHERE user_id = ${userId}
      LIMIT 1
    `

    return NextResponse.json({
      gateway_token: registration[0]?.gateway_token || null,
    })
  } catch (error) {
    console.error('[API Registration Token] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch token' },
      { status: 500 }
    )
  }
}
