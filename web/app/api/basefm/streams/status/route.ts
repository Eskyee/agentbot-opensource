import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { verifyBasefmSessionToken } from '@/app/lib/basefmSession'
import { prisma } from '@/app/lib/prisma'

function getMuxCredentials() {
  return {
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
  }
}

function getBasefmSessionToken(request: NextRequest) {
  return request.nextUrl.searchParams.get('sessionToken') || request.headers.get('x-basefm-session')
}

async function getAuthorizedActiveSession(request: NextRequest) {
  const accessToken = getBasefmSessionToken(request)
  if (accessToken) {
    const payload = verifyBasefmSessionToken(accessToken)
    if (!payload) {
      return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
    }

    const activeSession = await prisma.dj_sessions.findUnique({
      where: { id: payload.sessionId },
    })

    if (!activeSession || activeSession.status !== 'active') {
      return { activeSession: null }
    }

    if (activeSession.wallet.toLowerCase() !== payload.wallet.toLowerCase()) {
      return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
    }

    if (payload.userId && activeSession.user_id !== payload.userId) {
      return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
    }

    return { activeSession }
  }

  const session = await getAuthSession()
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const activeSession = await prisma.dj_sessions.findFirst({
    where: { user_id: session.user.id, status: 'active' },
    orderBy: { started_at: 'desc' },
  })

  return { activeSession }
}

async function getMuxStream(streamId: string) {
  const { tokenId, tokenSecret } = getMuxCredentials()
  if (!tokenId || !tokenSecret) {
    throw new Error('Mux not configured')
  }

  const auth = Buffer.from(`${tokenId}:${tokenSecret}`).toString('base64')
  const response = await fetch(`https://api.mux.com/video/v1/live-streams/${streamId}`, {
    headers: {
      Authorization: `Basic ${auth}`,
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Mux stream fetch failed: ${response.status} ${errorText}`)
  }

  const payload = await response.json()
  return payload.data
}

export async function GET(request: NextRequest) {
  try {
    const authorized = await getAuthorizedActiveSession(request)
    if (authorized.error) return authorized.error

    const activeSession = authorized.activeSession
    if (!activeSession) {
      return NextResponse.json({ active: false, message: 'No active stream session found' })
    }

    const muxStream = await getMuxStream(activeSession.mux_stream_id)
    return NextResponse.json({
      active: true,
      session: {
        id: activeSession.id,
        djName: activeSession.dj_name,
        muxStreamId: activeSession.mux_stream_id,
        playbackId: activeSession.playback_id,
      },
      mux: {
        id: muxStream.id,
        status: muxStream.status,
        playbackId: muxStream.playback_ids?.[0]?.id || null,
        recentAssetIds: muxStream.recent_asset_ids || [],
      },
    })
  } catch (error) {
    console.error('[basefm-stream-status] GET error:', error)
    const message = error instanceof Error ? error.message : 'Failed to read Mux status'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authorized = await getAuthorizedActiveSession(request)
    if (authorized.error) return authorized.error

    const activeSession = authorized.activeSession
    if (!activeSession) {
      return NextResponse.json({ error: 'No active stream session found' }, { status: 404 })
    }

    const muxStream = await getMuxStream(activeSession.mux_stream_id)
    const playbackId = muxStream.playback_ids?.[0]?.id || activeSession.playback_id || null

    if (muxStream.status === 'active') {
      await prisma.dj_sessions.update({
        where: { id: activeSession.id },
        data: {
          status: 'live',
          ...(playbackId ? { playback_id: playbackId } : {}),
        },
      })

      return NextResponse.json({
        success: true,
        synced: true,
        muxStatus: muxStream.status,
        playbackId,
        message: 'Mux stream is active. Session synced to live.',
      })
    }

    return NextResponse.json({
      success: false,
      synced: false,
      muxStatus: muxStream.status,
      playbackId,
      message: 'Mux stream is not active yet. OBS ingest still needs to connect.',
    })
  } catch (error) {
    console.error('[basefm-stream-status] POST error:', error)
    const message = error instanceof Error ? error.message : 'Failed to sync stream from Mux'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
