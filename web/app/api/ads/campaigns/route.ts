/**
 * POST /api/ads/campaigns
 * Advertiser submits a campaign → get a Stripe checkout URL.
 * No auth required — advertisers don't need an Agentbot account.
 *
 * GET /api/ads/campaigns
 * Admin only — list all campaigns.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { stripe } from '@/app/lib/stripe'
import type Stripe from 'stripe'
import { sendAlert } from '@/app/lib/alerts'

const ADMIN_EMAILS = (
  process.env.ADMIN_EMAILS ||
  'eskyjunglelab@gmail.com,admin@agentbot.sh,rbasefm@icloud.com'
).split(',').map((e) => e.trim())

// Slot types — prices in GBP pence.
// Configure Stripe Price IDs via: AD_PRICE_SPOT, AD_PRICE_FEATURE, AD_PRICE_CAMPAIGN
const SLOT_CONFIG = {
  spot: {
    label: '30-Second Spot',
    description: '30-second audio ad — 5 scheduled broadcasts over 1 week on baseFM',
    broadcasts: 5,
    pence: 4900,
    envPriceId: 'AD_PRICE_SPOT',
  },
  feature: {
    label: '60-Second Feature',
    description: '60-second audio ad — 15 scheduled broadcasts over 2 weeks on baseFM',
    broadcasts: 15,
    pence: 11900,
    envPriceId: 'AD_PRICE_FEATURE',
  },
  campaign: {
    label: '4-Week Campaign',
    description: '60-second audio ad — 40 scheduled broadcasts over 4 weeks across baseFM and Agentbot',
    broadcasts: 40,
    pence: 29900,
    envPriceId: 'AD_PRICE_CAMPAIGN',
  },
} as const

type SlotType = keyof typeof SLOT_CONFIG

const VALID_CATEGORIES = ['ai-tech', 'dj', 'music', 'events', 'promoter', 'autonomous', 'x-creator', 'general']

function getStripePrice(slotType: SlotType): string | null {
  return process.env[SLOT_CONFIG[slotType].envPriceId] || null
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const advertiserName  = typeof body?.advertiserName  === 'string' ? body.advertiserName.trim()  : ''
  const advertiserEmail = typeof body?.advertiserEmail === 'string' ? body.advertiserEmail.trim() : ''
  const advertiserUrl   = typeof body?.advertiserUrl   === 'string' ? body.advertiserUrl.trim()   : null
  const contactHandle   = typeof body?.contactHandle   === 'string' ? body.contactHandle.trim()   : null
  const title           = typeof body?.title           === 'string' ? body.title.trim()           : ''
  const description     = typeof body?.description     === 'string' ? body.description.trim()     : null
  const category        = VALID_CATEGORIES.includes(body?.category) ? body.category : 'general'
  const slotType: SlotType =
    typeof body?.slotType === 'string' && body.slotType in SLOT_CONFIG
      ? (body.slotType as SlotType)
      : 'spot'

  if (!advertiserName)  return NextResponse.json({ error: 'Advertiser name required' }, { status: 400 })
  if (!advertiserEmail || !advertiserEmail.includes('@')) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }
  if (!title) return NextResponse.json({ error: 'Campaign title required' }, { status: 400 })

  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) return NextResponse.json({ error: 'Payments not configured' }, { status: 500 })

  // Check if the submitter is an active subscriber — 50% discount
  const authSession = await getAuthSession()
  let subscriberDiscount = false
  if (authSession?.user?.id) {
    const user = await prisma.user.findUnique({
      where:  { id: authSession.user.id },
      select: { plan: true, subscriptionStatus: true },
    })
    subscriberDiscount =
      ['solo', 'collective', 'label', 'network'].includes(user?.plan || '') &&
      ['active', 'trialing'].includes(user?.subscriptionStatus || '')
  }

  const slotCfg    = SLOT_CONFIG[slotType]
  const basePence  = slotCfg.pence
  const finalPence = subscriberDiscount ? Math.round(basePence * 0.5) : basePence
  const origin     = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

  // Create campaign record first (pending_payment state)
  const campaign = await prisma.ad_campaigns.create({
    data: {
      advertiser_name:  advertiserName,
      advertiser_email: advertiserEmail,
      advertiser_url:   advertiserUrl,
      contact_handle:   contactHandle,
      title,
      description,
      category,
      slot_type:       slotType,
      scheduled_slots: slotCfg.broadcasts,
      amount_pence:    finalPence,
      status:          'pending_payment',
    },
  })

  // Build Stripe checkout line items.
  // Subscriber discount bypasses pre-configured price IDs so we can apply the 50% amount directly.
  const priceId = subscriberDiscount ? null : getStripePrice(slotType)
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = priceId
    ? [{ price: priceId, quantity: 1 }]
    : [{
        quantity: 1,
        price_data: {
          currency: 'gbp',
          unit_amount: finalPence,
          product_data: {
            name: subscriberDiscount
              ? `baseFM Ad — ${slotCfg.label} (50% Subscriber Discount)`
              : `baseFM Ad — ${slotCfg.label}`,
            description: slotCfg.description,
          },
        },
      }]

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: advertiserEmail,
    line_items: lineItems,
    success_url: `${origin}/advertise/success?campaign=${campaign.id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${origin}/advertise?cancelled=1`,
    metadata: {
      type:          'ad_campaign',
      campaignId:    campaign.id,
      slotType,
      advertiserName,
    },
  })

  // Persist Stripe session ID
  await prisma.ad_campaigns.update({
    where: { id: campaign.id },
    data:  { stripe_session_id: session.id },
  })

  console.info(`[ads] new campaign=${campaign.id} slot=${slotType} advertiser=${advertiserEmail}`)

  // Alert admin of new ad submission
  await sendAlert({
    title: '📣 New Ad Campaign Submitted',
    message: `${advertiserName} (${advertiserEmail}) submitted a "${slotCfg.label}" campaign: "${title}"`,
    severity: 'info',
    fields: {
      Campaign: campaign.id,
      Slot:     slotCfg.label,
      Category: category,
    },
  }).catch(() => null)

  return NextResponse.json({
    campaignId:  campaign.id,
    checkoutUrl: session.url,
    slot:        { type: slotType, ...slotCfg },
  })
}

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const campaigns = await prisma.ad_campaigns.findMany({
    orderBy: { created_at: 'desc' },
    take: 200,
  })

  console.info(`[ads] admin list fetched by ${session.user.email}`)
  return NextResponse.json({ campaigns })
}
