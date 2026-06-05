/**
 * Robinhood Agentic Trading MCP Integration
 *
 * Injects the Robinhood Trading MCP server into a user's OpenClaw gateway config.
 * Uses the admin HTTP RPC plugin at /api/v1/admin/rpc.
 *
 * MCP URL: https://agent.robinhood.com/mcp/trading
 * Transport: streamable-http
 *
 * Docs: https://robinhood.com/us/en/support/articles/agentic-trading-overview/
 */

import { prisma } from '@/app/lib/prisma'

const ROBINHOOD_MCP_URL = 'https://agent.robinhood.com/mcp/trading'
const ROBINHOOD_SETTING_KEY = 'robinhood_mcp_enabled'

// ─── Gateway RPC Helper ─────────────────────────────────────────────────────

interface RpcResult {
  ok: boolean
  hash?: string
  rpc?: (method: string, params: Record<string, unknown>) => Promise<{ ok: boolean; error?: { message: string } }>
  error?: string
}

/**
 * Connect to a user's OpenClaw gateway via admin HTTP RPC.
 * Fetches the current config hash (required for config.patch).
 */
async function gatewayRpc(gatewayUrl: string, gatewayToken: string): Promise<RpcResult> {
  const rpcUrl = `${gatewayUrl}/api/v1/admin/rpc`
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${gatewayToken}`,
  }

  // Fetch current config to get the base hash
  const configRes = await fetch(rpcUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ method: 'config.get', params: {} }),
    signal: AbortSignal.timeout(15000),
  })

  if (!configRes.ok) {
    const text = await configRes.text().catch(() => '')
    return { ok: false, error: `Gateway config.get failed (${configRes.status}): ${text.slice(0, 200)}` }
  }

  const configData = await configRes.json() as {
    ok: boolean
    payload?: { hash?: string }
    error?: { message: string }
  }

  if (!configData.ok || !configData.payload?.hash) {
    return { ok: false, error: `config.get failed: ${configData.error?.message || 'no hash'}` }
  }

  const hash = configData.payload.hash

  // Return a helper that sends RPC calls with the hash
  const rpc = async (method: string, params: Record<string, unknown>) => {
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ method, params }),
      signal: AbortSignal.timeout(15000),
    })

    const data = await res.json() as {
      ok: boolean
      error?: { message: string }
    }

    return data
  }

  return { ok: true, hash, rpc }
}

// ─── Inject / Remove ────────────────────────────────────────────────────────

/**
 * Inject or update the Robinhood Trading MCP server in the user's agent config.
 */
export async function injectRobinhoodMcp(userId: string): Promise<{ ok: boolean; error?: string }> {
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

  try {
    const rpcRes = await gatewayRpc(gatewayUrl, gatewayToken)
    if (!rpcRes.ok) return { ok: false, error: rpcRes.error }

    const configPatch = {
      mcp: {
        servers: {
          'robinhood-trading': {
            url: ROBINHOOD_MCP_URL,
            transport: 'streamable-http',
            enabled: true,
          },
        },
      },
    }

    const patchResult = await rpcRes.rpc!('config.patch', {
      baseHash: rpcRes.hash,
      raw: JSON.stringify(configPatch),
    })

    if (!patchResult.ok) {
      return { ok: false, error: patchResult.error?.message || 'config.patch failed' }
    }

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

  // Clean up setting regardless of gateway state
  await prisma.userSetting.deleteMany({
    where: { userId, key: ROBINHOOD_SETTING_KEY },
  })

  if (!gatewayUrl || !gatewayToken) {
    return { ok: true }
  }

  try {
    const rpcRes = await gatewayRpc(gatewayUrl, gatewayToken)
    if (!rpcRes.ok) return { ok: true } // Best effort

    await rpcRes.rpc!('config.patch', {
      baseHash: rpcRes.hash,
      raw: JSON.stringify({ mcp: { servers: { 'robinhood-trading': null } } }),
    })

    return { ok: true }
  } catch {
    return { ok: true } // Best effort
  }
}

// ─── Status / Smoke Test / Tools ────────────────────────────────────────────

export async function isRobinhoodMcpEnabled(userId: string): Promise<boolean> {
  const setting = await prisma.userSetting.findUnique({
    where: { userId_key: { userId, key: ROBINHOOD_SETTING_KEY } },
  })
  return setting?.value === 'true'
}

export async function smokeTestRobinhoodMcp(): Promise<{
  reachable: boolean
  status?: number
  latencyMs?: number
  error?: string
}> {
  const start = Date.now()
  try {
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

    if (res.ok) return { reachable: true, status: res.status, latencyMs }
    if (res.status === 401 || res.status === 403) return { reachable: true, status: res.status, latencyMs }

    return { reachable: false, status: res.status, latencyMs, error: `HTTP ${res.status}` }
  } catch (e) {
    return { reachable: false, latencyMs: Date.now() - start, error: e instanceof Error ? e.message : 'Connection failed' }
  }
}

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
    const rpcRes = await gatewayRpc(gatewayUrl, gatewayToken)
    if (!rpcRes.ok) return { ok: false, error: rpcRes.error }

    const result = await rpcRes.rpc!('config.get', {})
    if (!result.ok) return { ok: false, error: 'Failed to read config' }

    // Extract MCP tools from the config (would need runtime introspection)
    return { ok: true, tools: [] }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to query gateway' }
  }
}
