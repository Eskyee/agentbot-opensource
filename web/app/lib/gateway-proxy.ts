/**
 * Gateway Proxy — calls OpenClaw gateway tools via HTTP.
 *
 * The OpenClaw Gateway exposes POST /tools/invoke for direct tool calls.
 * This utility handles auth, error wrapping, and session scoping.
 *
 * Usage:
 *   const result = await invokeGatewayTool('sessions_list', { action: 'json' })
 */

import { prisma } from './prisma'
import { DEFAULT_OPENCLAW_GATEWAY_URL } from './openclaw-config'
import { readSharedGatewayToken } from './gateway-token'

const GATEWAY_TOKEN = readSharedGatewayToken()
const GATEWAY_URL = process.env.NEXT_PUBLIC_OPENCLAW_GATEWAY_URL || DEFAULT_OPENCLAW_GATEWAY_URL

interface ToolRequest {
  tool: string
  args?: Record<string, any>
  action?: string
  sessionKey?: string
  dryRun?: boolean
}

interface ToolResponse {
  ok: boolean
  result?: any
  error?: string
}

/**
 * Invoke a tool on the OpenClaw gateway.
 * Falls back to user-specific gateway if userId is provided.
 */
export async function invokeGatewayTool(
  tool: string,
  args: Record<string, any> = {},
  userId?: string
): Promise<ToolResponse> {
  let url = GATEWAY_URL
  let token = GATEWAY_TOKEN

  // If userId provided, look up their specific gateway
  if (userId) {
    const userGateway = await getUserGateway(userId)
    if (userGateway) {
      url = userGateway.url
      token = userGateway.token
    }
  }

  if (!token) {
    return { ok: false, error: 'No gateway token configured' }
  }

  if (!url) {
    return { ok: false, error: 'No gateway URL configured' }
  }

  try {
    const res = await fetch(`${url}/tools/invoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ tool, args }),
      // Gateway may take a moment for complex tools
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return { ok: false, error: `Gateway ${res.status}: ${text}` }
    }

    const data = await res.json()
    return { ok: true, result: data }
  } catch (err: any) {
    return { ok: false, error: err.message || 'Gateway unreachable' }
  }
}

/**
 * Get a user's gateway URL and token from the database.
 */
async function getUserGateway(userId: string): Promise<{ url: string; token: string } | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { openclawUrl: true },
    })
    if (user?.openclawUrl) {
      // Token comes from env (shared gateway) or per-user config
      const token = process.env.OPENCLAW_GATEWAY_TOKEN || ''
      return { url: user.openclawUrl, token }
    }
  } catch {}
  return null
}

/**
 * Health check the gateway — fast, no tool invocation.
 */
export async function gatewayHealthcheck(url?: string): Promise<{ ok: boolean; status?: string; error?: string }> {
  const target = (url || GATEWAY_URL).replace(/\/$/, '')
  if (!target) {
    return { ok: false, error: 'No gateway URL configured' }
  }
  try {
    for (const path of ['/api/status', '/healthz', '/health']) {
      const res = await fetch(`${target}${path}`, {
        signal: AbortSignal.timeout(5000),
      })
      if (res.ok) {
        const data = await res.json().catch(() => ({}))
        if (path === '/api/status') {
          const running = data.running === true || data.online === true
          return {
            ok: running,
            status: data.state || (running ? 'running' : 'stopped'),
            error: running ? undefined : 'Gateway process is not running',
          }
        }
        return { ok: true, status: data.status || 'healthy' }
      }
    }
    return { ok: false, status: 'http_error' }
  } catch (err: any) {
    return { ok: false, error: err.message }
  }
}
