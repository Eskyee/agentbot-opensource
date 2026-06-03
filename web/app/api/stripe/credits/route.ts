import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import Stripe from 'stripe'

const CREDIT_PACKS: Record<string, { amount: number; credits: number; name: string }> = {
  starter: { amount: 500, credits: 1000, name: 'Starter Pack' },
  growth: { amount: 2000, credits: 5000, name: 'Growth Pack' },
  scale: { amount: 5000, credits: 15000, name: 'Scale Pack' },
  enterprise: { amount: 15000, credits: 50000, name: 'Enterprise Pack' },
}

export async function POST(request: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id || !session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const packId = (body.packId || '').toLowerCase()
  const pack = CREDIT_PACKS[packId]

  if (!pack) {
    return NextResponse.json({ error: 'Invalid credit pack' }, { status: 400 })
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

  try {
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' })

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: session.user.email,
      metadata: {
        userId: session.user.id,
        type: 'credit_pack',
        packId,
        credits: pack.credits.toString(),
      },
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: pack.name,
              description: `${pack.credits.toLocaleString()} credits for Agentbot`,
            },
            unit_amount: pack.amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/credits?success=1&credits=${pack.credits}`,
      cancel_url: `${origin}/credits?canceled=1`,
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error: any) {
    console.error('[StripeCredits]', error.message)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
