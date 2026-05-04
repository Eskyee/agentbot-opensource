/**
 * ClawBank API Route
 *
 * GET    /api/clawbank       — Check if key exists, return connection status
 * POST   /api/clawbank       — Save API key (encrypted), test connection
 * DELETE /api/clawbank       — Remove API key
 * GET    /api/clawbank/test  — Test existing connection
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { encryptToken, decryptToken } from '@/app/lib/token-encryption'
import { injectClawBankMcp, removeClawBankMcp } from '@/app/lib/clawbank-mcp'

const CLAWBANK_SETTING_KEY = 'clawbank_api_key'
const CLAWBANK_MCP_URL = 'https://app.clawbank.co/mcp'

async function testClawBankConnection(apiKey: string) {
  try {
    const res = await fetch(CLAWBANK_MCP_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'agentbot', version: '1.0' },
        },
      }),
    })

    if (!res.ok) {
      return { connected: false, error: `HTTP ${res.status}` }
    }

    const data = await res.json()
    if (data.error) {
      return { connected: false, error: data.error.message || 'MCP error' }
    }

    // Try to get user info
    const meRes = await fetch(CLAWBANK_MCP_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: { name: 'get_me', arguments: {} },
      }),
    })

    let email: string | undefined
    if (meRes.ok) {
      const meData = await meRes.json()
      if (meData.result?.content) {
        try {
          const text = meData.result.content[0]?.text || ''
          const parsed = JSON.parse(text)
          email = parsed.email
        } catch {}
      }
    }

    // Get balance
    let balance: { amount: string; currency: string } | undefined
    const balRes = await fetch(CLAWBANK_MCP_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'get_balance', arguments: {} },
      }),
    })

    if (balRes.ok) {
      const balData = await balRes.json()
      if (balData.result?.content) {
        try {
          const text = balData.result.content[0]?.text || ''
          const parsed = JSON.parse(text)
          if (parsed.balance) balance = parsed.balance
        } catch {}
      }
    }

    // Get wallets
    let wallets: Array<{ id: string; chain: string; address: string }> | undefined
    const walRes = await fetch(CLAWBANK_MCP_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: { name: 'list_wallets', arguments: {} },
      }),
    })

    if (walRes.ok) {
      const walData = await walRes.json()
      if (walData.result?.content) {
        try {
          const text = walData.result.content[0]?.text || ''
          const parsed = JSON.parse(text)
          if (parsed.wallets) wallets = parsed.wallets
        } catch {}
      }
    }

    return {
      connected: true,
      email,
      balance,
      wallets,
    }
  } catch (e) {
    return {
      connected: false,
      error: e instanceof Error ? e.message : 'Connection failed',
    }
  }
}

export async function GET(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const setting = await prisma.userSetting.findUnique({
      where: { userId_key: { userId: session.user.id, key: CLAWBANK_SETTING_KEY } },
    })

    if (!setting) {
      return NextResponse.json({ hasKey: false, status: null })
    }

    // Test connection with saved key
    const apiKey = decryptToken(setting.value)
    const status = await testClawBankConnection(apiKey)

    return NextResponse.json({ hasKey: true, status })
  } catch (error) {
    console.error('[ClawBank GET] Error:', error)
    return NextResponse.json({ error: 'Failed to check ClawBank status' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { apiKey } = await req.json()
    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json({ error: 'API key required' }, { status: 400 })
    }

    // Test connection first
    const status = await testClawBankConnection(apiKey)
    if (!status.connected) {
      return NextResponse.json(
        { error: status.error || 'Failed to connect to ClawBank' },
        { status: 400 }
      )
    }

    // Save encrypted key
    const encrypted = encryptToken(apiKey)
    await prisma.userSetting.upsert({
      where: { userId_key: { userId: session.user.id, key: CLAWBANK_SETTING_KEY } },
      create: { userId: session.user.id, key: CLAWBANK_SETTING_KEY, value: encrypted },
      update: { value: encrypted },
    })

    // Inject MCP server into user's agent config
    const mcpResult = await injectClawBankMcp(session.user.id)

    return NextResponse.json({ success: true, status, mcp: mcpResult })
  } catch (error) {
    console.error('[ClawBank POST] Error:', error)
    return NextResponse.json({ error: 'Failed to save ClawBank key' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Remove MCP server from agent config first
    await removeClawBankMcp(session.user.id)

    await prisma.userSetting.deleteMany({
      where: { userId: session.user.id, key: CLAWBANK_SETTING_KEY },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[ClawBank DELETE] Error:', error)
    return NextResponse.json({ error: 'Failed to remove ClawBank key' }, { status: 500 })
  }
}
