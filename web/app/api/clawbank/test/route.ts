/**
 * GET /api/clawbank/test — Test existing ClawBank connection
 */

import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { decryptToken } from '@/app/lib/token-encryption'

const CLAWBANK_SETTING_KEY = 'clawbank_api_key'
const CLAWBANK_MCP_URL = 'https://app.clawbank.co/mcp'

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const setting = await prisma.userSetting.findUnique({
      where: { userId_key: { userId: session.user.id, key: CLAWBANK_SETTING_KEY } },
    })

    if (!setting) {
      return NextResponse.json({ error: 'No ClawBank key saved' }, { status: 404 })
    }

    const apiKey = decryptToken(setting.value)

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
      return NextResponse.json({ status: { connected: false, error: `HTTP ${res.status}` } })
    }

    const data = await res.json()
    if (data.error) {
      return NextResponse.json({ status: { connected: false, error: data.error.message } })
    }

    return NextResponse.json({
      status: {
        connected: true,
        serverVersion: data.result?.serverInfo?.version,
      },
    })
  } catch (error) {
    console.error('[ClawBank TEST] Error:', error)
    return NextResponse.json({ error: 'Test failed' }, { status: 500 })
  }
}
