import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

const MIXTAPE_PLANS = ['collective', 'label', 'network']
const MIXTAPE_UPLOAD_COST_ENV = 'BASEFM_MIXTAPE_CREDIT_COST' // optional env for future credit billing

function getMuxAuth() {
  const tokenId = process.env.MUX_TOKEN_ID
  const tokenSecret = process.env.MUX_TOKEN_SECRET
  if (!tokenId || !tokenSecret) return null
  return `Basic ${Buffer.from(`${tokenId}:${tokenSecret}`).toString('base64')}`
}

/**
 * POST /api/basefm/mixtapes
 * Creates a Mux direct upload URL for a DJ mix set.
 * Requires collective+ plan or active subscription.
 */
export async function POST(request: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const muxAuth = getMuxAuth()
  if (!muxAuth) {
    return NextResponse.json({ error: 'Mux not configured' }, { status: 500 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, subscriptionStatus: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const hasAccess =
    MIXTAPE_PLANS.includes(user.plan || '') &&
    (user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing')

  if (!hasAccess) {
    return NextResponse.json(
      {
        error: 'Mix uploads require a Collective plan or higher. Upgrade your plan to unlock this feature.',
        requiredPlans: MIXTAPE_PLANS,
      },
      { status: 403 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  const artistName = typeof body?.artistName === 'string' ? body.artistName.trim() : null
  const scheduledAt =
    typeof body?.scheduledAt === 'string' && body.scheduledAt
      ? new Date(body.scheduledAt)
      : null

  if (!title) {
    return NextResponse.json({ error: 'Mix title is required' }, { status: 400 })
  }

  const origin = request.headers.get('origin') || 'https://agentbot.sh'

  // Create Mux direct upload — client uploads the audio file directly to the returned URL
  const muxRes = await fetch('https://api.mux.com/video/v1/uploads', {
    method: 'POST',
    headers: {
      Authorization: muxAuth,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cors_origin: origin,
      new_asset_settings: {
        playback_policy: ['public'],
        mp4_support: 'standard',
        metadata: {
          mixtape_title: title,
          artist_name: artistName || 'Unknown Artist',
          user_id: session.user.id,
        },
      },
      timeout: 3600, // 1 hour upload window
    }),
  })

  if (!muxRes.ok) {
    const err = await muxRes.text()
    console.error('Mux upload create error:', err)
    return NextResponse.json({ error: 'Failed to create upload — try again' }, { status: 502 })
  }

  const muxData = await muxRes.json()
  const upload = muxData?.data
  if (!upload?.id || !upload?.url) {
    return NextResponse.json({ error: 'Unexpected Mux response' }, { status: 502 })
  }

  const mixtape = await prisma.mixtapes.create({
    data: {
      user_id: session.user.id,
      title,
      artist_name: artistName,
      mux_upload_id: upload.id,
      status: 'pending',
      scheduled_at: scheduledAt,
    },
  })

  // Log cost if env is configured (future billing hook)
  const creditCost = process.env[MIXTAPE_UPLOAD_COST_ENV]
  if (creditCost) {
    console.info(`[mixtapes] user=${session.user.id} mixtape=${mixtape.id} cost=${creditCost} credits`)
  }

  return NextResponse.json({
    success: true,
    mixtape: {
      id: mixtape.id,
      title: mixtape.title,
      artistName: mixtape.artist_name,
      status: mixtape.status,
      scheduledAt: mixtape.scheduled_at?.toISOString() || null,
    },
    upload: {
      id: upload.id,
      url: upload.url, // client PUTs audio file directly to this URL
      timeout: upload.timeout,
    },
  })
}

/**
 * GET /api/basefm/mixtapes
 * List the current user's mixtapes.
 */
export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const mixtapes = await prisma.mixtapes.findMany({
    where: { user_id: session.user.id },
    orderBy: { created_at: 'desc' },
    take: 50,
    select: {
      id: true,
      title: true,
      artist_name: true,
      status: true,
      playback_id: true,
      scheduled_at: true,
      broadcast_at: true,
      ended_at: true,
      duration_secs: true,
      created_at: true,
    },
  })

  return NextResponse.json({ mixtapes })
}

/**
 * PATCH /api/basefm/mixtapes
 * Update a mixtape record (e.g. when Mux webhook delivers the asset ID).
 * Internal use — called by the Mux webhook handler.
 */
export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const uploadId = typeof body?.uploadId === 'string' ? body.uploadId : null
  const assetId = typeof body?.assetId === 'string' ? body.assetId : null
  const playbackId = typeof body?.playbackId === 'string' ? body.playbackId : null
  const status = typeof body?.status === 'string' ? body.status : null

  if (!uploadId) {
    return NextResponse.json({ error: 'uploadId required' }, { status: 400 })
  }

  await prisma.mixtapes.updateMany({
    where: { mux_upload_id: uploadId },
    data: {
      ...(assetId ? { mux_asset_id: assetId } : {}),
      ...(playbackId ? { playback_id: playbackId } : {}),
      ...(status ? { status } : {}),
    },
  })

  return NextResponse.json({ success: true })
}
