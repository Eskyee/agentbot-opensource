import { NextResponse } from 'next/server'
import { buildBasefmDistribution, listBasefmRelayDestinations, verifyRelayPlaybackCoverage } from '@/app/lib/basefmDistribution'
import { prisma } from '@/app/lib/prisma'

interface CachedSessionRow {
  playback_id: string | null
  mux_stream_id: string
  dj_name: string | null
}

async function getPrimaryCachedSession() {
  const session = await prisma.dj_sessions.findFirst({
    where: {
      status: 'live',
      playback_id: { not: null },
    },
    orderBy: { started_at: 'desc' },
    select: {
      playback_id: true,
      mux_stream_id: true,
      dj_name: true,
    },
  })

  return session as CachedSessionRow | null
}

function getMuxCredentials() {
  return {
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
  }
}

export async function GET() {
  try {
    const { tokenId, tokenSecret } = getMuxCredentials()

    if (!tokenId || !tokenSecret) {
      const cached = await getPrimaryCachedSession()
      const relays = await listBasefmRelayDestinations().catch(() => [])
      const distribution = buildBasefmDistribution({
        availability: 'degraded',
        primaryDj: cached
          ? {
              playbackId: cached.playback_id,
              hlsUrl: cached.playback_id ? `https://stream.mux.com/${cached.playback_id}.m3u8` : null,
            }
          : null,
        relays,
      })

      return NextResponse.json({ distribution })
    }

    const auth = Buffer.from(`${tokenId}:${tokenSecret}`).toString('base64')
    const response = await fetch('https://api.mux.com/video/v1/live-streams?status=active&limit=1', {
      headers: { Authorization: `Basic ${auth}` },
      cache: 'no-store',
    })

    if (!response.ok) {
      const cached = await getPrimaryCachedSession()
      const relays = await listBasefmRelayDestinations().catch(() => [])
      const distribution = buildBasefmDistribution({
        availability: 'degraded',
        primaryDj: cached
          ? {
              playbackId: cached.playback_id,
              hlsUrl: cached.playback_id ? `https://stream.mux.com/${cached.playback_id}.m3u8` : null,
            }
          : null,
        relays,
      })

      return NextResponse.json(
        {
          distribution,
          error: 'Failed to fetch live distribution state',
        },
        { status: cached ? 200 : response.status }
      )
    }

    const payload = await response.json()
    const stream = payload.data?.[0] || null
    const primaryDj = stream
      ? {
          playbackId: stream.playback_ids?.[0]?.id || null,
          hlsUrl: stream.playback_ids?.[0]?.id
            ? `https://stream.mux.com/${stream.playback_ids[0].id}.m3u8`
            : null,
        }
      : null

    const relays = await listBasefmRelayDestinations().catch(() => [])
    const verifiedRelays = await verifyRelayPlaybackCoverage(primaryDj, relays).catch(() => relays)
    const distribution = buildBasefmDistribution({
      availability: primaryDj?.hlsUrl ? 'live' : 'degraded',
      primaryDj,
      relays: verifiedRelays,
    })

    return NextResponse.json({ distribution })
  } catch (error) {
    console.error('[basefm-distribution] error:', error)
    const cached = await getPrimaryCachedSession().catch(() => null)
    const relays = await listBasefmRelayDestinations().catch(() => [])
    const distribution = buildBasefmDistribution({
      availability: 'degraded',
      primaryDj: cached
        ? {
            playbackId: cached.playback_id,
            hlsUrl: cached.playback_id ? `https://stream.mux.com/${cached.playback_id}.m3u8` : null,
          }
        : null,
      relays,
    })

    return NextResponse.json(
      {
        distribution,
        error: cached ? 'Distribution state is temporarily degraded' : 'Internal server error',
      },
      { status: cached ? 200 : 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
