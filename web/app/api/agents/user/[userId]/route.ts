/**
 * GET /api/agents/user/[userId]
 * 
 * Get agents for a user (internal API for Edge Runtime)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    const agents = await prisma.agent.findMany({
      where: { userId },
      select: {
        id: true,
        status: true,
        name: true,
        tier: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 1,
    })

    return NextResponse.json(agents)
  } catch (error) {
    console.error('[API Agents] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    )
  }
}
