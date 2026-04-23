import { NextRequest, NextResponse } from 'next/server'
import { buildBasefmFfmpegCommandTemplate } from '@/app/lib/basefmDjSkill'
import { createBasefmSessionToken, verifyBasefmSessionToken } from '@/app/lib/basefmSession'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { getCommunityProgramForUser } from '@/app/lib/communityProgram'
import { getMuxCredentials, retireMuxLiveStream } from '@/app/lib/basefmMux'
import { prisma } from '@/app/lib/prisma'
import { verifyUsdcTransfer } from '@/lib/onchain/verify-transaction'
import { type Address, type Hash } from 'viem'

const MAX_SESSION_SECONDS = 7200 // 2 hours
const COOLDOWN_HOURS = 24
const COOLDOWN_MS = COOLDOWN_HOURS * 60 * 60 * 1000
const PAID_SESSION_FEE_USDC = 5

const MUX_RTMP_URL = 'rtmp://global-live.mux.com:5222/app'

const BASEFM_TOKEN_ADDRESS = '0x9a4376bab717ac0a3901eeed8308a420c59c0ba3'
const BASEFM_TOKEN_THRESHOLD = BigInt('2500000000000000000000000') // 2,500,000 BASEFM

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
      wallet: { equals: wallet, mode: 'insensitive' },
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

async function getAuthorizedActiveSession(request: NextRequest) {
  const accessToken = request.nextUrl.searchParams.get('sessionToken') || request.headers.get('x-basefm-session')
  if (accessToken) {
    const payload = verifyBasefmSessionToken(accessToken)
    if (!payload) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
    const activeSession = await prisma.dj_sessions.findUnique({ where: { id: payload.sessionId } })
    if (!activeSession || !CURRENT_SESSION_STATUSES.includes(activeSession.status as any)) return { activeSession: null }
    if (activeSession.wallet.toLowerCase() !== payload.wallet.toLowerCase()) return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
    return { activeSession }
  }
  const session = await getAuthSession()
  if (!session?.user?.id) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
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
        params: [{ to: BASEFM_TOKEN_ADDRESS, data: '0x70a08231000000000000000000000000' + walletAddress.replace('0x', '') }, 'latest'],
        id: 1,
      }),
    })
    const result = await response.json()
    return BigInt(result.result || '0x0') >= BASEFM_TOKEN_THRESHOLD
  } catch { return false }
}

async function getLastEndedSessionForWallet(wallet: string) {
  return prisma.dj_sessions.findFirst({
    where: { wallet: { equals: wallet, mode: 'insensitive' }, status: { in: ['ended', 'auto-ended', 'archived'] }, ended_at: { not: null } },
    orderBy: { ended_at: 'desc' },
  })
}

export async function POST(request: NextRequest) {
  const { tokenId: muxTokenId, tokenSecret: muxTokenSecret } = getMuxCredentials()
  if (!muxTokenId || !muxTokenSecret) return NextResponse.json({ error: 'Mux not configured' }, { status: 500 })

  try {
    const session = await getAuthSession()
    const body = await request.json()
    const wallet = typeof body?.wallet === 'string' ? body.wallet.trim() : ''
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    const txHash = typeof body?.txHash === 'string' ? body.txHash.trim() : ''

    if (!wallet) return NextResponse.json({ error: 'Wallet address required' }, { status: 400 })

    const [hasBasefmAccess, communityProgram] = await Promise.all([
      verifyBASEFMBalance(wallet),
      session?.user?.id ? getCommunityProgramForUser(session.user.id).catch(() => null) : Promise.resolve(null),
    ])
    
    const claimedWallet = communityProgram?.rewards.walletAddress || null
    const hasCommunityPass = communityProgram?.perks.some(p => p.key === 'basefm-pass' && p.unlocked) || false
    const claimedWalletMatches = Boolean(claimedWallet) && claimedWallet!.toLowerCase() === wallet.toLowerCase()

    let accessType: 'basefm' | 'community-pass' | 'paid' = 'basefm'
    if (!hasBasefmAccess && !hasCommunityPass) {
      if (!txHash) return NextResponse.json({ error: 'payment_required', message: `Pay $${PAID_SESSION_FEE_USDC} USDC to start.`, fee: PAID_SESSION_FEE_USDC }, { status: 402 })
      const platformWallet = process.env.PLATFORM_WALLET_ADDRESS || '0x5E05FFD981FC497A12FcCe2C0d87767f1E794C30'
      const verif = await verifyUsdcTransfer(txHash as Hash, platformWallet as Address, PAID_SESSION_FEE_USDC, wallet.toLowerCase() as Address)
      if (!verif.verified) return NextResponse.json({ error: `Payment failed: ${verif.error}` }, { status: 400 })
      accessType = 'paid'
    } else if (hasCommunityPass && !hasBasefmAccess) {
      if (!claimedWalletMatches) return NextResponse.json({ error: 'Community pass requires claimed wallet', wallet: claimedWallet }, { status: 403 })
      accessType = 'community-pass'
    }

    const streamWallet = wallet.toLowerCase()
    const existingSessions = await getCurrentSessionsForWallet(streamWallet)
    if (existingSessions[0]) {
      const expiredIds = existingSessions.filter(s => getSessionRemainingSeconds(s) <= 0).map(s => s.id)
      if (expiredIds.length > 0) {
        await endSessions(expiredIds, 'auto-ended')
        await retireSessionStreams(existingSessions.filter(s => expiredIds.includes(s.id))).catch(() => {})
      }
      const blocking = existingSessions.find(s => !expiredIds.includes(s.id))
      if (blocking) {
        if (session?.user?.id === blocking.user_id) {
          const auth = Buffer.from(`${muxTokenId}:${muxTokenSecret}`).toString('base64')
          const muxRes = await fetch(`https://api.mux.com/video/v1/live-streams/${blocking.mux_stream_id}`, { headers: { 'Authorization': `Basic ${auth}` } })
          if (muxRes.ok) {
            const stream = (await muxRes.json()).data
            return NextResponse.json({
              success: true, reconnected: true,
              stream: { id: stream.id, name: stream.metadata?.dj_name || blocking.dj_name || 'DJ', wallet: streamWallet, streamKey: stream.stream_key, rtmpUrl: MUX_RTMP_URL, playbackId: stream.playback_ids?.[0]?.id || null, status: stream.status },
              session: { id: blocking.id, wallet: streamWallet, maxDuration: MAX_SESSION_SECONDS, remaining: getSessionRemainingSeconds(blocking), expiresAt: new Date(blocking.started_at.getTime() + MAX_SESSION_SECONDS * 1000).toISOString(), accessToken: createBasefmSessionToken({ sessionId: blocking.id, wallet: streamWallet, userId: session!.user.id, ttlSeconds: getSessionRemainingSeconds(blocking) + 3600 }) }
            })
          }
        }
        return NextResponse.json({ error: 'active_session_exists', message: 'You already have a stream.' }, { status: 409 })
      }
    }

    const lastEnded = await getLastEndedSessionForWallet(streamWallet)
    if (lastEnded?.ended_at) {
      const actualExpiry = new Date(lastEnded.started_at.getTime() + MAX_SESSION_SECONDS * 1000)
      const effectiveEnd = lastEnded.ended_at < actualExpiry ? lastEnded.ended_at : actualExpiry
      if (Date.now() - effectiveEnd.getTime() < COOLDOWN_MS) return NextResponse.json({ error: 'cooldown_active', message: '24h cooldown in effect.' }, { status: 429 })
    }

    const auth = Buffer.from(`${muxTokenId}:${muxTokenSecret}`).toString('base64')
    const muxRes = await fetch('https://api.mux.com/video/v1/live-streams', {
      method: 'POST',
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ playback_policy: ['public'], new_asset_settings: { playback_policy: ['public'] }, metadata: { dj_wallet: streamWallet, dj_name: name || 'DJ', access_type: accessType, tx_hash: txHash || null } }),
    })
    if (!muxRes.ok) return NextResponse.json({ error: 'Mux creation failed' }, { status: muxRes.status })
    const stream = (await muxRes.json()).data
    const sessionRecord = await prisma.dj_sessions.create({ data: { user_id: session?.user?.id || 'anonymous', wallet: streamWallet, dj_name: name || 'DJ', mux_stream_id: stream.id, playback_id: stream.playback_ids?.[0]?.id || null, max_duration: MAX_SESSION_SECONDS, metadata: { accessType, txHash: txHash || null } as any } })

    return NextResponse.json({
      success: true,
      stream: { id: stream.id, name: name || 'DJ', wallet: streamWallet, streamKey: stream.stream_key, rtmpUrl: MUX_RTMP_URL, fullRtmpUrl: `${MUX_RTMP_URL}/${stream.stream_key}`, playbackId: stream.playback_ids?.[0]?.id || null, status: stream.status },
      session: { id: sessionRecord.id, wallet: streamWallet, maxDuration: MAX_SESSION_SECONDS, remaining: MAX_SESSION_SECONDS, expiresAt: new Date(Date.now() + MAX_SESSION_SECONDS * 1000).toISOString(), accessToken: createBasefmSessionToken({ sessionId: sessionRecord.id, wallet: streamWallet, userId: session?.user?.id || null, ttlSeconds: MAX_SESSION_SECONDS + 3600 }) },
      ffmpeg: { command: buildBasefmFfmpegCommandTemplate(`${MUX_RTMP_URL}/${stream.stream_key}`) }
    })
  } catch (error) { return NextResponse.json({ error: 'Internal error' }, { status: 500 }) }
}

export async function GET(request: NextRequest) {
  const auth = await getAuthorizedActiveSession(request)
  if (auth.error) return auth.error
  if (!auth.activeSession) return NextResponse.json({ active: false, message: 'No active session.' })
  const remaining = getSessionRemainingSeconds(auth.activeSession)
  if (remaining <= 0) {
    await endSessions([auth.activeSession.id], 'auto-ended')
    await retireSessionStreams([auth.activeSession]).catch(() => {})
    return NextResponse.json({ active: false, message: 'Session expired.' })
  }
  return NextResponse.json(buildActiveSessionResponse(auth.activeSession))
}

export async function DELETE(request: NextRequest) {
  const auth = await getAuthorizedActiveSession(request)
  if (auth.error) return auth.error
  if (!auth.activeSession) return NextResponse.json({ success: true, message: 'No session' })
  await endSessions([auth.activeSession.id], 'ended')
  await retireSessionStreams([auth.activeSession]).catch(() => {})
  return NextResponse.json({ success: true, message: 'Session ended' })
}
