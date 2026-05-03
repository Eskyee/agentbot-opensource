import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { getBankrApiKey } from '@/app/api/user/bankr-key/route'

const BANKR_API_URL = process.env.BANKR_API_URL || 'https://api.bankr.bot'

const OPS_SYSTEM_PROMPT = `You are the Agentbot ops AI. You help operators understand their fleet, agents, and workflows. Be concise, technical, and actionable. When asked about agents, reference their ID, name, model, and status. When asked about fleet operations, focus on health, fitness, and uptime metrics. Keep responses under 300 words unless detail is explicitly requested.`

async function resolveKey(userId: string): Promise<string | null> {
  return (await getBankrApiKey(userId)) || process.env.BANKR_API_KEY || null
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = await resolveKey(session.user.id)
  if (!apiKey) {
    return NextResponse.json({ error: 'No Bankr API key configured', needsKey: true }, { status: 503 })
  }

  try {
    const body = await req.json()
    const { message, context } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'message is required' }, { status: 400 })
    }

    const contextBlock = context
      ? `\n\nContext:\n${typeof context === 'string' ? context : JSON.stringify(context, null, 2)}`
      : ''

    const prompt = `${OPS_SYSTEM_PROMPT}${contextBlock}\n\nOperator: ${message}`

    const res = await fetch(`${BANKR_API_URL}/agent/prompt`, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return NextResponse.json(
        { error: `Bankr API error: ${res.status}`, detail: text },
        { status: 502 }
      )
    }

    const data = await res.json()
    return NextResponse.json({
      response: data.response || data.text || data.message || 'No response from AI.',
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
