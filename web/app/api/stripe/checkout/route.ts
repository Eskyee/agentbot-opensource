import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const PLAN_PRICE_IDS: Record<string, string | undefined> = {
  starter: process.env.STRIPE_PRICE_STARTER,
  pro: process.env.STRIPE_PRICE_PRO,
  scale: process.env.STRIPE_PRICE_SCALE,
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
  white_glove: process.env.STRIPE_PRICE_WHITEGLOVE,
}

const PLAN_INFO: Record<string, { name: string; description: string }> = {
  starter: { name: 'Starter Plan', description: '1 AI Agent, 10GB storage, Telegram channel' },
  pro: { name: 'Pro Plan', description: '1 AI Agent, 50GB storage, Telegram + WhatsApp, Custom domain' },
  scale: { name: 'Scale Plan', description: '3 AI Agents, 100GB storage, All channels' },
  enterprise: { name: 'Enterprise Plan', description: 'Unlimited agents, 500GB storage, White-label' },
  white_glove: { name: 'White Glove Plan', description: 'Everything + Dedicated manager, 10x resources' },
}

export async function GET(request: NextRequest) {
  const plan = (request.nextUrl.searchParams.get('plan') || '').toLowerCase()
  const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
  
  const validPlans = ['starter', 'pro', 'scale', 'enterprise', 'white_glove']
  if (!validPlans.includes(plan)) {
    return NextResponse.redirect(new URL(`/pricing?error=invalid_plan`, origin), 303)
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY
  const priceId = PLAN_PRICE_IDS[plan]

  if (!stripeKey) {
    console.error('Stripe secret key not configured')
    return NextResponse.redirect(new URL(`/pricing?error=stripe_not_configured`, origin), 303)
  }

  if (!priceId) {
    console.error(`Stripe price ID not configured for plan: ${plan}`)
    return NextResponse.redirect(new URL(`/pricing?error=price_not_configured`, origin), 303)
  }

  try {
    const stripe = new Stripe(stripeKey)
    
    const planInfo = PLAN_INFO[plan]
    
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      success_url: `${origin}/checkout/success?plan=${plan}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?cancelled=1`,
      metadata: {
        plan,
        source: 'agentbot-web',
      },
    })

    if (!checkoutSession.url) {
      return NextResponse.redirect(new URL(`/pricing?error=no_checkout_url`, origin), 303)
    }

    return NextResponse.redirect(checkoutSession.url, 303)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Stripe checkout error:', errorMessage, { plan })
    return NextResponse.redirect(new URL(`/pricing?error=${encodeURIComponent(errorMessage)}`, origin), 303)
  }
}
