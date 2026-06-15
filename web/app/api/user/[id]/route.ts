/**
 * GET /api/user/[id]
 * 
 * Get user by ID (internal API for Edge Runtime)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { getAuthSession } from '@/app/lib/getAuthSession'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Allow internal service calls with INTERNAL_API_TOKEN
    const authHeader = req.headers.get('authorization')
    const serviceToken = process.env.INTERNAL_API_TOKEN
    const isServiceCall = serviceToken && authHeader === `Bearer ${serviceToken}`

    if (!isServiceCall) {
      // Otherwise require authenticated session and ownership
      const session = await getAuthSession()
      if (!session?.user?.id || session.user.id !== id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
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
