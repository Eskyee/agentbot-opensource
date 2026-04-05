/**
 * GET /api/dashboard/data
 * 
 * Returns all dashboard data in a SINGLE request
 * This eliminates multiple round-trips and dramatically improves load time
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // PARALLEL QUERY EXECUTION - All queries run simultaneously
    const [
      userData,
      agentData,
      registration
    ] = await Promise.all([
      // Query 1: User basics
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          referralCredits: true,
          plan: true,
          openclawUrl: true,
          openclawInstanceId: true,
        }
      }),

      // Query 2: Agent info
      prisma.agent.findFirst({
        where: { userId },
        select: {
          id: true,
          status: true,
          name: true,
          tier: true,
        }
      }),

      // Query 3: Registration token
      prisma.$queryRaw<{ gateway_token: string | null }[]>`
        SELECT gateway_token FROM agent_registrations WHERE user_id = ${userId}
      `
    ])

    // Build response
    const response = {
      userId,
      credits: userData?.referralCredits || 0,
      plan: userData?.plan || 'free',
      openclawUrl: userData?.openclawUrl,
      openclawInstanceId: userData?.openclawInstanceId || agentData?.id,
      gatewayToken: registration[0]?.gateway_token,
      agent: agentData ? {
        id: agentData.id,
        status: agentData.status,
        name: agentData.name,
        tier: agentData.tier,
      } : null,
      health: {
        status: 'healthy',
        checks: [{ name: 'Database', status: 'ok' as const }]
      },
      meta: {
        responseTime: Date.now() - startTime,
        cached: false,
        timestamp: new Date().toISOString()
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('[Dashboard Data] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard data',
        details: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime
      },
      { status: 500 }
    )
  }
}
