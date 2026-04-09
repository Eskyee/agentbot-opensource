import { NextResponse } from 'next/server'
import { APP_URL } from '@/app/lib/app-url'
import { AGENTBOT_BACKEND_URL, SOUL_SERVICE_URL, X402_GATEWAY_URL } from '@/app/lib/platform-urls'

interface HealthCheck {
  name: string
  url: string
}

const HEALTH_CHECKS: HealthCheck[] = [
  { name: 'Agentbot API', url: `${AGENTBOT_BACKEND_URL}/health` },
  { name: 'Agentbot Web', url: APP_URL },
  { name: 'x402 Gateway', url: `${X402_GATEWAY_URL}/health` },
  { name: 'Borg-0', url: `${SOUL_SERVICE_URL}/health` },
]

async function checkHealth(check: HealthCheck): Promise<{ name: string; status: string; detail?: string }> {
  try {
    const res = await fetch(check.url, { signal: AbortSignal.timeout(8000) })
    try {
      const body = await res.json()
      // Some services return 503 with status: "degraded" in body — treat as degraded not down
      const bodyStatus = body.status as string | undefined
      const version = body.version || (typeof body.build === 'string' ? body.build.slice(0, 8) : '') || ''
      if (res.ok && (!bodyStatus || bodyStatus === 'ok' || bodyStatus === 'live')) {
        return { name: check.name, status: 'ok', detail: version ? `v${version}` : undefined }
      }
      return { name: check.name, status: 'degraded', detail: bodyStatus || `HTTP ${res.status}` }
    } catch {
      if (!res.ok) return { name: check.name, status: 'degraded', detail: `HTTP ${res.status}` }
      return { name: check.name, status: 'ok' }
    }
  } catch {
    return { name: check.name, status: 'down' }
  }
}

export async function GET() {
  const now = new Date()
  const today = now.toISOString().split('T')[0]

  // Run health checks in parallel
  const healthResults = await Promise.all(HEALTH_CHECKS.map(checkHealth))

  // Build system status items
  const systemItems: string[] = []
  for (const r of healthResults) {
    if (r.status === 'ok') {
      systemItems.push(`${r.name} — healthy${r.detail ? ` (${r.detail})` : ''}`)
    } else if (r.status === 'degraded') {
      systemItems.push(`⚠️ ${r.name} — degraded: ${r.detail}`)
    } else {
      systemItems.push(`🔴 ${r.name} — DOWN`)
    }
  }

  // Build security items from health results
  const downServices = healthResults.filter(r => r.status === 'down')
  const degradedServices = healthResults.filter(r => r.status === 'degraded')
  const securityItems: string[] = []
  if (downServices.length > 0) {
    securityItems.push(`${downServices.length} service(s) DOWN: ${downServices.map(s => s.name).join(', ')}`)
  }
  if (degradedServices.length > 0) {
    securityItems.push(`${degradedServices.length} service(s) degraded: ${degradedServices.map(s => s.name).join(', ')}`)
  }
  if (downServices.length === 0 && degradedServices.length === 0) {
    securityItems.push('All infrastructure healthy — no anomalies detected in last check')
  }

  // Upcoming items
  const upcomingItems: string[] = [
    'Beta launch: March 31, 2026 (v0.1.0-beta.1)',
    'Vercel serves the web app from the web root',
    'Railway services active for backend, Borg soul, x402 gateway, and shared OpenClaw UI',
  ]

  const brief = [
    {
      id: 'system',
      title: 'System Status',
      color: 'text-green-400',
      items: systemItems,
    },
    {
      id: 'tasks',
      title: 'Recent Activity',
      color: 'text-blue-400',
      items: [
        'See git log for latest commits and deployments',
        'Dashboard pages are live with real data',
        'Infrastructure monitoring active',
      ],
    },
    {
      id: 'focus',
      title: 'Today\'s Focus',
      color: 'text-yellow-400',
      items: [
        'Monitor all services for stability',
        'Continue feature development',
        'Beta launch preparation',
      ],
    },
    {
      id: 'intel',
      title: 'Market Pulse',
      color: 'text-emerald-400',
      items: [
        'Agentbot active on Vercel + Railway infrastructure',
        'x402 protocol integration live',
        'Onchain payment settlement operational',
      ],
    },
    {
      id: 'security',
      title: 'Security & Alerts',
      color: 'text-red-400',
      items: securityItems,
    },
    {
      id: 'calendar',
      title: 'Upcoming',
      color: 'text-blue-400',
      items: upcomingItems,
    },
  ]

  return NextResponse.json({
    date: today,
    generatedAt: now.toISOString(),
    brief,
  })
}
