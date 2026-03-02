import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const PLAN_PRICES: Record<string, { amount: number; name: string; description: string }> = {
  starter: { amount: 1900, name: 'Starter Plan', description: '1 AI Agent, 10GB storage, Telegram channel' },
  pro: { amount: 3900, name: 'Pro Plan', description: '1 AI Agent, 50GB storage, Telegram + WhatsApp, Custom domain, + usage' },
  scale: { amount: 7900, name: 'Scale Plan', description: '3 AI Agents, 100GB storage, All channels, Advanced analytics' },
  enterprise: { amount: 14900, name: 'Enterprise Plan', description: 'Unlimited agents, 500GB storage, White-label, 24/7 support' },
  white_glove: { amount: 19900, name: 'White Glove Plan', description: 'Premium - Everything in Enterprise, 10x resources, Dedicated account manager' },
}

export async function GET(request: NextRequest) {
  const plan = (request.nextUrl.searchParams.get('plan') || '').toLowerCase()
  const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
  
  const validPlans = ['starter', 'pro', 'scale', 'enterprise', 'white_glove']
  if (!validPlans.includes(plan)) {
    return NextResponse.redirect(new URL(`/pricing?error=invalid_plan`, origin), 303)
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY

  if (!stripeKey) {
    console.error('Stripe secret key not configured')
    return NextResponse.redirect(new URL(`/pricing?error=stripe_not_configured`, origin), 303)
  }

  try {
    const stripe = new Stripe(stripeKey)
    
    const planInfo = PLAN_PRICES[plan]
    
    // Always create/find fresh active price - ignore env vars to avoid stale price IDs
    let priceId: string | undefined
    
    // If no env price ID, try to find existing active price or create new
    if (!priceId) {
      // fetch all active GBP prices via pagination
      let allPrices: Stripe.Price[] = []
      let lastId: string | undefined
      do {
        const resp = await stripe.prices.list({
          active: true,
          currency: 'gbp',
          limit: 100,
          starting_after: lastId,
        })
        allPrices = allPrices.concat(resp.data)
        lastId = resp.has_more ? resp.data[resp.data.length - 1].id : undefined
      } while (lastId)

      const foundPrice = allPrices.find(p =>
        p.recurring?.interval === 'month' &&
        p.unit_amount === planInfo.amount &&
        p.active === true
      )

      if (foundPrice) {
        priceId = foundPrice.id
      } else {
        // Create new price with active product
        // look up product via pagination as well
        let productId: string | undefined
        let lastProductId: string | undefined
        do {
          const resp = await stripe.products.list({
            active: true,
            limit: 100,
            starting_after: lastProductId,
          })
          const match = resp.data.find(p => p.name === planInfo.name && p.active)
          if (match) {
            productId = match.id
            break
          }
          lastProductId = resp.has_more ? resp.data[resp.data.length - 1].id : undefined
        } while (!productId && lastProductId)

        if (!productId) {
          // deterministic idempotency key for product creation derived from name
          const normalized = planInfo.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')
          const productKey = `product_${normalized}`
          const newProduct = await stripe.products.create(
            {
              name: planInfo.name,
              active: true,
            },
            { idempotencyKey: productKey }
          )
          productId = newProduct.id
        }

        // deterministic idempotency key for price creation
        const priceKey = `price_gbp_${planInfo.amount}_month`
        const newPrice = await stripe.prices.create(
          {
            unit_amount: planInfo.amount,
            currency: 'gbp',
            recurring: { interval: 'month' },
            product: productId,
            active: true,
          },
          { idempotencyKey: priceKey }
        )
        priceId = newPrice.id
      }
    }
    
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      success_url: `${origin}/onboard?plan=${plan}&paid=1&session_id={CHECKOUT_SESSION_ID}`,
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
