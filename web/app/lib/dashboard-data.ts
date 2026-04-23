/**
 * dashboard-data.ts - Optimized Dashboard Data Fetching
 * 
 * Uses the consolidated /api/dashboard/data endpoint
 * for maximum performance and edge caching.
 */

import { cache } from 'react'

export interface DashboardData {
  userId: string
  credits: number
  plan?: string
  openclawUrl?: string
  openclawInstanceId?: string
  gatewayToken?: string
  instance?: InstanceData
  stats?: any
  communityRewards?: any
  health?: HealthStatus
}

export interface InstanceData {
  userId: string
  status: string
  statusReason?: string | null
  probeChecks?: any[]
  subdomain?: string
  url: string
  plan: string
  openclawVersion?: string
  ffmpegAvailable?: boolean
  provisionedAt?: string | null
  lastSeenAt?: string | null
  gatewayProcessStatus?: string | null
  subscriptionStatus?: string | null
}

export interface HealthStatus {
  status: string
  checks: Array<{ name: string; status: 'ok' | 'degraded' | 'down'; detail?: string }>
}

/**
 * Fetch all dashboard data from the consolidated endpoint.
 * Cached at the fetch level with s-maxage=5.
 */
export const fetchDashboardData = cache(async (): Promise<DashboardData | null> => {
  try {
    const res = await fetch('/api/dashboard/data', {
      next: { revalidate: 5 } // Cache for 5 seconds
    })
    if (!res.ok) return null
    return await res.json()
  } catch (error) {
    console.error('[DashboardData] Fetch error:', error)
    return null
  }
})

/**
 * Legacy compatibility wrapper for the parallel fetch pattern
 */
export async function fetchDashboardDataParallel(): Promise<{
  data: DashboardData | null
  timings: Record<string, number>
}> {
  const startTime = Date.now()
  const data = await fetchDashboardData()
  const total = Date.now() - startTime

  return {
    data,
    timings: { total }
  }
}
