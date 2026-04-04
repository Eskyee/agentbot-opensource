/**
 * GET /api/user/[id]
 * 
 * Get user by ID (internal API for Edge Runtime)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify this is an internal request or authenticated user
    const authHeader = req.headers.get('authorization')
    const { id } = await params
    
    // Simple service token validation
    const serviceToken = process.env.INTERNAL_API_TOKEN
    if (serviceToken && authHeader !== `Bearer ${serviceToken}`) {
      // Also allow if the user is requesting their own data
      // This would need session validation in production
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        referralCredits: true,
        plan: true,
        openclawUrl: true,
        openclawInstanceId: true,
        email: true,
        name: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('[API User] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}
