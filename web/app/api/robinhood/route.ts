/**
 * Robinhood Agentic Trading API
 *
 * GET  /api/robinhood — Connection status + smoke test
 * POST /api/robinhood — Connect or disconnect Robinhood MCP
 *
 * Actions (POST):
 *   { action: "connect" }    — Inject Robinhood MCP into user's agent
 *   { action: "disconnect" } — Remove Robinhood MCP from user's agent
 *   { action: "smoke-test" } — Ping Robinhood MCP endpoint
 *   { action: "tools" }      — List available Robinhood MCP tools
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import {
  injectRobinhoodMcp,
  removeRobinhoodMcp,
  isRobinhoodMcpEnabled,
  smokeTestRobinhoodMcp,
  getRobinhoodTools,
} from '@/app/lib/robinhood-mcp'

export async function GET(request: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  // Smoke test (no auth needed)
  if (action === 'smoke-test') {
    const result = await smokeTestRobinhoodMcp()
    return NextResponse.json(result)
  }

  // Connection status
  const enabled = await isRobinhoodMcpEnabled(userId)

  return NextResponse.json({
    connected: enabled,
    mcpUrl: 'https://agent.robinhood.com/mcp/trading',
    platform: 'robinhood',
    features: [
      'Portfolio queries',
      'Order placement',
      'Position analysis',
      'Market data',
      'Portfolio rebalancing',
    ],
  })
}

export async function POST(request: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const body = await request.json().catch(() => ({}))
  const action = body.action as string

  switch (action) {
    case 'connect': {
      const result = await injectRobinhoodMcp(userId)
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }
      return NextResponse.json({
        success: true,
        message: 'Robinhood Trading MCP connected to your agent',
        nextStep: 'Authenticate in your agent by running /mcp and selecting robinhood-trading',
      })
    }

    case 'disconnect': {
      const result = await removeRobinhoodMcp(userId)
      return NextResponse.json({
        success: result.ok,
        message: result.ok
          ? 'Robinhood Trading MCP disconnected'
          : result.error ?? 'Failed to disconnect',
      })
    }

    case 'smoke-test': {
      const result = await smokeTestRobinhoodMcp()
      return NextResponse.json(result)
    }

    case 'tools': {
      const result = await getRobinhoodTools(userId)
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }
      return NextResponse.json({ tools: result.tools })
    }

    default:
      return NextResponse.json(
        { error: 'Unknown action. Use: connect, disconnect, smoke-test, tools' },
        { status: 400 }
      )
  }
}
