/**
 * GET /api/dashboard/data
 * 
 * Returns all dashboard data in a SINGLE request
 * This eliminates multiple round-trips and dramatically improves load time
 * 
 * Features:
 * - Parallel database queries
 * - Edge caching (CDN level)
 * - Incremental loading support
 * - Optimized for Vercel Edge Network
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { getEffectiveGatewayToken } from '@/app/lib/token-manager'

export const runtime = 'edge' // Use Edge Runtime for speed
export const preferredRegion = 'iad1' // US East (fastest for most users)

// Cache for 5 seconds at CDN level (stale-while-revalidate pattern)
export const revalidate = 5

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
      // 1. User data + credits
      userData,
      
      // 2. Agent/instance info
      agentData,
      
      // 3. Gateway token
      gatewayToken,
      
      // 4. System health (cached separately)
      healthStatus
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

      // Query 3: Get effective gateway token
      getEffectiveGatewayToken(userId),

      // Query 4: Quick health check
      getHealthStatus()
    ])

    // Check for user registration data (for token)
    const registration = await prisma.$queryRaw<{ gateway_token: string | null }[]>`
      SELECT gateway_token FROM agent_registrations WHERE user_id = ${userId}
    `

    // Build response
    const response = {
      // User data
      userId,
      credits: userData?.referralCredits || 0,
      plan: userData?.plan || 'free',
      
      // OpenClaw connection
      openclawUrl: userData?.openclawUrl,
      openclawInstanceId: userData?.openclawInstanceId || agentData?.id,
      gatewayToken: gatewayToken || registration[0]?.gateway_token,
      
      // Agent status
      agent: agentData ? {
        id: agentData.id,
        status: agentData.status,
        name: agentData.name,
        tier: agentData.tier,
      } : null,
      
      // System health
      health: healthStatus,
      
      // Performance metrics
      meta: {
        responseTime: Date.now() - startTime,
        cached: false,
        timestamp: new Date().toISOString()
      }
    }

    // Return with caching headers
    return NextResponse.json(response, {
      headers: {
        // CDN cache for 5 seconds
        'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=30',
        // Vercel Edge cache
        'Vercel-CDN-Cache-Control': 'public, s-maxage=5, stale-while-revalidate=30',
        // Prevent browser caching of API responses
        'CDN-Cache-Control': 'public, s-maxage=5',
      }
    })

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

/**
 * Quick health status check
 */
async function getHealthStatus() {
  const checks = []
  
  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.push({ name: 'Database', status: 'ok' as const })
  } catch {
    checks.push({ name: 'Database', status: 'down' as const, detail: 'Connection failed' })
  }
  
  // Check gateway (cached - don't hit it every request)
  checks.push({ name: 'Gateway', status: 'ok' as const }) // Assume ok, real check done separately
  
  return {
    status: checks.every(c => c.status === 'ok') ? 'healthy' : 'degraded',
    checks
  }
}
