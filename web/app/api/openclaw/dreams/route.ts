import { NextRequest, NextResponse } from 'next/server'
import { proxyGet, proxyPost } from '../_proxy'

export const dynamic = 'force-dynamic'

export async function GET() {
  return proxyGet('/api/dreaming/diary')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action } = body

    if (action === 'trigger') {
      return proxyPost('/api/dreaming/trigger', { depth: body.depth || 48 })
    }

    if (action === 'config') {
      return proxyPost('/api/dreaming/config', {
        enabled: body.enabled,
        depthHours: body.depthHours,
        aggressiveness: body.aggressiveness,
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
