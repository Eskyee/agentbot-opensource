import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id || !session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

  try {
    const stripe = new Stripe(stripeKey, { apiVersion: '2026-02-25.clover' })

    // Subscription mode
    if (body.subscription) {
      const checkoutSession = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer_email: session.user.email,
        metadata: {
          userId: session.user.id,
          type: 'credit_subscription',
        },
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Agentbot Pro',
                description: '$10 of inference credits every month. Metered per token.',
              },
              unit_amount: 1000,
              recurring: { interval: 'month' },
            },
            quantity: 1,
          },
        ],
        success_url: `${origin}/credits?success=1&type=subscription`,
        cancel_url: `${origin}/credits?canceled=1`,
      })

      return NextResponse.json({ url: checkoutSession.url })
    }

    // One-time top-up
    const amount = Math.max(5, Math.min(10000, Math.round(body.amount || 10)))
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: session.user.email,
      metadata: {
        userId: session.user.id,
        type: 'credit_topup',
        amount: amount.toString(),
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `$${amount} Credit Top-Up`,
              description: `${amount} USD of inference credits for Agentbot`,
            },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/credits?success=1&amount=${amount}`,
      cancel_url: `${origin}/credits?canceled=1`,
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error: any) {
    console.error('[StripeCredits]', error.message)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
