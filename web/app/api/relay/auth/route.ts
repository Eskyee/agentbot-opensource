import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

const RELAY_SECRET = process.env.RELAY_SECRET || ''
const MUX_RTMP_URL = 'rtmp://global-live.mux.com:5222/app'

/**
 * POST /api/relay/auth
 * Called by the nginx-rtmp relay server to validate stream keys.
 * Accepts: { streamKey: string }
 * Returns: { djName, muxStreamKey, muxRtmpUrl, destinations: [...] }
 */
export async function POST(request: NextRequest) {
  // Verify relay server identity
  if (RELAY_SECRET) {
    const provided = request.headers.get('x-relay-secret')
    if (provided !== RELAY_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
  }

  try {
    const body = await request.json()
    const streamKey = typeof body?.streamKey === 'string' ? body.streamKey.trim() : ''
    if (!streamKey) {
      return NextResponse.json({ error: 'Missing streamKey' }, { status: 400 })
    }

    // Find active DJ session by matching the Mux stream key
    // The stream key is the Mux live stream key that the DJ received when they created a session
    const activeSession = await prisma.dj_sessions.findFirst({
      where: {
        ended_at: null,
        metadata: {
          path: ['streamKey'],
          equals: streamKey,
        },
      },
      orderBy: { started_at: 'desc' },
    })

    if (!activeSession) {
      // Fallback: try to match against Mux stream IDs in active sessions
      // The relay server may pass the Mux stream key directly
      return NextResponse.json({ error: 'No active session found for this stream key' }, { status: 404 })
    }

    const djName = activeSession.dj_name || 'DJ'
    const muxStreamId = activeSession.mux_stream_id

    // Get relay destinations from the relay server or use defaults
    const destinations = []

    // Mux is always the primary destination
    destinations.push({
      id: 'mux-primary',
      name: 'Mux (baseFM)',
      rtmpUrl: MUX_RTMP_URL,
      streamKey: streamKey, // same key the DJ is using
    })

    // Check for configured X relay
    const xRelay = await prisma.basefm_relay_destinations.findUnique({
      where: { key: 'x-live' },
    })
    if (xRelay?.enabled && xRelay.probe_url) {
      destinations.push({
        id: 'x-live',
        name: 'X (Twitter) Live',
        rtmpUrl: 'rtmp://ie.pscp.tv:80/x',
        streamKey: '', // DJ must set this via the dashboard
      })
    }

    return NextResponse.json({
      djName,
      muxStreamId,
      muxStreamKey: streamKey,
      muxRtmpUrl: MUX_RTMP_URL,
      destinations,
    })
  } catch (error) {
    console.error('[relay-auth] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
