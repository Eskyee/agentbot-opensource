import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/app/lib/prisma'

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

    // Belt-and-suspenders: mark subscription active immediately so provision
    // doesn't race against the Stripe webhook arriving a few seconds later.
    // The webhook will also fire and set the same values — idempotent.
    const userId = session.metadata?.userId
    if (userId) {
      prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: 'active',
          plan,
          stripeCustomerId: (session.customer as string) || undefined,
        },
      }).catch((err: unknown) => {
        console.error('[Checkout Verify] Failed to update user subscription:', err)
      })
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
