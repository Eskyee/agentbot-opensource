/**
 * POST /api/clawbank/invoke — Proxy MCP tool calls to ClawBank
 * Body: { tool: string, arguments?: Record<string, any> }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { decryptToken } from '@/app/lib/token-encryption'

const CLAWBANK_SETTING_KEY = 'clawbank_api_key'
const CLAWBANK_MCP_URL = 'https://app.clawbank.co/mcp'

export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { tool, arguments: args } = await req.json()
    if (!tool || typeof tool !== 'string') {
      return NextResponse.json({ error: 'Tool name required' }, { status: 400 })
    }

    const setting = await prisma.userSetting.findUnique({
      where: { userId_key: { userId: session.user.id, key: CLAWBANK_SETTING_KEY } },
    })

    if (!setting) {
      return NextResponse.json({ error: 'No ClawBank key saved' }, { status: 400 })
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
        id: Date.now(),
        method: 'tools/call',
        params: { name: tool, arguments: args || {} },
      }),
      signal: AbortSignal.timeout(30000),
    })

    if (!res.ok) {
      return NextResponse.json({ error: `ClawBank returned HTTP ${res.status}` }, { status: 502 })
    }

    const data = await res.json()

    if (data.error) {
      return NextResponse.json({ error: data.error.message || 'MCP error' }, { status: 400 })
    }

    // Parse the MCP content
    const content = data.result?.content
    if (!content || !Array.isArray(content)) {
      return NextResponse.json({ result: null })
    }

    const text = content[0]?.text || ''
    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      parsed = text
    }

    return NextResponse.json({
      result: parsed,
      isError: data.result?.isError || false,
    })
  } catch (error) {
    console.error('[ClawBank Invoke] Error:', error)
    return NextResponse.json({ error: 'Tool invocation failed' }, { status: 500 })
  }
}
