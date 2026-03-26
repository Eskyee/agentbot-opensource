import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { authOptions } from '@/app/lib/auth'
import { prisma } from '@/app/lib/prisma'

/**
 * GET /api/mission-control/fleet/bookings
 * Returns active booking requests for the user's fleet
 */
export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.email) {
    return NextResponse.json({ bookings: [] })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        agents: {
          where: { status: 'pending' },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!user) {
      return NextResponse.json({ bookings: [] })
    }

    // Pending agents = booking requests (agent was provisioned but container not ready yet)
    const bookings = user.agents.map((agent) => ({
      id: agent.id,
      agentName: agent.name,
      status: agent.status,
      tier: agent.tier,
      createdAt: agent.createdAt,
    }))

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error('[Bookings API] Error:', error)
    return NextResponse.json({ bookings: [] })
  }
}


export const dynamic = 'force-dynamic';
