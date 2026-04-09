import { NextRequest, NextResponse } from 'next/server'
import { proxyGet, proxyPost } from '../_proxy'

export const dynamic = 'force-dynamic'

export async function GET() {
  return proxyGet('/api/devices')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action } = body

    if (action === 'pair') {
      return proxyPost('/api/devices/pair', {})
    }

    if (action === 'unpair') {
      return proxyPost('/api/devices/unpair', { deviceId: body.deviceId })
    }

    if (action === 'test-push') {
      return proxyPost('/api/devices/test-push', { deviceId: body.deviceId })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
