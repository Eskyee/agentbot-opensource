import { NextRequest, NextResponse } from 'next/server'
import { buildBasefmFfmpegCommandTemplate } from '@/app/lib/basefmDjSkill'
import { createBasefmSessionToken, verifyBasefmSessionToken } from '@/app/lib/basefmSession'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { getCommunityProgramForUser } from '@/app/lib/communityProgram'
import { getMuxCredentials, retireMuxLiveStream } from '@/app/lib/basefmMux'
import { prisma } from '@/app/lib/prisma'

const MAX_SESSION_SECONDS = 7200 // 2 hours
const COOLDOWN_HOURS = 24
const COOLDOWN_MS = COOLDOWN_HOURS * 60 * 60 * 1000

const MUX_RTMP_URL = 'rtmp://global-live.mux.com:5222/app'

const BASEFM_TOKEN_ADDRESS = '0x9a4376bab717ac0a3901eeed8308a420c59c0ba3'
const BASEFM_TOKEN_THRESHOLD = BigInt('2500000000000000000000000') // 2,500,000 BASEFM in wei — covers Mux USDC costs + profit

type ActiveDjSession = {
  id: number
  user_id: string
  wallet: string
  dj_name: string | null
  mux_stream_id: string
  playback_id: string | null
  started_at: Date
  ended_at: Date | null
  max_duration: number
  status: string
}

const CURRENT_SESSION_STATUSES = ['active', 'live'] as const

function getSessionRemainingSeconds(activeSession: Pick<ActiveDjSession, 'started_at'>) {
  const elapsed = Math.floor((Date.now() - activeSession.started_at.getTime()) / 1000)
  return Math.max(0, MAX_SESSION_SECONDS - elapsed)
}

async function getCurrentSessionsForWallet(wallet: string) {
  return prisma.dj_sessions.findMany({
    where: {
      wallet,
      status: { in: [...CURRENT_SESSION_STATUSES] },
    },
    orderBy: { started_at: 'desc' },
  })
}

async function endSessions(sessionIds: number[], status: 'ended' | 'auto-ended' | 'archived') {
  if (sessionIds.length === 0) return 0

  const result = await prisma.dj_sessions.updateMany({
    where: { id: { in: sessionIds } },
    data: { status, ended_at: new Date() },
  })

  return result.count
}

async function retireSessionStreams(
  sessions: Array<Pick<ActiveDjSession, 'mux_stream_id'>>,
  options: { preserveAssets?: boolean } = {}
) {
  const streamIds = [...new Set(sessions.map((session) => session.mux_stream_id))]
  if (streamIds.length === 0) return []

  return Promise.all(
    streamIds.map((streamId) =>
      retireMuxLiveStream(streamId, { preserveAssets: options.preserveAssets })
    )
  )
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

    if (!activeSession || !CURRENT_SESSION_STATUSES.includes(activeSession.status as (typeof CURRENT_SESSION_STATUSES)[number])) {
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
    where: { user_id: session.user.id, status: { in: [...CURRENT_SESSION_STATUSES] } },
    orderBy: { started_at: 'desc' },
  })

  return { activeSession }
}

async function verifyBASEFMBalance(walletAddress: string): Promise<boolean> {
  try {
    const response = await fetch('https://mainnet.base.org', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [
          {
            to: BASEFM_TOKEN_ADDRESS,
            data: '0x70a08231000000000000000000000000' + walletAddress.replace('0x', ''),
          },
          'latest',
        ],
        id: 1,
      }),
    })
    const result = await response.json()
    const balance = BigInt(result.result || '0x0')
    return balance >= BASEFM_TOKEN_THRESHOLD
  } catch (error) {
    console.error('Error verifying BASEFM balance:', error)
    return false
  }
}

/**
 * 24-hour cooldown between DJ streams — applies to ALL users, no admin bypass.
 * Returns the most recent ended session if still within cooldown window.
 */
async function getLastEndedSessionForWallet(wallet: string) {
  return prisma.dj_sessions.findFirst({
    where: {
      wallet,
      status: { in: ['ended', 'auto-ended', 'archived'] },
      ended_at: { not: null },
    },
    orderBy: { ended_at: 'desc' },
  })
}

function getArchiveCreditCost() {
  const raw = process.env.BASEFM_ARCHIVE_CREDIT_COST
  if (!raw) return null

  const parsed = Number.parseInt(raw, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}

async function debitArchiveCredits(userId: string, cost: number) {
  const result = await prisma.user.updateMany({
    where: { id: userId, referralCredits: { gte: cost } },
    data: { referralCredits: { decrement: cost } },
  })

  return result.count > 0
}

async function refundArchiveCredits(userId: string, cost: number) {
  await prisma.user.update({
    where: { id: userId },
    data: { referralCredits: { increment: cost } },
  })
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

    const [hasBasefmAccess, communityProgram] = await Promise.all([
      verifyBASEFMBalance(wallet),
      session?.user?.id ? getCommunityProgramForUser(session.user.id).catch(() => null) : Promise.resolve(null),
    ])
    const claimedWallet = communityProgram?.rewards.walletAddress || null

    const hasCommunityPass = communityProgram?.perks.some(
      (perk) => perk.key === 'basefm-pass' && perk.unlocked
    ) || false

    const claimedWalletMatches =
      Boolean(claimedWallet) && claimedWallet!.toLowerCase() === wallet.toLowerCase()
    const canUseCommunityPass = !hasBasefmAccess && hasCommunityPass && claimedWalletMatches

    if (!hasBasefmAccess && !hasCommunityPass) {
      return NextResponse.json(
        { error: 'Insufficient BASEFM tokens or community guest pass. Need 2,500,000 BASEFM or a Builder/Whale Agentbot claim.' },
        { status: 403 }
      )
    }

    if (!hasBasefmAccess && hasCommunityPass && !canUseCommunityPass) {
      return NextResponse.json(
        {
          error: 'Community guest pass only works with your claimed Agentbot wallet.',
          wallet: claimedWallet,
        },
        { status: 403 }
      )
    }

    const streamWallet = hasBasefmAccess ? wallet : claimedWallet!

    const existingSessions = await getCurrentSessionsForWallet(streamWallet)
    const activeExistingSession = existingSessions[0] || null

    if (activeExistingSession) {
      const expiredSessionIds = existingSessions
        .filter((session) => getSessionRemainingSeconds(session) <= 0)
        .map((session) => session.id)

      if (expiredSessionIds.length > 0) {
        await endSessions(expiredSessionIds, 'auto-ended')
        await retireSessionStreams(
          existingSessions.filter((session) => expiredSessionIds.includes(session.id))
        ).catch((error) => {
          console.error('[basefm-streams] failed to retire expired Mux stream resources:', error)
        })
      }

      const blockingSession = existingSessions.find((session) => !expiredSessionIds.includes(session.id))

      if (blockingSession) {
        const remaining = getSessionRemainingSeconds(blockingSession)
        return NextResponse.json(
          {
            error: 'active_session_exists',
            message: `You already have an active stream. ${Math.floor(remaining / 60)} minutes remaining.`,
            remaining,
            sessionId: blockingSession.id,
          },
          { status: 409 }
        )
      }
    }

    // 24-hour cooldown between streams — applies to ALL users, no admin bypass
    // For auto-ended sessions, ended_at may be set to detection time (not actual expiry).
    // Use the earlier of ended_at and (started_at + MAX_SESSION_SECONDS) as the effective end.
    const lastEnded = await getLastEndedSessionForWallet(streamWallet)
    if (lastEnded?.ended_at) {
      const actualExpiry = new Date(lastEnded.started_at.getTime() + MAX_SESSION_SECONDS * 1000)
      const effectiveEnd = lastEnded.ended_at < actualExpiry ? lastEnded.ended_at : actualExpiry
      const elapsed = Date.now() - effectiveEnd.getTime()
      if (elapsed < COOLDOWN_MS) {
        const remainingMs = COOLDOWN_MS - elapsed
        const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000))
        const availableAt = new Date(effectiveEnd.getTime() + COOLDOWN_MS).toISOString()
        return NextResponse.json(
          {
            error: 'cooldown_active',
            message: `${COOLDOWN_HOURS}-hour cooldown between streams. Available in ~${remainingHours}h.`,
            cooldownRemaining: Math.ceil(remainingMs / 1000),
            availableAt,
          },
          { status: 429 }
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
        accessGrantedBy: hasBasefmAccess ? 'basefm' : 'community-pass',
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
        inputHint: 'Uses the default baseFM artwork image and generated silent audio. Swap the image URL if you want a different visual.',
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
    await endSessions([activeSession.id], 'auto-ended')
    await retireSessionStreams([activeSession]).catch((error) => {
      console.error('[basefm-streams] failed to retire expired current session:', error)
    })
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

  const body = await request.json().catch(() => null)
  const preserveArchive = Boolean(body?.archive)
  const archiveCreditCost = getArchiveCreditCost()
  let chargedArchiveUserId: string | null = null

  if (preserveArchive) {
    const session = await getAuthSession()
    if (!session?.user?.id || session.user.id !== activeSession.user_id) {
      return NextResponse.json(
        { error: 'Archive requires the owning logged-in Agentbot account.' },
        { status: 403 }
      )
    }

    if (!archiveCreditCost) {
      return NextResponse.json(
        { error: 'Archive is temporarily unavailable until BASEFM archive pricing is configured.' },
        { status: 503 }
      )
    }

    const charged = await debitArchiveCredits(session.user.id, archiveCreditCost)
    if (!charged) {
      return NextResponse.json(
        {
          error: 'insufficient_credits',
          message: `Need ${archiveCreditCost} credits to save a DJ archive.`,
          archiveCreditCost,
        },
        { status: 402 }
      )
    }

    chargedArchiveUserId = session.user.id
  }

  const currentSessions = await getCurrentSessionsForWallet(activeSession.wallet)
  const ended = await endSessions(
    currentSessions.map((session) => session.id),
    preserveArchive ? 'archived' : 'ended'
  )

  const muxRetirements = await retireSessionStreams(currentSessions, { preserveAssets: preserveArchive })
  const allMuxStopped = muxRetirements.every((result) => result.ok)

  if (preserveArchive && chargedArchiveUserId && !allMuxStopped && archiveCreditCost) {
    await refundArchiveCredits(chargedArchiveUserId, archiveCreditCost).catch((error) => {
      console.error('[basefm-streams] failed to refund archive credits after Mux cleanup failure:', error)
    })
    chargedArchiveUserId = null
  }

  return NextResponse.json({
    success: true,
    ended,
    muxStopped: allMuxStopped,
    archived: preserveArchive,
    archiveCreditCost: preserveArchive ? archiveCreditCost : null,
    deletedAssetIds: muxRetirements.flatMap((result) => result.deletedAssetIds),
    retainedAssetIds: muxRetirements.flatMap((result) => result.retainedAssetIds),
    message: preserveArchive
      ? allMuxStopped
        ? 'Session archived. Live stream retired and Mux assets kept for paid archive storage.'
        : 'Session archived, but Mux cleanup needs attention.'
      : allMuxStopped
        ? 'Session ended. Live stream and recent Mux assets deleted to avoid archive cost.'
        : 'Session ended, but Mux cleanup needs attention.',
  })
}
