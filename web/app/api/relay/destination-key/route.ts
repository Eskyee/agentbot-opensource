import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { isAdminEmail } from '@/app/lib/admin'

const RELAY_SERVER_URL = process.env.RELAY_SERVER_URL || ''
const RELAY_SECRET = process.env.RELAY_SECRET || ''

/**
 * POST /api/relay/destination-key
 * Forwards a per-destination stream key to the relay server.
 * Body: { destinationId: string, streamKey: string }
 */
export async function POST(request: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!RELAY_SERVER_URL) {
    return NextResponse.json({ error: 'Relay server not configured' }, { status: 503 })
  }

  try {
    const body = await request.json()
    const { destinationId, streamKey } = body

    if (!destinationId) {
      return NextResponse.json({ error: 'destinationId required' }, { status: 400 })
    }

    const res = await fetch(`${RELAY_SERVER_URL}/relay/destinations/${destinationId}/key`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(RELAY_SECRET ? { 'X-Relay-Secret': RELAY_SECRET } : {}),
      },
      body: JSON.stringify({ streamKey: streamKey || '' }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return NextResponse.json({ error: data.error || 'Relay server error' }, { status: res.status })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[relay-destination-key] Error:', error)
    return NextResponse.json({ error: 'Failed to update relay destination key' }, { status: 500 })
  }
}
