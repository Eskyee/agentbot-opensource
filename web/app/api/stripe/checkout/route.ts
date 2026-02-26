import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const PLAN_PRICES: Record<string, { amount: number; name: string; description: string }> = {
  starter: { amount: 1900, name: 'Starter Plan', description: '1 AI Agent, 10GB storage, Telegram channel' },
  pro: { amount: 3900, name: 'Pro Plan', description: '1 AI Agent, 50GB storage, Telegram + WhatsApp, Custom domain' },
  scale: { amount: 7900, name: 'Scale Plan', description: '3 AI Agents, 100GB storage, All channels, Advanced analytics' },
  enterprise: { amount: 14900, name: 'Enterprise Plan', description: 'Unlimited agents, 500GB storage, White-label, 24/7 support' },
}

export async function GET(request: NextRequest) {
  const plan = (request.nextUrl.searchParams.get('plan') || '').toLowerCase()
  const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
  
  const validPlans = ['starter', 'pro', 'scale', 'enterprise']
  if (!validPlans.includes(plan)) {
    return NextResponse.redirect(new URL(`/onboard?plan=${plan}&payment_error=invalid_plan`, origin), 303)
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY

  if (!stripeKey) {
    return NextResponse.redirect(new URL(`/onboard?plan=${plan}&payment_error=stripe_not_configured`, origin), 303)
  }

  try {
    const stripe = new Stripe(stripeKey)
    
    const planInfo = PLAN_PRICES[plan]
    let priceId = process.env[`STRIPE_PRICE_ID_${plan.toUpperCase()}`]
    
    if (!priceId) {
      const price = await stripe.prices.create({
        unit_amount: planInfo.amount,
        currency: 'gbp',
        recurring: { interval: 'month' },
        product_data: {
          name: planInfo.name,
        },
      })
      priceId = price.id
    }
    
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
