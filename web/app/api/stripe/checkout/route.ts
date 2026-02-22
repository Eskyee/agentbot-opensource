import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function GET(request: NextRequest) {
  const plan = (request.nextUrl.searchParams.get('plan') || '').toLowerCase()
  const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
  
  const validPlans = ['trial', 'starter', 'pro', 'pro_plus', 'scale', 'white_glove']
  if (!validPlans.includes(plan)) {
    return NextResponse.redirect(new URL(`/onboard?plan=${plan}&payment_error=invalid_plan`, origin), 303)
  }

  const priceIds: Record<string, string> = {
    trial: process.env.STRIPE_PRICE_ID_TRIAL || process.env.STRIPE_PRICE_ID_STARTER || '',
    starter: process.env.STRIPE_PRICE_ID_STARTER || '',
    pro: process.env.STRIPE_PRICE_ID_PRO || '',
    pro_plus: process.env.STRIPE_PRICE_ID_PRO_PLUS || '',
    scale: process.env.STRIPE_PRICE_ID_SCALE || '',
    white_glove: process.env.STRIPE_PRICE_ID_WHITE_GLOVE || '',
  }

  const priceId = priceIds[plan]
  const stripeKey = process.env.STRIPE_SECRET_KEY

  if (!stripeKey) {
    return NextResponse.redirect(new URL(`/onboard?plan=${plan}&payment_error=stripe_not_configured`, origin), 303)
  }

  if (!priceId) {
    return NextResponse.redirect(new URL(`/onboard?plan=${plan}&payment_error=price_not_configured`, origin), 303)
  }

  try {
    const stripe = new Stripe(stripeKey)
    
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
        source: 'agentbot-web',
      },
    })

    if (!session.url) {
      return NextResponse.redirect(new URL(`/onboard?plan=${plan}&payment_error=no_checkout_url`, origin), 303)
    }

    return NextResponse.redirect(session.url, 303)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Stripe checkout error:', errorMessage)
    return NextResponse.redirect(new URL(`/onboard?plan=${plan}&payment_error=checkout_failed`, origin), 303)
  }
}
