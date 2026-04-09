import { AGENTBOT_BACKEND_URL, SOUL_SERVICE_URL, X402_GATEWAY_URL } from './platform-urls'

export interface ServiceHealth {
  name: string
  url: string
}

export interface ServiceStatus {
  name: string
  status: 'ok' | 'degraded' | 'down'
  detail?: string
}

export const HEALTH_SERVICES: ServiceHealth[] = [
  { name: 'Agentbot API', url: `${AGENTBOT_BACKEND_URL}/health` },
  { name: 'Tempo Soul', url: `${SOUL_SERVICE_URL}/soul/status` },
  { name: 'x402 Gateway', url: `${X402_GATEWAY_URL}/health` },
]

export async function checkServices(services: ServiceHealth[] = HEALTH_SERVICES): Promise<ServiceStatus[]> {
  return Promise.all(
    services.map(async (service) => {
      try {
        const res = await fetch(service.url, { signal: AbortSignal.timeout(4000) })
        if (!res.ok) {
          return { name: service.name, status: 'degraded', detail: `HTTP ${res.status}` }
        }
        const body = await res.json().catch(() => null)
        const detail =
          typeof body === 'object' && body !== null
            ? ('status' in body && typeof body.status === 'string'
                ? body.status
                : 'active' in body
                  ? ((body as { active?: boolean; dormant?: boolean }).active
                      ? ((body as { dormant?: boolean }).dormant ? 'dormant' : 'active')
                      : 'inactive')
                  : 'build' in body && typeof body.build === 'string'
                    ? body.build
                    : 'ok')
            : 'ok'
        return {
          name: service.name,
          status: 'ok',
          detail,
        }
      } catch (error: any) {
        return { name: service.name, status: 'down', detail: error?.message || 'unreachable' }
      }
    })
  )
}
