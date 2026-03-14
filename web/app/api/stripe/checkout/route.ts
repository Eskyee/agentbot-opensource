import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'

const PLAN_PRICES: Record<string, { amount: number; name: string; description: string; priceId?: string }> = {
  underground: { amount: 1900, name: 'Starter Plan', description: '1 Agent, A2A Bus Access, Basic Analytics', priceId: 'price_1T59bkDiHU0UF7aWOYKaifpc' },
  collective: { amount: 6900, name: 'Collective', description: '3 Agents, Llama 3.3, Royalty Split Engine', priceId: 'price_1TAqc0DiHU0UF7aWEYTqA7k0' },
  label: { amount: 14900, name: 'Enterprise Plan', description: 'Unlimited Agents, DeepSeek R1, Priority A2A', priceId: 'price_1T5A68DiHU0UF7aWx9gKqQLq' },
}

// Known Stripe product IDs for our 3 active plans
const PRODUCT_IDS: Record<string, string> = {
  underground: 'prod_U9B91PN8c9puXP',
  collective: 'prod_U98tpiNSfUlIlP',
  label: 'prod_U9CBhMyxK2fr2z',
}

export async function GET(request: NextRequest) {
  const plan = (request.nextUrl.searchParams.get('plan') || '').toLowerCase()
  const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

  const validPlans = ['underground', 'collective', 'label']
  if (!validPlans.includes(plan)) {
    return NextResponse.redirect(new URL(`/pricing?error=invalid_plan`, origin), 303)
  }

  const session = await getServerSession(authOptions)
  const userId = session?.user?.id || ''

  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    console.error('Stripe secret key not configured')
    return NextResponse.redirect(new URL(`/pricing?error=stripe_not_configured`, origin), 303)
  }

  try {
    const stripe = new Stripe(stripeKey)
    const planInfo = PLAN_PRICES[plan]
    const productId = PRODUCT_IDS[plan]

    // Find existing active recurring monthly GBP price for this specific product
    const pricesResp = await stripe.prices.list({
      product: productId,
      active: true,
      currency: 'gbp',
      limit: 20,
    })

    let priceId: string | undefined = pricesResp.data.find(
      (p) => p.recurring?.interval === 'month' && p.unit_amount === planInfo.amount
    )?.id

    // If no recurring monthly price exists, create one for this product
    if (!priceId) {
      const normalized = plan.replace(/[^a-z0-9]+/g, '_')
      const newPrice = await stripe.prices.create(
        {
          unit_amount: planInfo.amount,
          currency: 'gbp',
          recurring: { interval: 'month' },
          product: productId,
          active: true,
        },
        { idempotencyKey: `price_${normalized}_gbp_month_v2` }
      )
      priceId = newPrice.id
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${origin}/onboard?plan=${plan}&paid=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?cancelled=1`,
      metadata: { plan, source: 'agentbot-web', userId },
    })

    if (!checkoutSession.url) {
      return NextResponse.redirect(new URL(`/pricing?error=no_checkout_url`, origin), 303)
    }

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Stripe checkout error:', errorMessage, { plan })
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
