import { NextRequest, NextResponse } from 'next/server'
import { buildBasefmFfmpegCommandTemplate } from '@/app/lib/basefmDjSkill'
import { createBasefmSessionToken, verifyBasefmSessionToken } from '@/app/lib/basefmSession'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { getCommunityProgramForUser } from '@/app/lib/communityProgram'
import { prisma } from '@/app/lib/prisma'

const MAX_SESSION_SECONDS = 7200 // 2 hours

const MUX_RTMP_URL = 'rtmp://global-live.mux.com:5222/app'

const RAVE_TOKEN_ADDRESS = '0xdf3c79a5759eeedb844e7481309a75037b8e86f5'
const RAVE_TOKEN_THRESHOLD = BigInt('1250000000000000000000000') // 1,250,000 RAVE in wei

type ActiveDjSession = {
  id: number
  user_id: string
  wallet: string
  dj_name: string | null
  playback_id: string | null
  started_at: Date
  ended_at: Date | null
  max_duration: number
  status: string
}

function getSessionRemainingSeconds(activeSession: Pick<ActiveDjSession, 'started_at'>) {
  const elapsed = Math.floor((Date.now() - activeSession.started_at.getTime()) / 1000)
  return Math.max(0, MAX_SESSION_SECONDS - elapsed)
}

async function markSessionAutoEnded(sessionId: number) {
  await prisma.dj_sessions.update({
    where: { id: sessionId },
    data: { status: 'auto-ended', ended_at: new Date() },
  })
}

function buildActiveSessionResponse(activeSession: ActiveDjSession) {
  const remaining = getSessionRemainingSeconds(activeSession)

  return {
    active: true,
    session: {
      id: activeSession.id,
      wallet: activeSession.wallet,
      djName: activeSession.dj_name,
      playbackId: activeSession.playback_id,
      startedAt: activeSession.started_at,
      elapsed: MAX_SESSION_SECONDS - remaining,
      remaining,
      remainingMinutes: Math.floor(remaining / 60),
      expiresAt: new Date(activeSession.started_at.getTime() + MAX_SESSION_SECONDS * 1000).toISOString(),
    },
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

async function verifyRAVEBalance(walletAddress: string): Promise<boolean> {
  try {
    const response = await fetch('https://mainnet.base.org', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [
          {
            to: RAVE_TOKEN_ADDRESS,
            data: '0x70a08231000000000000000000000000' + walletAddress.replace('0x', ''),
          },
          'latest',
        ],
        id: 1,
      }),
    })
    const result = await response.json()
    const balance = BigInt(result.result || '0x0')
    return balance >= RAVE_TOKEN_THRESHOLD
  } catch (error) {
    console.error('Error verifying RAVE balance:', error)
    return false
  }
}

function getMuxCredentials() {
  return {
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
  }
}

export async function POST(request: NextRequest) {
  const { tokenId: muxTokenId, tokenSecret: muxTokenSecret } = getMuxCredentials()

  if (!muxTokenId || !muxTokenSecret) {
    return NextResponse.json({ error: 'Mux not configured' }, { status: 500 })
  }

  try {
    const session = await getAuthSession()
    const body = await request.json()
    const wallet = typeof body?.wallet === 'string' ? body.wallet.trim() : ''
    const name = typeof body?.name === 'string' ? body.name.trim() : ''

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 })
    }

    const [hasRaveAccess, communityProgram] = await Promise.all([
      verifyRAVEBalance(wallet),
      session?.user?.id ? getCommunityProgramForUser(session.user.id).catch(() => null) : Promise.resolve(null),
    ])
    const claimedWallet = communityProgram?.rewards.walletAddress || null

    const hasCommunityPass = communityProgram?.perks.some(
      (perk) => perk.key === 'basefm-pass' && perk.unlocked
    ) || false

    const claimedWalletMatches =
      Boolean(claimedWallet) && claimedWallet!.toLowerCase() === wallet.toLowerCase()
    const canUseCommunityPass = !hasRaveAccess && hasCommunityPass && claimedWalletMatches

    if (!hasRaveAccess && !hasCommunityPass) {
      return NextResponse.json(
        { error: 'Insufficient RAVE tokens or community guest pass. Need 1,250,000 RAVE or a Builder/Whale Agentbot claim.' },
        { status: 403 }
      )
    }

    if (!hasRaveAccess && hasCommunityPass && !canUseCommunityPass) {
      return NextResponse.json(
        {
          error: 'Community guest pass only works with your claimed Agentbot wallet.',
          wallet: claimedWallet,
        },
        { status: 403 }
      )
    }

    const streamWallet = hasRaveAccess ? wallet : claimedWallet!

    const existingSession = await prisma.dj_sessions.findFirst({
      where: { wallet: streamWallet, status: 'active' },
      orderBy: { started_at: 'desc' },
    })

    if (existingSession) {
      const remaining = getSessionRemainingSeconds(existingSession)

      if (remaining <= 0) {
        await markSessionAutoEnded(existingSession.id)
      } else {
        return NextResponse.json(
          {
            error: 'active_session_exists',
            message: `You already have an active stream. ${Math.floor(remaining / 60)} minutes remaining.`,
            remaining,
            sessionId: existingSession.id,
          },
          { status: 409 }
        )
      }
    }

    const auth = Buffer.from(`${muxTokenId}:${muxTokenSecret}`).toString('base64')
    const response = await fetch('https://api.mux.com/video/v1/live-streams', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playback_policy: ['public'],
        new_asset_settings: { playback_policy: ['public'] },
        metadata: {
          dj_wallet: streamWallet,
          dj_name: name || 'Anonymous DJ',
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Mux API error:', error)
      return NextResponse.json({ error: 'Failed to create stream' }, { status: response.status })
    }

    const result = await response.json()
    const stream = result.data
    const sessionRecord = await prisma.dj_sessions.create({
      data: {
        user_id: session?.user?.id || 'anonymous',
        wallet: streamWallet,
        dj_name: name || 'Anonymous DJ',
        mux_stream_id: stream.id,
        playback_id: stream.playback_ids?.[0]?.id || null,
        max_duration: MAX_SESSION_SECONDS,
      },
    })
    const sessionAccessToken = createBasefmSessionToken({
      sessionId: sessionRecord.id,
      wallet: streamWallet,
      userId: session?.user?.id || null,
      ttlSeconds: MAX_SESSION_SECONDS + 3600,
    })

    return NextResponse.json({
      success: true,
      stream: {
        id: stream.id,
        name: stream.metadata?.dj_name || name || 'Anonymous DJ',
        wallet: streamWallet,
        streamKey: stream.stream_key,
        rtmpUrl: MUX_RTMP_URL,
        fullRtmpUrl: `${MUX_RTMP_URL}/${stream.stream_key}`,
        playbackId: stream.playback_ids?.[0]?.id || null,
        status: stream.status,
        accessGrantedBy: hasRaveAccess ? 'rave' : 'community-pass',
      },
      session: {
        id: sessionRecord.id,
        wallet: streamWallet,
        maxDuration: MAX_SESSION_SECONDS,
        remaining: MAX_SESSION_SECONDS,
        expiresAt: new Date(Date.now() + MAX_SESSION_SECONDS * 1000).toISOString(),
        accessToken: sessionAccessToken,
      },
      obsSettings: {
        server: MUX_RTMP_URL,
        streamKey: stream.stream_key,
        recommended: {
          video: {
            resolution: '1280x720 (720p) or 1920x1080 (1080p)',
            bitrate: '2500-4500 kbps',
            framerate: '30 fps',
            encoder: 'H.264',
            keyframeInterval: '2 seconds',
          },
          audio: {
            bitrate: '256-320 kbps',
            encoder: 'AAC',
            sampleRate: '44.1 kHz',
            channels: 'Stereo',
          },
        },
      },
      streamType: 'video+audio',
      playback: {
        hls: stream.playback_ids?.[0]?.id ? `https://stream.mux.com/${stream.playback_ids[0].id}.m3u8` : null,
        web: stream.playback_ids?.[0]?.id ? `https://stream.mux.com/${stream.playback_ids[0].id}.html` : null,
      },
      ffmpeg: {
        command: buildBasefmFfmpegCommandTemplate(`${MUX_RTMP_URL}/${stream.stream_key}`),
        inputHint: 'Replace INPUT_MEDIA with your rendered video/audio source inside the agent runtime.',
      },
    })
  } catch (error) {
    console.error('Error creating stream:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/basefm/streams
 * Check the authorized active session status and remaining time
 */
export async function GET(request: NextRequest) {
  const authorized = await getAuthorizedActiveSession(request)
  if (authorized.error) {
    return authorized.error
  }

  const activeSession = authorized.activeSession
  if (!activeSession) {
    return NextResponse.json({
      active: false,
      message: 'No active session. Start a new stream!',
    })
  }

  const remaining = getSessionRemainingSeconds(activeSession)

  if (remaining <= 0) {
    await markSessionAutoEnded(activeSession.id)
    return NextResponse.json({
      active: false,
      message: 'Session expired (2h max). Start a new stream!',
    })
  }

  return NextResponse.json(buildActiveSessionResponse(activeSession))
}

/**
 * DELETE /api/basefm/streams
 * End the authorized current session
 */
export async function DELETE(request: NextRequest) {
  const authorized = await getAuthorizedActiveSession(request)
  if (authorized.error) {
    return authorized.error
  }

  const activeSession = authorized.activeSession
  if (!activeSession) {
    return NextResponse.json({
      success: true,
      ended: 0,
      message: 'No active session found',
    })
  }

  await prisma.dj_sessions.update({
    where: { id: activeSession.id },
    data: { status: 'ended', ended_at: new Date() },
  })

  return NextResponse.json({
    success: true,
    ended: 1,
    message: 'Session ended',
  })
}
