/**
 * Inject ClawBank MCP server into a user's agent OpenClaw config.
 * Calls the agent's gateway API to add the MCP server with the user's API key.
 */

import { prisma } from '@/app/lib/prisma'
import { decryptToken } from '@/app/lib/token-encryption'

const CLAWBANK_SETTING_KEY = 'clawbank_api_key'
const CLAWBANK_MCP_URL = 'https://app.clawbank.co/mcp'

/**
 * Inject or update ClawBank MCP server in the user's agent config.
 * Returns true if successful, false if agent not found or injection failed.
 */
export async function injectClawBankMcp(userId: string): Promise<{ ok: boolean; error?: string }> {
  // 1. Get user's ClawBank API key
  const setting = await prisma.userSetting.findUnique({
    where: { userId_key: { userId, key: CLAWBANK_SETTING_KEY } },
  })

  if (!setting) {
    return { ok: false, error: 'No ClawBank API key found' }
  }

  const apiKey = decryptToken(setting.value)

  // 2. Get user's agent gateway URL and token
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

  // 3. Call agent's OpenClaw gateway to add ClawBank MCP server
  try {
    const configPatch = {
      mcp: {
        servers: {
          clawbank: {
            url: CLAWBANK_MCP_URL,
            transport: 'streamable-http',
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
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

    return { ok: true }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Failed to reach agent gateway',
    }
  }
}

/**
 * Remove ClawBank MCP server from the user's agent config.
 */
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
    return { ok: true } // No agent, nothing to remove
  }

  try {
    const res = await fetch(`${gatewayUrl}/api/config/patch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${gatewayToken}`,
      },
      body: JSON.stringify({
        patch: { mcp: { servers: { clawbank: null } } },
      }),
      signal: AbortSignal.timeout(15000),
    })

    return { ok: res.ok }
  } catch {
    return { ok: true } // Best effort
  }
}
