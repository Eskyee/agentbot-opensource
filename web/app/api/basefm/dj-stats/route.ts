/**
 * GET /api/basefm/dj-stats
 * Fetches the authenticated user's baseFM DJ stats using their linked wallet.
 * Pulls listener count, tip total, show count, follower count from baseFM.
 */
import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { getLegacyUserIdByEmail } from '@/app/lib/legacyUserId'

const BASEFM_URL = process.env.BASEFM_SPACE_URL || 'https://basefm.space'

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const legacyId = await getLegacyUserIdByEmail(session.user.email)
  if (!legacyId) return NextResponse.json({ linked: false })

  const user = await prisma.users.findUnique({
    where: { id: legacyId },
    select: { basefm_wallet: true },
  })

  if (!user?.basefm_wallet) {
    return NextResponse.json({ linked: false })
  }

  const wallet = user.basefm_wallet

  try {
    // Fetch DJ profile + streams from baseFM
    const [djRes, streamsRes] = await Promise.all([
      fetch(`${BASEFM_URL}/api/djs?wallet=${wallet}`, {
        headers: { 'User-Agent': 'Agentbot/1.0' },
        signal: AbortSignal.timeout(6000),
        cache: 'no-store',
      }),
      fetch(`${BASEFM_URL}/api/streams?djWalletAddress=${wallet}&limit=50`, {
        headers: { 'User-Agent': 'Agentbot/1.0' },
        signal: AbortSignal.timeout(6000),
        cache: 'no-store',
      }),
    ])

    const djData   = djRes.ok   ? await djRes.json()      : null
    const streamData = streamsRes.ok ? await streamsRes.json() : null

    const dj = djData?.djs?.[0] ?? djData?.dj ?? null
    const streams: Array<{ listenerCount?: number; tipAmountUsdc?: number; status?: string }> =
      streamData?.streams ?? []

    const totalShows     = streams.length
    const totalListeners = streams.reduce((s, st) => s + (st.listenerCount ?? 0), 0)
    const totalTipsUsdc  = streams.reduce((s, st) => s + (st.tipAmountUsdc ?? 0), 0)
    const isLive         = streams.some((st) => st.status === 'LIVE')

    return NextResponse.json({
      linked: true,
      wallet,
      dj: dj ? {
        name:       dj.name ?? dj.djName ?? null,
        slug:       dj.slug ?? null,
        avatar:     dj.avatarUrl ?? dj.avatar ?? null,
        followers:  dj.followerCount ?? dj.followers ?? 0,
        genres:     dj.genres ?? [],
      } : null,
      stats: {
        totalShows,
        totalListeners,
        totalTipsUsdc: parseFloat(totalTipsUsdc.toFixed(2)),
        isLive,
      },
    })
  } catch (err) {
    console.error('[basefm/dj-stats] fetch failed', err)
    return NextResponse.json({ linked: true, wallet, dj: null, stats: null, error: 'baseFM unreachable' })
  }
}

export const dynamic = 'force-dynamic'
