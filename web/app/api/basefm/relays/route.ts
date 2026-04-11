import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { ensureDefaultBasefmRelayDestinations, listBasefmRelayDestinations } from '@/app/lib/basefmDistribution'
import { prisma } from '@/app/lib/prisma'

async function requireAdmin() {
  const session = await getAuthSession()
  return session?.user?.isAdmin === true
}

export async function GET() {
  try {
    await ensureDefaultBasefmRelayDestinations()
    const relays = await listBasefmRelayDestinations()
    return NextResponse.json({ relays })
  } catch (error) {
    console.error('[basefm-relays] GET error:', error)
    return NextResponse.json({ error: 'Unable to load relay destinations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const key = typeof body?.key === 'string' ? body.key.trim() : ''
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    const type = typeof body?.type === 'string' ? body.type.trim() : 'custom'
    const viewerUrl = typeof body?.viewerUrl === 'string' ? body.viewerUrl.trim() : null
    const probeUrl = typeof body?.probeUrl === 'string' ? body.probeUrl.trim() : null
    const required = Boolean(body?.required)
    const enabled = body?.enabled !== false

    if (!key || !name) {
      return NextResponse.json({ error: 'key and name are required' }, { status: 400 })
    }

    let relay
    try {
      relay = await prisma.basefm_relay_destinations.upsert({
        where: { key },
        update: {
          name,
          type,
          required,
          enabled,
          viewer_url: viewerUrl,
          probe_url: probeUrl || viewerUrl,
        },
        create: {
          key,
          name,
          type,
          required,
          enabled,
          viewer_url: viewerUrl,
          probe_url: probeUrl || viewerUrl,
          status: 'pending',
        },
      })
    } catch (error) {
      console.error('[basefm-relays] relay persistence unavailable:', error)
      return NextResponse.json(
        { error: 'Relay persistence requires the baseFM relay database migration to be applied.' },
        { status: 503 }
      )
    }

    return NextResponse.json({ relay })
  } catch (error) {
    console.error('[basefm-relays] POST error:', error)
    return NextResponse.json({ error: 'Unable to save relay destination' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
