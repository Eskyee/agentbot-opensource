import { NextRequest, NextResponse } from 'next/server'
import { ensureDefaultBasefmRelayDestinations, listBasefmRelayDestinations } from '@/app/lib/basefmDistribution'
import { authorizeBasefmRelayWrite, OPTIONAL_RELAY_KEYS } from '@/app/lib/basefmRelayAuth'
import { prisma } from '@/app/lib/prisma'

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
  const authz = await authorizeBasefmRelayWrite(request)
  if (!authz.ok) {
    return NextResponse.json({ error: authz.error }, { status: authz.status })
  }

  try {
    const body = await request.json()
    const key = typeof body?.key === 'string' ? body.key.trim() : ''
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    const type = typeof body?.type === 'string' ? body.type.trim() : 'custom'
    const viewerUrl = typeof body?.viewerUrl === 'string' ? body.viewerUrl.trim() : null
    const probeUrl = typeof body?.probeUrl === 'string' ? body.probeUrl.trim() : null
    // Stream owners (non-admins) may only manage the optional simulcast relays
    // and can never mark a relay required — that stays operator-only.
    const required = authz.isAdmin ? Boolean(body?.required) : false
    const enabled = body?.enabled !== false

    if (!key || !name) {
      return NextResponse.json({ error: 'key and name are required' }, { status: 400 })
    }

    if (!authz.isAdmin && !OPTIONAL_RELAY_KEYS.includes(key)) {
      return NextResponse.json(
        { error: 'Only the optional X and YouTube simulcast relays can be managed from the stream page.' },
        { status: 403 }
      )
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

