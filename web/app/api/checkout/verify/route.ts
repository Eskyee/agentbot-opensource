import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/app/lib/prisma'
import { getAuthSession } from '@/app/lib/getAuthSession'

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id')

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
  }

  // Require authentication — prevent unauthorized subscription modifications
  const authSession = await getAuthSession()
  if (!authSession?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    const effectiveUserId = session.metadata?.userId || authSession.user.id

    // Get next billing date from subscription items
    let nextBilling: string | null = null
    let subscriptionStatus = 'active'
    if (subscription) {
      const sub = subscription as unknown as Record<string, unknown>
      // Stripe API versions vary — check common field names
      const endTs = (sub.current_period_end ?? sub.billing_cycle_anchor) as number | undefined
      if (endTs) {
        nextBilling = new Date(endTs * 1000).toISOString()
      }
      const stripeStatus = typeof sub.status === 'string' ? sub.status : ''
      if (stripeStatus === 'trialing' || stripeStatus === 'active') {
        subscriptionStatus = 'active'
      }
    }

    // Verify the session belongs to the authenticated user
    const userId = session.metadata?.userId
    if (userId && userId !== authSession.user.id) {
      return NextResponse.json({ error: 'Session does not belong to you' }, { status: 403 })
    }

    await prisma.user.update({
      where: { id: effectiveUserId },
      data: {
        subscriptionStatus,
        plan,
        stripeCustomerId: (session.customer as string) || undefined,
        stripeSubscriptionId: subscription?.id || undefined,
        subscriptionStartDate: new Date(),
      },
    })

    return NextResponse.json({
      plan,
      status: subscriptionStatus,
      nextBilling,
      customerId: session.customer,
      subscriptionId: subscription?.id || null,
    })
  } catch (error) {
    console.error('[Checkout Verify] Error:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
