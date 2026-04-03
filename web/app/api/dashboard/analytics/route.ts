import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { gatewayHealthcheck, invokeGatewayTool } from '@/app/lib/gateway-proxy'

type TrendBucket = {
  label: string
  deployments: number
  skills: number
  tasks: number
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function buildMonthBuckets(rangeDays: number) {
  const now = new Date()
  const start = new Date(now)
  start.setDate(start.getDate() - rangeDays)

  const buckets: TrendBucket[] = []
  const cursor = startOfMonth(start)
  const end = startOfMonth(now)

  while (cursor <= end) {
    buckets.push({
      label: cursor.toLocaleDateString('en-GB', { month: 'short' }),
      deployments: 0,
      skills: 0,
      tasks: 0,
    })
    cursor.setMonth(cursor.getMonth() + 1)
  }

  return { start, buckets }
}

export async function GET(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const range = Number(req.nextUrl.searchParams.get('range') || '180')
  const rangeDays = [30, 90, 180, 365].includes(range) ? range : 180

  try {
    const { start, buckets } = buildMonthBuckets(rangeDays)

    const [agents, installedSkills, scheduledTasks, gatewayHealth, sessionsResult] = await Promise.all([
      prisma.agent.findMany({
        where: { userId: session.user.id },
        select: { id: true, name: true, status: true, createdAt: true },
      }),
      prisma.installedSkill.findMany({
        where: { userId: session.user.id, enabled: true },
        select: {
          createdAt: true,
          skill: { select: { name: true } },
        },
      }),
      prisma.scheduledTask.findMany({
        where: { userId: session.user.id },
        select: { createdAt: true, enabled: true },
      }),
      gatewayHealthcheck(),
      invokeGatewayTool('sessions_list', { action: 'json', limit: 50 }, session.user.id),
    ])

    const bucketIndex = new Map(buckets.map((bucket, index) => [bucket.label, index]))

    for (const agent of agents) {
      if (agent.createdAt < start) continue
      const key = agent.createdAt.toLocaleDateString('en-GB', { month: 'short' })
      const index = bucketIndex.get(key)
      if (index !== undefined) buckets[index].deployments += 1
    }

    for (const skill of installedSkills) {
      if (skill.createdAt < start) continue
      const key = skill.createdAt.toLocaleDateString('en-GB', { month: 'short' })
      const index = bucketIndex.get(key)
      if (index !== undefined) buckets[index].skills += 1
    }

    for (const task of scheduledTasks) {
      if (task.createdAt < start) continue
      const key = task.createdAt.toLocaleDateString('en-GB', { month: 'short' })
      const index = bucketIndex.get(key)
      if (index !== undefined) buckets[index].tasks += 1
    }

    let sessionList: any[] = []
    if (sessionsResult.ok && sessionsResult.result) {
      const data = typeof sessionsResult.result === 'string'
        ? JSON.parse(sessionsResult.result)
        : sessionsResult.result
      sessionList = Array.isArray(data) ? data : data?.sessions || data?.result || []
    }

    const channelActivity: Record<string, { name: string; messages: number; lastActive: string | null; status: string }> = {
      webchat: { name: 'Webchat', messages: 0, lastActive: null, status: gatewayHealth.ok ? 'connected' : 'unreachable' },
      telegram: { name: 'Telegram', messages: 0, lastActive: null, status: 'not-configured' },
      discord: { name: 'Discord', messages: 0, lastActive: null, status: 'not-configured' },
      whatsapp: { name: 'WhatsApp', messages: 0, lastActive: null, status: 'not-configured' },
      imessage: { name: 'iMessage', messages: 0, lastActive: null, status: 'not-configured' },
    }

    for (const sessionItem of sessionList) {
      const key = String(sessionItem.sessionKey || sessionItem.key || '')
      let channel = 'webchat'
      if (key.includes('telegram')) channel = 'telegram'
      else if (key.includes('discord')) channel = 'discord'
      else if (key.includes('whatsapp')) channel = 'whatsapp'
      else if (key.includes('imessage')) channel = 'imessage'

      channelActivity[channel].status = 'connected'
      channelActivity[channel].messages += Number(sessionItem.messageCount || sessionItem.turns || 0)
      channelActivity[channel].lastActive = sessionItem.lastActivity || channelActivity[channel].lastActive
    }

    const topSkills = Object.entries(
      installedSkills.reduce<Record<string, number>>((acc, skill) => {
        const name = skill.skill.name
        acc[name] = (acc[name] || 0) + 1
        return acc
      }, {})
    )
      .map(([name, installs]) => ({ name, installs }))
      .sort((a, b) => b.installs - a.installs)
      .slice(0, 6)

    const channels = Object.values(channelActivity)
    const liveAgents = agents.filter((agent) => ['active', 'running'].includes(agent.status)).length

    return NextResponse.json({
      overview: {
        deployedAgents: agents.length,
        liveAgents,
        installedSkills: installedSkills.length,
        scheduledTasks: scheduledTasks.length,
        connectedChannels: channels.filter((channel) => channel.status === 'connected').length,
        channelMessages: channels.reduce((sum, channel) => sum + channel.messages, 0),
      },
      trend: buckets,
      topSkills,
      channels,
      source: {
        gateway: gatewayHealth.ok ? 'live' : 'unreachable',
        sessions: sessionsResult.ok ? 'live' : 'unavailable',
      },
    })
  } catch (error) {
    console.error('Dashboard analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
