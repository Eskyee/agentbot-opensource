import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

interface CommandResult {
  action: string
  target: string
  result: string
  success: boolean
}

/**
 * Simple keyword-based intent parser.
 * Returns { action, target } or null if no match.
 */
function parseCommand(input: string): { action: string; target: string } | null {
  const lower = input.toLowerCase().trim()

  // pause <agent>
  const pauseMatch = lower.match(/^pause\s+(.+)$/)
  if (pauseMatch) return { action: 'pause', target: pauseMatch[1].trim() }

  // restart <agent>
  const restartMatch = lower.match(/^restart\s+(.+)$/)
  if (restartMatch) return { action: 'restart', target: restartMatch[1].trim() }

  // stop <agent>
  const stopMatch = lower.match(/^stop\s+(.+)$/)
  if (stopMatch) return { action: 'stop', target: stopMatch[1].trim() }

  // resume <agent>
  const resumeMatch = lower.match(/^resume\s+(.+)$/)
  if (resumeMatch) return { action: 'resume', target: resumeMatch[1].trim() }

  // status <agent>
  const statusMatch = lower.match(/^status\s+(.+)$/)
  if (statusMatch) return { action: 'status', target: statusMatch[1].trim() }

  // show <agent> logs
  const logsMatch = lower.match(/^show\s+(.+?)\s+logs?$/)
  if (logsMatch) return { action: 'show_logs', target: logsMatch[1].trim() }

  // list agents / list workflows / list swarms
  if (lower.match(/^list\s+agents?$/)) return { action: 'list', target: 'agents' }
  if (lower.match(/^list\s+workflows?$/)) return { action: 'list', target: 'workflows' }
  if (lower.match(/^list\s+swarms?$/)) return { action: 'list', target: 'swarms' }

  // create swarm <name>
  const createSwarmMatch = lower.match(/^create\s+swarm\s+(.+)$/)
  if (createSwarmMatch) return { action: 'create_swarm', target: createSwarmMatch[1].trim() }

  return null
}

/**
 * Resolve a fuzzy agent name to an actual agent record.
 */
async function resolveAgent(userId: string, target: string) {
  // Try exact ID first
  const byId = await prisma.agent.findFirst({
    where: { userId, id: target },
    select: { id: true, name: true, status: true },
  })
  if (byId) return byId

  // Try exact name
  const byName = await prisma.agent.findFirst({
    where: { userId, name: target },
    select: { id: true, name: true, status: true },
  })
  if (byName) return byName

  // Try case-insensitive contains
  const byFuzzy = await prisma.agent.findFirst({
    where: { userId, name: { contains: target, mode: 'insensitive' } },
    select: { id: true, name: true, status: true },
  })
  return byFuzzy
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { command } = body

    if (!command || typeof command !== 'string') {
      return NextResponse.json({ error: 'command is required' }, { status: 400 })
    }

    const parsed = parseCommand(command)
    if (!parsed) {
      return NextResponse.json({
        action: 'unknown',
        target: '',
        result: `Could not parse command: "${command}". Try: pause/restart/stop/status <agent>, list agents/workflows/swarms, or show <agent> logs.`,
        success: false,
      } satisfies CommandResult)
    }

    const { action, target } = parsed

    // Handle list commands
    if (action === 'list') {
      if (target === 'agents') {
        const agents = await prisma.agent.findMany({
          where: { userId: session.user.id },
          select: { id: true, name: true, model: true, status: true },
          orderBy: { createdAt: 'desc' },
        })
        const summary = agents.map(a => `${a.name} (${a.model}) — ${a.status}`).join('\n')
        return NextResponse.json({
          action,
          target,
          result: agents.length ? summary : 'No agents found.',
          success: true,
        } satisfies CommandResult)
      }

      if (target === 'workflows') {
        const workflows = await prisma.workflow.findMany({
          where: { userId: session.user.id },
          select: { id: true, name: true, enabled: true, _count: { select: { nodes: true } } },
          orderBy: { updatedAt: 'desc' },
        })
        const summary = workflows.map(w => `${w.name} (${w._count.nodes} nodes) — ${w.enabled ? 'enabled' : 'disabled'}`).join('\n')
        return NextResponse.json({
          action,
          target,
          result: workflows.length ? summary : 'No workflows found.',
          success: true,
        } satisfies CommandResult)
      }

      if (target === 'swarms') {
        const swarms = await prisma.agentSwarm.findMany({
          where: { userId: session.user.id },
          select: { id: true, name: true, enabled: true, agents: true },
          orderBy: { createdAt: 'desc' },
        })
        const summary = swarms.map(s => {
          const agentCount = JSON.parse(s.agents || '[]').length
          return `${s.name} (${agentCount} agents) — ${s.enabled ? 'enabled' : 'disabled'}`
        }).join('\n')
        return NextResponse.json({
          action,
          target,
          result: swarms.length ? summary : 'No swarms found.',
          success: true,
        } satisfies CommandResult)
      }
    }

    // Agent-targeting commands
    const agent = await resolveAgent(session.user.id, target)
    if (!agent) {
      return NextResponse.json({
        action,
        target,
        result: `Agent "${target}" not found.`,
        success: false,
      } satisfies CommandResult)
    }

    switch (action) {
      case 'status':
        return NextResponse.json({
          action,
          target: agent.name,
          result: `Agent "${agent.name}" (${agent.id}) — status: ${agent.status}`,
          success: true,
        } satisfies CommandResult)

      case 'show_logs':
        return NextResponse.json({
          action,
          target: agent.name,
          result: `Log view for "${agent.name}" — navigate to /dashboard/team?agent=${agent.id} for full logs.`,
          success: true,
        } satisfies CommandResult)

      case 'pause':
      case 'stop': {
        await prisma.agent.update({
          where: { id: agent.id },
          data: { status: 'paused' },
        })
        return NextResponse.json({
          action,
          target: agent.name,
          result: `Agent "${agent.name}" has been paused.`,
          success: true,
        } satisfies CommandResult)
      }

      case 'resume': {
        await prisma.agent.update({
          where: { id: agent.id },
          data: { status: 'active' },
        })
        return NextResponse.json({
          action,
          target: agent.name,
          result: `Agent "${agent.name}" has been resumed.`,
          success: true,
        } satisfies CommandResult)
      }

      case 'restart': {
        // Set status to restarting, then back to active
        await prisma.agent.update({
          where: { id: agent.id },
          data: { status: 'restarting' },
        })
        // In production this would trigger actual restart via websocket
        setTimeout(async () => {
          await prisma.agent.update({
            where: { id: agent.id },
            data: { status: 'active' },
          }).catch(() => {})
        }, 3000)
        return NextResponse.json({
          action,
          target: agent.name,
          result: `Agent "${agent.name}" restart initiated.`,
          success: true,
        } satisfies CommandResult)
      }

      case 'create_swarm': {
        const swarm = await prisma.agentSwarm.create({
          data: {
            userId: session.user.id,
            name: target,
            agents: JSON.stringify([agent.id]),
            enabled: true,
          },
        })
        return NextResponse.json({
          action,
          target,
          result: `Swarm "${swarm.name}" created with agent "${agent.name}".`,
          success: true,
        } satisfies CommandResult)
      }

      default:
        return NextResponse.json({
          action,
          target,
          result: `Unknown action: ${action}`,
          success: false,
        } satisfies CommandResult)
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
