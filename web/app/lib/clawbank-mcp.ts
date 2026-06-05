/**
 * Inject ClawBank MCP server into a user's agent OpenClaw config.
 * Uses the admin HTTP RPC plugin at /api/v1/admin/rpc.
 */

import { prisma } from '@/app/lib/prisma'
import { decryptToken } from '@/app/lib/token-encryption'

const CLAWBANK_SETTING_KEY = '***'
const CLAWBANK_MCP_URL = 'https://app.clawbank.co/mcp'

// ─── Gateway RPC Helper ─────────────────────────────────────────────────────

async function gatewayRpc(gatewayUrl: string, gatewayToken: string) {
  const rpcUrl = `${gatewayUrl}/api/v1/admin/rpc`
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${gatewayToken}`,
  }

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

  const rpc = async (method: string, params: Record<string, unknown>) => {
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ method, params }),
      signal: AbortSignal.timeout(15000),
    })
    return res.json() as Promise<{ ok: boolean; error?: { message: string } }>
  }

  return { ok: true, hash, rpc }
}

// ─── Inject / Remove ────────────────────────────────────────────────────────

export async function injectClawBankMcp(userId: string): Promise<{ ok: boolean; error?: string }> {
  const setting = await prisma.userSetting.findUnique({
    where: { userId_key: { userId, key: CLAWBANK_SETTING_KEY } },
  })

  if (!setting) {
    return { ok: false, error: 'No ClawBank API key found' }
  }

  const apiKey = decryptToken(setting.value)

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

    const configPatch = {
      mcp: {
        servers: {
          clawbank: {
            url: CLAWBANK_MCP_URL,
            transport: 'streamable-http',
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
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

    return { ok: true }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Failed to reach agent gateway',
    }
  }
}

export async function removeClawBankMcp(userId: string): Promise<{ ok: boolean; error?: string }> {
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
    return { ok: true }
  }

  try {
    const rpcRes = await gatewayRpc(gatewayUrl, gatewayToken)
    if (!rpcRes.ok) return { ok: true }

    await rpcRes.rpc!('config.patch', {
      baseHash: rpcRes.hash,
      raw: JSON.stringify({ mcp: { servers: { clawbank: null } } }),
    })

    return { ok: true }
  } catch {
    return { ok: true }
  }
}
