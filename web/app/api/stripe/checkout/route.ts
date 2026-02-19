import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || ''
const STRIPE_PRICE_ID_STARTER = process.env.STRIPE_PRICE_ID_STARTER || ''
const STRIPE_PRICE_ID_PRO = process.env.STRIPE_PRICE_ID_PRO || ''
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || ''

const planToPriceId = (plan: string): string => {
  if (plan === 'starter') return STRIPE_PRICE_ID_STARTER
  if (plan === 'pro') return STRIPE_PRICE_ID_PRO
  return ''
}

export async function GET(request: NextRequest) {
  const plan = (request.nextUrl.searchParams.get('plan') || '').toLowerCase()
  const origin = APP_URL || request.nextUrl.origin

  if (plan !== 'starter' && plan !== 'pro') {
    return NextResponse.redirect(new URL('/onboard?payment_error=invalid_plan', origin), 303)
  }

  if (!STRIPE_SECRET_KEY) {
    return NextResponse.redirect(new URL(`/onboard?plan=${plan}&payment_error=stripe_not_configured`, origin), 303)
  }

  const priceId = planToPriceId(plan)
  if (!priceId) {
    return NextResponse.redirect(new URL(`/onboard?plan=${plan}&payment_error=price_not_configured`, origin), 303)
  }

  try {
    const stripe = new Stripe(STRIPE_SECRET_KEY)

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      success_url: `${origin}/onboard?plan=${plan}&paid=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/onboard?plan=${plan}&payment_cancelled=1`,
      metadata: {
        plan,
        source: 'startclaw-web',
      },
    })

    if (!session.url) {
      return NextResponse.redirect(new URL(`/onboard?plan=${plan}&payment_error=no_checkout_url`, origin), 303)
    }

    return NextResponse.redirect(session.url, 303)
  } catch {
    return NextResponse.redirect(new URL(`/onboard?plan=${plan}&payment_error=checkout_failed`, origin), 303)
  }
}
