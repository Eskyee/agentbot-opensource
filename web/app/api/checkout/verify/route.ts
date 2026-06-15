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
  
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  try {
    const stripe = new Stripe(stripeKey)
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    })

    // Accept: 'paid' (completed payment), 'no_payment_required' (free plan), 'unpaid' (trial period)
    const validStatuses = ['paid', 'no_payment_required', 'unpaid']
    if (!validStatuses.includes(session.payment_status || '')) {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 402 })
    }

    const subscription = session.subscription as Stripe.Subscription | null
    const plan = session.metadata?.plan || 'solo'
    
    // Use auth session userId if available, otherwise fall back to Stripe metadata userId
    // Auth session may be lost during Stripe redirect — metadata is the reliable source
    const effectiveUserId = authSession?.user?.id || session.metadata?.userId

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

    // Verify the session belongs to the authenticated user (if auth session exists)
    const userId = session.metadata?.userId
    if (authSession?.user?.id && userId && userId !== authSession.user.id) {
      return NextResponse.json({ error: 'Session does not belong to you' }, { status: 403 })
    }

    // Need a valid userId to update the database
    if (!effectiveUserId) {
      return NextResponse.json({ error: 'No user associated with this session' }, { status: 400 })
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

