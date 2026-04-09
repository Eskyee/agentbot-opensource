/**
 * dashboard-data.ts - Optimized Dashboard Data Fetching
 * 
 * Fetches all dashboard data in parallel with caching
 * Reduces load time from sequential to parallel execution
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
  gatewayStatus?: GatewayStatus
  health?: HealthStatus
  bootstrap?: BootstrapData
}

export interface InstanceData {
  status: string
  url: string
  plan: string
  cpu?: string
  memory?: string
  uptime?: string
  messages?: number
  errors?: number
  health?: string
  botUsername?: string
}

export interface GatewayStatus {
  health: string
  sessions: { total: number; active: number }
  cron: { total: number; enabled: number }
}

export interface HealthStatus {
  services: Array<{ name: string; status: 'ok' | 'degraded' | 'down'; detail?: string }>
}

export interface BootstrapData {
  credits: number
  plan?: string
  openclawUrl?: string
  openclawInstanceId?: string
  gatewayToken?: string
}

// Cache bootstrap data for 30 seconds (credits don't change often)
export const fetchBootstrap = cache(async (): Promise<BootstrapData | null> => {
  try {
    const res = await fetch('/api/dashboard/bootstrap', {
      next: { revalidate: 30 } // Cache for 30 seconds
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
})

// Fetch gateway status (cache 10 seconds - changes more frequently)
export const fetchGatewayStatus = cache(async (): Promise<GatewayStatus | null> => {
  try {
    const res = await fetch('/api/gateway/status', {
      next: { revalidate: 10 }
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
})

// Fetch health checks (cache 15 seconds)
export const fetchHealthChecks = cache(async (): Promise<HealthStatus | null> => {
  try {
    const res = await fetch('/api/dashboard/health', {
      next: { revalidate: 15 }
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
})

// Fetch instance data (no cache - this is user-specific)
export async function fetchInstance(userId: string): Promise<InstanceData | null> {
  try {
    const res = await fetch(`/api/instance/${userId}`, {
      cache: 'no-store' // Always fresh
    })
    if (!res.ok) return null
    const data = await res.json()
    return {
      status: data.status,
      url: data.url,
      plan: data.plan,
      botUsername: data.botUsername,
      ...data.stats
    }
  } catch {
    return null
  }
}

/**
 * Fetch all dashboard data in parallel
 * This is the key optimization - everything loads at once
 */
export async function fetchDashboardData(userId?: string): Promise<DashboardData> {
  // Start all independent fetches in parallel
  const [bootstrapResult, gatewayResult, healthResult] = await Promise.allSettled([
    fetchBootstrap(),
    fetchGatewayStatus(),
    fetchHealthChecks()
  ])

  // Extract results
  const bootstrap = bootstrapResult.status === 'fulfilled' ? bootstrapResult.value : null
  const gatewayStatus = gatewayResult.status === 'fulfilled' ? gatewayResult.value : null
  const health = healthResult.status === 'fulfilled' ? healthResult.value : null
  
  const effectiveUserId = userId || bootstrap?.openclawInstanceId
  
  // If we have a userId, fetch instance data
  let instance: InstanceData | null = null
  if (effectiveUserId) {
    instance = await fetchInstance(effectiveUserId)
  }

  return {
    userId: effectiveUserId || '',
    credits: bootstrap?.credits || 0,
    plan: bootstrap?.plan,
    openclawUrl: bootstrap?.openclawUrl,
    openclawInstanceId: bootstrap?.openclawInstanceId,
    gatewayToken: bootstrap?.gatewayToken,
    instance: instance || undefined,
    gatewayStatus: gatewayStatus || undefined,
    health: health || undefined,
    bootstrap: bootstrap || undefined
  }
}

/**
 * Optimized parallel fetch for dashboard loading
 * Used by the main dashboard component
 */
export async function fetchDashboardDataParallel(userId?: string): Promise<{
  data: DashboardData
  timings: Record<string, number>
}> {
  const timings: Record<string, number> = {}
  const startTime = Date.now()

  // Parallel fetch all data sources
  const bootstrapPromise = (async () => {
    const t0 = Date.now()
    const result = await fetchBootstrap()
    timings.bootstrap = Date.now() - t0
    return result
  })()
  
  const gatewayPromise = (async () => {
    const t0 = Date.now()
    const result = await fetchGatewayStatus()
    timings.gatewayStatus = Date.now() - t0
    return result
  })()
  
  const healthPromise = (async () => {
    const t0 = Date.now()
    const result = await fetchHealthChecks()
    timings.health = Date.now() - t0
    return result
  })()

  // Wait for bootstrap first to get userId
  const bootstrap = await bootstrapPromise
  const effectiveUserId = userId || bootstrap?.openclawInstanceId

  // Add instance fetch if we have userId
  let instance: InstanceData | null = null
  if (effectiveUserId) {
    const t0 = Date.now()
    instance = await fetchInstance(effectiveUserId)
    timings.instance = Date.now() - t0
  }

  // Wait for remaining promises
  const [gatewayStatus, health] = await Promise.all([
    gatewayPromise,
    healthPromise
  ])

  timings.total = Date.now() - startTime

  return {
    data: {
      userId: effectiveUserId || '',
      credits: bootstrap?.credits || 0,
      plan: bootstrap?.plan,
      openclawUrl: bootstrap?.openclawUrl,
      openclawInstanceId: bootstrap?.openclawInstanceId,
      gatewayToken: bootstrap?.gatewayToken,
      instance: instance || undefined,
      gatewayStatus: gatewayStatus || undefined,
      health: health || undefined,
      bootstrap: bootstrap || undefined
    },
    timings
  }
}
