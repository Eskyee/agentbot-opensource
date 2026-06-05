/**
 * Robinhood Agentic Trading MCP Integration
 *
 * Injects the Robinhood Trading MCP server into a user's OpenClaw gateway config.
 * The MCP endpoint handles authentication via OAuth — users authenticate through
 * their AI agent's MCP connection flow.
 *
 * MCP URL: https://agent.robinhood.com/mcp/trading
 * Transport: streamable-http (Streamable HTTP)
 *
 * What the agent can do:
 * - Query portfolio value, buying power, account info
 * - Place orders (market, limit, stop, etc.)
 * - Rebalance portfolios
 * - Analyze positions and market data
 * - Check transaction/order history
 *
 * Docs: https://robinhood.com/us/en/support/articles/agentic-trading-overview/
 */

import { prisma } from '@/app/lib/prisma'

const ROBINHOOD_MCP_URL = 'https://agent.robinhood.com/mcp/trading'
const ROBINHOOD_SETTING_KEY = 'robinhood_mcp_enabled'

/**
 * Inject or update the Robinhood Trading MCP server in the user's agent config.
 * No API key needed — Robinhood MCP uses its own OAuth flow during connection.
 */
export async function injectRobinhoodMcp(userId: string): Promise<{ ok: boolean; error?: string }> {
  // 1. Get user's agent gateway URL and token
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { openclawUrl: true },
  })

  const registration = await prisma.$queryRaw<{ gateway_token: string | null }[]>`
    SELECT gateway_token FROM agent_registrations WHERE user_id = ${userId} LIMIT 1
  `

  const gatewayUrl = user?.openclawUrl
  const gatewayToken = registration[0]?.gateway_token

  if (!gatewayUrl || !gatewayToken) {
    return { ok: false, error: 'Agent not deployed. Deploy your agent first.' }
  }

  // 2. Patch the agent's OpenClaw config to add Robinhood MCP
  try {
    const configPatch = {
      mcp: {
        servers: {
          'robinhood-trading': {
            url: ROBINHOOD_MCP_URL,
            transport: 'streamable-http',
          },
        },
      },
    }

    const res = await fetch(`${gatewayUrl}/api/config/patch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${gatewayToken}`,
      },
      body: JSON.stringify({ patch: configPatch }),
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return { ok: false, error: `Gateway returned ${res.status}: ${text.slice(0, 200)}` }
    }

    // 3. Save the setting
    await prisma.userSetting.upsert({
      where: { userId_key: { userId, key: ROBINHOOD_SETTING_KEY } },
      update: { value: 'true' },
      create: { userId, key: ROBINHOOD_SETTING_KEY, value: 'true' },
    })

    return { ok: true }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Failed to reach agent gateway',
    }
  }
}

/**
 * Remove the Robinhood Trading MCP server from the user's agent config.
 */
export async function removeRobinhoodMcp(userId: string): Promise<{ ok: boolean; error?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { openclawUrl: true },
  })

  const registration = await prisma.$queryRaw<{ gateway_token: string | null }[]>`
    SELECT gateway_token FROM agent_registrations WHERE user_id = ${userId} LIMIT 1
  `

  const gatewayUrl = user?.openclawUrl
  const gatewayToken = registration[0]?.gateway_token

  if (!gatewayUrl || !gatewayToken) {
    // No agent — just clean up the setting
    await prisma.userSetting.deleteMany({
      where: { userId, key: ROBINHOOD_SETTING_KEY },
    })
    return { ok: true }
  }

  try {
    const res = await fetch(`${gatewayUrl}/api/config/patch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${gatewayToken}`,
      },
      body: JSON.stringify({
        patch: { mcp: { servers: { 'robinhood-trading': null } } },
      }),
      signal: AbortSignal.timeout(15000),
    })

    // Clean up setting regardless
    await prisma.userSetting.deleteMany({
      where: { userId, key: ROBINHOOD_SETTING_KEY },
    })

    return { ok: res.ok }
  } catch {
    // Best effort — still clean up setting
    await prisma.userSetting.deleteMany({
      where: { userId, key: ROBINHOOD_SETTING_KEY },
    })
    return { ok: true }
  }
}

/**
 * Check if Robinhood MCP is enabled for a user.
 */
export async function isRobinhoodMcpEnabled(userId: string): Promise<boolean> {
  const setting = await prisma.userSetting.findUnique({
    where: { userId_key: { userId, key: ROBINHOOD_SETTING_KEY } },
  })
  return setting?.value === 'true'
}

/**
 * Smoke test — ping the Robinhood MCP endpoint to verify it's reachable.
 * This does NOT authenticate (that requires the user's OAuth flow),
 * but confirms the endpoint is alive and responding.
 */
export async function smokeTestRobinhoodMcp(): Promise<{
  reachable: boolean
  status?: number
  latencyMs?: number
  error?: string
}> {
  const start = Date.now()
  try {
    // Send a basic MCP initialize request
    const res = await fetch(ROBINHOOD_MCP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-03-26',
          capabilities: {},
          clientInfo: { name: 'agentbot', version: '1.0.0' },
        },
      }),
      signal: AbortSignal.timeout(10000),
    })

    const latencyMs = Date.now() - start

    if (res.ok) {
      return { reachable: true, status: res.status, latencyMs }
    }

    // 401/403 is expected without auth — endpoint is still alive
    if (res.status === 401 || res.status === 403) {
      return { reachable: true, status: res.status, latencyMs }
    }

    return {
      reachable: false,
      status: res.status,
      latencyMs,
      error: `HTTP ${res.status}`,
    }
  } catch (e) {
    return {
      reachable: false,
      latencyMs: Date.now() - start,
      error: e instanceof Error ? e.message : 'Connection failed',
    }
  }
}

/**
 * Get the Robinhood MCP tools available to the user's agent.
 * This queries the user's OpenClaw gateway for the robinhood-trading MCP tools.
 */
export async function getRobinhoodTools(userId: string): Promise<{
  ok: boolean
  tools?: Array<{ name: string; description: string }>
  error?: string
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { openclawUrl: true },
  })

  const registration = await prisma.$queryRaw<{ gateway_token: string | null }[]>`
    SELECT gateway_token FROM agent_registrations WHERE user_id = ${userId} LIMIT 1
  `

  const gatewayUrl = user?.openclawUrl
  const gatewayToken = registration[0]?.gateway_token

  if (!gatewayUrl || !gatewayToken) {
    return { ok: false, error: 'Agent not deployed' }
  }

  try {
    const res = await fetch(`${gatewayUrl}/api/mcp/robinhood-trading/tools`, {
      headers: {
        Authorization: `Bearer ${gatewayToken}`,
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      return { ok: false, error: `Gateway returned ${res.status}` }
    }

    const data = await res.json() as { tools?: Array<{ name: string; description: string }> }
    return { ok: true, tools: data.tools ?? [] }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Failed to query gateway',
    }
  }
}
