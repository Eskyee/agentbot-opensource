import { NextResponse } from 'next/server'

const SERVICES = [
  { name: 'Agentbot API', url: 'https://agentbot-prod-production.up.railway.app/health' },
  { name: 'Tempo Soul', url: 'https://tempo-x402-production.up.railway.app/health' },
  { name: 'x402 Gateway', url: 'https://x402-gateway-production.up.railway.app/health' },
]

export async function GET() {
  const results = await Promise.all(
    SERVICES.map(async (service) => {
      try {
        const res = await fetch(service.url, { signal: AbortSignal.timeout(4000) })
        if (!res.ok) {
          return { name: service.name, status: 'degraded', detail: `HTTP ${res.status}` }
        }
        const body = await res.json().catch(() => null)
        return {
          name: service.name,
          status: 'ok',
          detail: typeof body === 'object' && body !== null ? body.status || body.build || 'ok' : 'ok',
        }
      } catch (error: any) {
        return { name: service.name, status: 'down', detail: error?.message || 'unreachable' }
      }
    })
  )

  return NextResponse.json({
    services: results,
    timestamp: new Date().toISOString(),
  }, {
    headers: {
      'Cache-Control': 'max-age=30, stale-while-revalidate=60',
    },
  })
}

export const dynamic = 'force-dynamic'
