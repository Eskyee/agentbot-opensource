// Health adapter — pulls from the existing colony/status API.

export interface HealthSummary {
  status: 'healthy' | 'degraded' | 'unknown'
  soulActive: boolean
  lastCheck: string
}

export async function getColonyHealth(): Promise<HealthSummary> {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const res = await fetch(`${base}/api/colony/status?action=soul`, { cache: 'no-store' })
    if (!res.ok) return { status: 'degraded', soulActive: false, lastCheck: new Date().toISOString() }
    const data = await res.json()
    return {
      status: data.active ? 'healthy' : 'degraded',
      soulActive: data.active ?? false,
      lastCheck: new Date().toISOString(),
    }
  } catch {
    return { status: 'unknown', soulActive: false, lastCheck: new Date().toISOString() }
  }
}
