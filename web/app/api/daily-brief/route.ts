import { NextResponse } from 'next/server'
import { APP_URL } from '@/app/lib/app-url'
import { AGENTBOT_BACKEND_URL, SOUL_SERVICE_URL, X402_GATEWAY_URL } from '@/app/lib/platform-urls'
import { prisma } from '@/app/lib/prisma'
import { blogPosts } from '@/app/blog/blogPosts'

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

function formatDaysAgo(date: Date, now: Date): string {
  const diffMs = now.getTime() - date.getTime()
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000))
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

export async function GET() {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Run health checks + platform counts in parallel
  const [healthResults, agentStats, recentAgents, activeTasks] = await Promise.all([
    Promise.all(HEALTH_CHECKS.map(checkHealth)),
    prisma.agent.groupBy({ by: ['status'], _count: { _all: true } }).catch(() => []),
    prisma.agent
      .findMany({
        where: { createdAt: { gte: weekAgo } },
        select: { id: true, name: true, status: true, tier: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      })
      .catch(() => []),
    prisma.scheduledTask.count({ where: { enabled: true } }).catch(() => 0),
  ])

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

  // Build real recent-activity items from Prisma
  const totalAgents = agentStats.reduce((sum, s) => sum + s._count._all, 0)
  const liveAgents = agentStats
    .filter((s) => s.status === 'active' || s.status === 'running')
    .reduce((sum, s) => sum + s._count._all, 0)

  const activityItems: string[] = []
  activityItems.push(`${liveAgents} live agents, ${totalAgents} deployed on the platform`)
  if (recentAgents.length > 0) {
    activityItems.push(`${recentAgents.length} new agents provisioned in the last 7 days`)
    const last = recentAgents[0]
    activityItems.push(`Latest: ${last.name} (${last.tier}) — ${formatDaysAgo(last.createdAt, now)}`)
  } else {
    activityItems.push('No new agents provisioned this week')
  }
  if (activeTasks > 0) {
    activityItems.push(`${activeTasks} scheduled tasks currently enabled`)
  }

  // Build security items from health results
  const downServices = healthResults.filter((r) => r.status === 'down')
  const degradedServices = healthResults.filter((r) => r.status === 'degraded')
  const securityItems: string[] = []
  if (downServices.length > 0) {
    securityItems.push(`${downServices.length} service(s) DOWN: ${downServices.map((s) => s.name).join(', ')}`)
  }
  if (degradedServices.length > 0) {
    securityItems.push(
      `${degradedServices.length} service(s) degraded: ${degradedServices.map((s) => s.name).join(', ')}`
    )
  }
  if (downServices.length === 0 && degradedServices.length === 0) {
    securityItems.push('All infrastructure healthy — no anomalies detected in last check')
  }

  // Today's focus — derived from current state
  const focusItems: string[] = []
  if (downServices.length > 0 || degradedServices.length > 0) {
    focusItems.push(`Investigate ${downServices.length + degradedServices.length} unhealthy service(s)`)
  } else {
    focusItems.push('All systems green — continue scheduled work')
  }
  if (liveAgents > 0) {
    focusItems.push(`Monitor ${liveAgents} live agent(s) for runtime issues`)
  }
  focusItems.push('Review Daily Brief, System Pulse and Usage & Spend for anomalies')

  // Market pulse — from recent blog posts (most recent 3)
  const marketItems: string[] = blogPosts
    .slice(0, 3)
    .map((p) => `${p.dateLabel} — ${p.title}`)

  // Upcoming — derived from blog posts dated in the future, otherwise next recurring milestone
  const upcomingItems: string[] = []
  const futurePosts = blogPosts.filter((p) => new Date(p.isoDate).getTime() > now.getTime())
  for (const post of futurePosts.slice(0, 3)) {
    upcomingItems.push(`${post.dateLabel} — ${post.title}`)
  }
  if (upcomingItems.length === 0) {
    upcomingItems.push(`Next billing cycle closes ${new Date(now.getFullYear(), now.getMonth() + 1, 1).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}`)
    upcomingItems.push('Continuous delivery on Vercel (web) and Railway (backend, soul, x402, OpenClaw)')
  }

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
      items: activityItems,
    },
    {
      id: 'focus',
      title: "Today's Focus",
      color: 'text-yellow-400',
      items: focusItems,
    },
    {
      id: 'intel',
      title: 'Market Pulse',
      color: 'text-emerald-400',
      items: marketItems,
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

export const dynamic = 'force-dynamic'
