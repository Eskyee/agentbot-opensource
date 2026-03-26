import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id')

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  try {
    const stripe = new Stripe(stripeKey)
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    })

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 402 })
    }

    const subscription = session.subscription as Stripe.Subscription | null
    const plan = session.metadata?.plan || 'solo'

    // Get next billing date from subscription items
    let nextBilling: string | null = null
    if (subscription) {
      const sub = subscription as unknown as Record<string, unknown>
      // Stripe API versions vary — check common field names
      const endTs = (sub.current_period_end ?? sub.billing_cycle_anchor) as number | undefined
      if (endTs) {
        nextBilling = new Date(endTs * 1000).toISOString()
      }
    }

    return NextResponse.json({
      plan,
      status: 'active',
      nextBilling,
      customerId: session.customer,
    })
  } catch (error) {
    console.error('[Checkout Verify] Error:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
