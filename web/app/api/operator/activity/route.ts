/**
 * GET /api/operator/activity
 *
 * Activity feed for Operator Mode — reads from existing event sources:
 * - Recent notifications
 * - Agent status changes
 * - Workflow runs
 * - Template launches
 *
 * Does NOT create a separate event system — consumes existing data.
 */
import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { isOperatorModeEnabledForUser } from '@/app/lib/feature-flags'


interface ActivityItem {
  id: string
  type: 'notification' | 'agent' | 'template' | 'workflow'
  title: string
  description: string
  timestamp: string
  icon: string
  href?: string
}

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isOperatorModeEnabledForUser(session.user.email)) {
    return NextResponse.json({ error: 'Operator Mode is not enabled' }, { status: 403 })
  }

  const userId = session.user.id

  // Fetch from existing data sources in parallel
  const [notifications, agents, templateLaunches, workflows] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.agent.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    }),
    prisma.templateLaunch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.workflow.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    }),
  ])

  const items: ActivityItem[] = []

  // Map notifications
  for (const n of notifications) {
    items.push({
      id: n.id,
      type: 'notification',
      title: n.title,
      description: n.message,
      timestamp: n.createdAt.toISOString(),
      icon: '🔔',
    })
  }

  // Map agents
  for (const a of agents) {
    items.push({
      id: a.id,
      type: 'agent',
      title: a.name,
      description: `Agent is ${a.status}`,
      timestamp: a.updatedAt.toISOString(),
      icon: a.status === 'running' ? '🟢' : a.status === 'pending' ? '🟡' : '⚪',
      href: '/dashboard',
    })
  }

  // Map template launches
  for (const t of templateLaunches) {
    items.push({
      id: t.id,
      type: 'template',
      title: `Launched ${t.templateKey}`,
      description: `Template is ${t.status}`,
      timestamp: t.createdAt.toISOString(),
      icon: '📋',
      href: '/app/templates',
    })
  }

  // Map workflows
  for (const w of workflows) {
    items.push({
      id: w.id,
      type: 'workflow',
      title: w.name,
      description: w.enabled ? 'Active' : 'Disabled',
      timestamp: w.updatedAt.toISOString(),
      icon: '⊞',
      href: '/dashboard/workflows',
    })
  }

  // Sort by timestamp descending
  items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return NextResponse.json({ items: items.slice(0, 20) })
}
