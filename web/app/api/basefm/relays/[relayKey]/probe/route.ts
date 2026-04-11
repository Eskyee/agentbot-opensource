import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { probeRelayDestinationUrl, updateRelayProbeStatus } from '@/app/lib/basefmDistribution'
import { prisma } from '@/app/lib/prisma'

async function requireAdmin() {
  const session = await getAuthSession()
  return session?.user?.isAdmin === true
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ relayKey: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { relayKey } = await params
    let relay
    try {
      relay = await prisma.basefm_relay_destinations.findUnique({
        where: { key: relayKey },
      })
    } catch (error) {
      console.error('[basefm-relays-probe] relay persistence unavailable:', error)
      return NextResponse.json(
        { error: 'Relay persistence requires the baseFM relay database migration to be applied.' },
        { status: 503 }
      )
    }

    if (!relay) {
      return NextResponse.json({ error: 'Relay not found' }, { status: 404 })
    }

    const probeTarget = relay.probe_url || relay.viewer_url
    if (!probeTarget) {
      return NextResponse.json({ error: 'Relay has no probe target configured' }, { status: 400 })
    }

    const result = await probeRelayDestinationUrl(probeTarget)
    try {
      await updateRelayProbeStatus(relay.key, result)
    } catch (error) {
      console.error('[basefm-relays-probe] failed to persist probe result:', error)
      return NextResponse.json(
        { error: 'Relay probe ran, but persistence is unavailable until the baseFM relay migration is applied.' },
        { status: 503 }
      )
    }

    const updatedRelay = await prisma.basefm_relay_destinations.findUnique({
      where: { key: relay.key },
    })

    return NextResponse.json({
      ok: result.ok,
      error: result.error || null,
      relay: updatedRelay,
    })
  } catch (error) {
    console.error('[basefm-relays-probe] error:', error)
    return NextResponse.json({ error: 'Unable to probe relay destination' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
