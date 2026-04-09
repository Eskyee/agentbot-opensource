import { NextRequest, NextResponse } from 'next/server'
import { proxyGet, proxyPost } from '../_proxy'

export const dynamic = 'force-dynamic'

export async function GET() {
  return proxyGet('/api/eval/character')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    return proxyPost('/api/eval/character/run', {
      probeSet: body.probeSet || 'default',
      dimensions: body.dimensions || ['voice', 'emotion', 'knowledge', 'refusal'],
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
