import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { buildBasefmDistribution, listBasefmRelayDestinations, verifyRelayPlaybackCoverage } from '@/app/lib/basefmDistribution'

interface DjSessionRow {
  id: number
  wallet: string
  dj_name: string | null
  playback_id: string | null
  mux_stream_id: string
  started_at: Date
  status: string
  metadata: unknown
}

interface MuxLiveStream {
  id: string
  stream_key: string
  status: 'active' | 'idle' | 'disabled'
  playback_ids?: Array<{ id: string; policy: string }>
  metadata?: {
    dj_wallet?: string
    dj_name?: string
    dj_city?: string
  }
  created_at: number
}

function getMuxCredentials() {
  return {
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
  }
}

function toLiveDj(args: {
  id: string
  name: string
  city?: string | null
  wallet: string | null
  playbackId: string | null
  streamKey?: string | null
  status: string
  startedAt: number | string
  source: 'mux' | 'session-cache'
}) {
  const playbackId = args.playbackId || null

  return {
    id: args.id,
    name: args.name,
    city: args.city || null,
    wallet: args.wallet,
    playbackId,
    streamKey: args.streamKey || null,
    status: args.status,
    startedAt: args.startedAt,
    source: args.source,
    hlsUrl: playbackId ? `https://stream.mux.com/${playbackId}.m3u8` : null,
    embedUrl: playbackId ? `https://stream.mux.com/${playbackId}.html` : null,
  }
}

function getSessionCity(session: Pick<DjSessionRow, 'metadata'> | undefined) {
  const metadata = session?.metadata
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null
  const city = (metadata as { city?: unknown }).city
  return typeof city === 'string' && city.trim() ? city.trim() : null
}

function fromSessionRow(session: DjSessionRow) {
  return toLiveDj({
    id: session.mux_stream_id,
    name: session.dj_name || 'Anonymous DJ',
    city: getSessionCity(session),
    wallet: session.wallet,
    playbackId: session.playback_id,
    status: session.status,
    startedAt: session.started_at.toISOString(),
    source: 'session-cache',
  })
}

async function getCachedLiveSessions() {
  const sessions = await prisma.dj_sessions.findMany({
    where: {
      status: 'live',
      playback_id: { not: null },
    },
    orderBy: { started_at: 'desc' },
    take: 8,
  })

  return sessions.map(fromSessionRow)
}

async function getSessionByMuxStreamId(muxStreamIds: string[]) {
  if (muxStreamIds.length === 0) {
    return new Map<string, DjSessionRow>()
  }

  const sessions = await prisma.dj_sessions.findMany({
    where: {
      mux_stream_id: { in: muxStreamIds },
    },
    orderBy: { started_at: 'desc' },
  })

  return new Map(sessions.map((session) => [session.mux_stream_id, session]))
}

async function reconcileLiveSessionsAgainstMux(streams: MuxLiveStream[]) {
  const knownStatuses = new Map(streams.map((stream) => [stream.id, stream.status]))
  const liveSessions = await prisma.dj_sessions.findMany({
    where: { status: 'live' },
    orderBy: { started_at: 'desc' },
  })

  const staleSessionIds = liveSessions
    .filter((session) => knownStatuses.get(session.mux_stream_id) !== 'active')
    .map((session) => session.id)

  if (staleSessionIds.length === 0) return

  await prisma.dj_sessions.updateMany({
    where: { id: { in: staleSessionIds } },
    data: {
      status: 'ended',
      ended_at: new Date(),
    },
  })
}

export async function GET() {
  try {
    const { tokenId, tokenSecret } = getMuxCredentials()

    if (!tokenId || !tokenSecret) {
      const cached = await getCachedLiveSessions()
      const relays = await listBasefmRelayDestinations().catch(() => [])
      const distribution = buildBasefmDistribution({
        availability: 'degraded',
        primaryDj: cached[0] || null,
        relays,
      })
      return NextResponse.json({
        djs: cached,
        count: cached.length,
        primaryDj: cached[0] || null,
        availability: 'degraded',
        distribution,
      })
    }

    const auth = Buffer.from(`${tokenId}:${tokenSecret}`).toString('base64')

    const response = await fetch('https://api.mux.com/video/v1/live-streams?limit=100', {
      headers: {
        'Authorization': `Basic ${auth}`,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Mux API error:', error)
      const cached = await getCachedLiveSessions()
      const relays = await listBasefmRelayDestinations().catch(() => [])
      const distribution = buildBasefmDistribution({
        availability: 'degraded',
        primaryDj: cached[0] || null,
        relays,
      })
      return NextResponse.json(
        {
          djs: cached,
          count: cached.length,
          primaryDj: cached[0] || null,
          availability: 'degraded',
          distribution,
          error: 'Failed to fetch streams from Mux',
        },
        { status: cached.length ? 200 : response.status }
      )
    }

    const data = await response.json()
    const streams: MuxLiveStream[] = data.data || []
    await reconcileLiveSessionsAgainstMux(streams).catch((error) => {
      console.error('[basefm-live] Failed to reconcile stale live sessions:', error)
    })

    const sessionByStreamId = await getSessionByMuxStreamId(streams.map((stream) => stream.id))

    const liveDJs = streams
      .filter(stream => stream.status === 'active')
      .map((stream) => {
        const session = sessionByStreamId.get(stream.id)

        return toLiveDj({
          id: stream.id,
          name: stream.metadata?.dj_name || session?.dj_name || 'Anonymous DJ',
          city: stream.metadata?.dj_city || getSessionCity(session),
          wallet: stream.metadata?.dj_wallet || session?.wallet || null,
          playbackId: stream.playback_ids?.[0]?.id || session?.playback_id || null,
          streamKey: stream.stream_key,
          status: stream.status,
          startedAt: session?.started_at?.toISOString() || stream.created_at,
          source: 'mux',
        })
      })
      .sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)))

    if (liveDJs.length > 0) {
      await Promise.all(
        liveDJs.map((dj) =>
          prisma.dj_sessions.updateMany({
            where: { mux_stream_id: dj.id },
            data: {
              status: 'live',
              ...(dj.playbackId ? { playback_id: dj.playbackId } : {}),
            },
          })
        )
      ).catch((error) => {
        console.error('[basefm-live] Failed to sync live session cache:', error)
      })
    }

    const primaryDj = liveDJs[0] || null
    const relays = await listBasefmRelayDestinations().catch(() => [])
    const verifiedRelays = await verifyRelayPlaybackCoverage(primaryDj, relays).catch(() => relays)
    const distribution = buildBasefmDistribution({
      availability: liveDJs.length > 0 ? 'live' : 'degraded',
      primaryDj,
      relays: verifiedRelays,
    })

    return NextResponse.json({
      djs: liveDJs,
      count: liveDJs.length,
      primaryDj,
      availability: liveDJs.length > 0 ? 'live' : 'degraded',
      distribution,
    })
  } catch (error) {
    console.error('Error fetching live DJs:', error)
    const cached = await getCachedLiveSessions().catch(() => [])
    const relays = await listBasefmRelayDestinations().catch(() => [])
    const distribution = buildBasefmDistribution({
      availability: 'degraded',
      primaryDj: cached[0] || null,
      relays,
    })
    return NextResponse.json(
      {
        djs: cached,
        count: cached.length,
        primaryDj: cached[0] || null,
        availability: 'degraded',
        distribution,
        error: cached.length ? 'Live stream sync is temporarily degraded' : 'Internal server error',
      },
      { status: cached.length ? 200 : 500 }
    )
  }
}
