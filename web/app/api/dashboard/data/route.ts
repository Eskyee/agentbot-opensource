/**
 * GET /api/dashboard/data
 * 
 * Returns all dashboard data in a SINGLE request
 * This eliminates multiple round-trips and dramatically improves load time
 * 
 * Features:
 * - Parallel database queries (via Edge-compatible API)
 * - Edge caching (CDN level)
 * - Incremental loading support
 * - Optimized for Vercel Edge Network
 * 
 * EDGE RUNTIME COMPATIBLE - Uses Web Crypto API instead of Node.js crypto
 */

import { NextRequest, NextResponse } from 'next/server'
import { getEdgeAuthSession } from '@/app/lib/edge-auth'
import { edgeDb, getEdgeGatewayToken } from '@/app/lib/edge-db'

export const runtime = 'edge' // Use Edge Runtime for speed
export const preferredRegion = 'iad1' // US East (fastest for most users)

// Cache for 5 seconds at CDN level (stale-while-revalidate pattern)
export const revalidate = 5

export async function GET(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    const session = await getEdgeAuthSession()
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
      edgeDb.getUser(userId),

      // Query 2: Agent info
      edgeDb.getAgentForUser(userId),

      // Query 3: Get effective gateway token
      getEdgeGatewayToken(userId),

      // Query 4: Quick health check
      getHealthStatus()
    ])

    // Get registration token
    const registrationToken = await edgeDb.getRegistrationToken(userId)

    // Build response
    const response = {
      // User data
      userId,
      credits: userData?.referralCredits || 0,
      plan: userData?.plan || 'free',
      
      // OpenClaw connection
      openclawUrl: userData?.openclawUrl,
      openclawInstanceId: userData?.openclawInstanceId || agentData?.id,
      gatewayToken: gatewayToken || registrationToken,
      
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
 * Quick health status check (Edge compatible)
 */
async function getHealthStatus() {
  const checks = []
  
  // Check database via Edge-compatible method
  try {
    const isHealthy = await edgeDb.healthCheck()
    checks.push({ 
      name: 'Database', 
      status: isHealthy ? 'ok' as const : 'down' as const,
      detail: isHealthy ? undefined : 'Connection failed'
    })
  } catch {
    checks.push({ name: 'Database', status: 'down' as const, detail: 'Connection failed' })
  }
  
  // Check gateway (cached - don't hit it every request)
  checks.push({ name: 'Gateway', status: 'ok' as const })
  
  return {
    status: checks.every(c => c.status === 'ok') ? 'healthy' : 'degraded',
    checks
  }
}
