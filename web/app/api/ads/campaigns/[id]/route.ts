/**
 * PATCH /api/ads/campaigns/[id]
 * Admin: approve, reject, or update an ad campaign.
 * Also handles Mux upload URL generation once a campaign is paid.
 *
 * POST /api/ads/campaigns/[id]/upload
 * (handled via PATCH with action=request_upload)
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { sendAlert } from '@/app/lib/alerts'

const ADMIN_EMAILS = (
  process.env.ADMIN_EMAILS ||
  'eskyjunglelab@gmail.com,admin@agentbot.sh,rbasefm@icloud.com'
).split(',').map((e) => e.trim())

function getMuxAuth() {
  const id  = process.env.MUX_TOKEN_ID
  const sec = process.env.MUX_TOKEN_SECRET
  if (!id || !sec) return null
  return `Basic ${Buffer.from(`${id}:${sec}`).toString('base64')}`
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession()
  const { id }  = await params

  const body   = await request.json().catch(() => ({}))
  const action = typeof body?.action === 'string' ? body.action : ''

  // request_upload — advertisers call this after payment to get their Mux upload URL
  if (action === 'request_upload') {
    const campaign = await prisma.ad_campaigns.findUnique({ where: { id } })
    if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (!['paid', 'approved'].includes(campaign.status)) {
      return NextResponse.json({ error: 'Payment required before uploading' }, { status: 402 })
    }
    if (campaign.mux_upload_id) {
      return NextResponse.json({ error: 'Upload already created' }, { status: 409 })
    }

    const muxAuth = getMuxAuth()
    if (!muxAuth) return NextResponse.json({ error: 'Mux not configured' }, { status: 500 })

    const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const muxRes = await fetch('https://api.mux.com/video/v1/uploads', {
      method:  'POST',
      headers: { Authorization: muxAuth, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cors_origin: origin,
        new_asset_settings: {
          playback_policy: ['public'],
          mp4_support:     'standard',
          metadata: {
            campaign_id:     id,
            campaign_title:  campaign.title,
            advertiser:      campaign.advertiser_name,
          },
        },
        timeout: 3600,
      }),
    })

    if (!muxRes.ok) {
      const err = await muxRes.text()
      console.error('[ads] Mux upload create error:', err)
      return NextResponse.json({ error: 'Failed to create upload' }, { status: 502 })
    }

    const muxData = await muxRes.json()
    const upload  = muxData?.data
    if (!upload?.id || !upload?.url) {
      return NextResponse.json({ error: 'Unexpected Mux response' }, { status: 502 })
    }

    await prisma.ad_campaigns.update({
      where: { id },
      data:  { mux_upload_id: upload.id },
    })

    return NextResponse.json({ uploadUrl: upload.url, uploadId: upload.id })
  }

  // Admin-only actions below
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const campaign = await prisma.ad_campaigns.findUnique({ where: { id } })
  if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (action === 'approve') {
    const startsAt = body?.startsAt ? new Date(body.startsAt) : new Date(Date.now() + 24 * 60 * 60 * 1000)
    const slotDays = campaign.slot_type === 'spot' ? 7 : campaign.slot_type === 'feature' ? 14 : 28
    const endsAt   = new Date(startsAt.getTime() + slotDays * 86_400_000)

    await prisma.ad_campaigns.update({
      where: { id },
      data:  {
        status:      'approved',
        starts_at:   startsAt,
        ends_at:     endsAt,
        admin_notes: typeof body?.notes === 'string' ? body.notes : campaign.admin_notes,
      },
    })

    console.info(`[ads] approved campaign=${id} by ${session.user.email}`)

    await sendAlert({
      title:    '✅ Ad Campaign Approved',
      message:  `"${campaign.title}" by ${campaign.advertiser_name} approved. Starts: ${startsAt.toISOString()}`,
      severity: 'info',
      fields:   { Campaign: id, Advertiser: campaign.advertiser_email },
    }).catch(() => null)

    return NextResponse.json({ success: true, status: 'approved', startsAt, endsAt })
  }

  if (action === 'reject') {
    await prisma.ad_campaigns.update({
      where: { id },
      data:  {
        status:      'rejected',
        admin_notes: typeof body?.notes === 'string' ? body.notes : campaign.admin_notes,
      },
    })
    console.info(`[ads] rejected campaign=${id} by ${session.user.email}`)
    return NextResponse.json({ success: true, status: 'rejected' })
  }

  if (action === 'complete') {
    await prisma.ad_campaigns.update({
      where: { id },
      data:  { status: 'complete', ends_at: new Date() },
    })
    return NextResponse.json({ success: true, status: 'complete' })
  }

  return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
}
