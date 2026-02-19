import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || ''
const STRIPE_PRICE_ID_STARTER = process.env.STRIPE_PRICE_ID_STARTER || ''
const STRIPE_PRICE_ID_PRO = process.env.STRIPE_PRICE_ID_PRO || ''
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || ''
const STRIPE_KEY_IS_LIVE = STRIPE_SECRET_KEY.startsWith('sk_live_')

const checkoutErrorRedirect = (origin: string, plan: string, code: string) => {
  return NextResponse.redirect(new URL(`/onboard?plan=${plan}&payment_error=${code}`, origin), 303)
}

const mapStripeCheckoutError = (error: unknown): string => {
  if (!error || typeof error !== 'object') return 'checkout_failed'

  const stripeError = error as {
    type?: string
    code?: string
    message?: string
    raw?: {
      type?: string
      code?: string
      message?: string
    }
  }

  const message = (stripeError.message || stripeError.raw?.message || '').toLowerCase()
  const code = (stripeError.code || stripeError.raw?.code || '').toLowerCase()
  const type = (stripeError.type || stripeError.raw?.type || '').toLowerCase()

  if (code === 'resource_missing' || message.includes('no such price')) return 'price_not_found'
  if (
    message.includes('live mode') ||
    message.includes('test mode') ||
    message.includes('livemode') ||
    message.includes('testmode')
  ) {
    return 'price_mode_mismatch'
  }
  if (
    message.includes('cannot be used with subscriptions') ||
    message.includes('must be a recurring price') ||
    message.includes('recurring')
  ) {
    return 'price_not_recurring'
  }
  if (type === 'authentication_error' || code === 'api_key_expired') return 'stripe_auth_failed'
  if (type === 'api_error' || type === 'rate_limit_error') return 'stripe_temporarily_unavailable'

  const fallback = String(error).toLowerCase()
  if (fallback.includes('no such price')) return 'price_not_found'
  if (fallback.includes('recurring')) return 'price_not_recurring'
  if (fallback.includes('live mode') || fallback.includes('test mode')) return 'price_mode_mismatch'

  return 'checkout_failed'
}

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
    return checkoutErrorRedirect(origin, plan, 'price_not_configured')
  }

  try {
    const stripe = new Stripe(STRIPE_SECRET_KEY)
    const price = await stripe.prices.retrieve(priceId)

    if (!price || ('deleted' in price && price.deleted)) {
      return checkoutErrorRedirect(origin, plan, 'price_not_found')
    }

    if (!price.active) {
      return checkoutErrorRedirect(origin, plan, 'price_inactive')
    }

    if (!price.recurring) {
      return checkoutErrorRedirect(origin, plan, 'price_not_recurring')
    }

    if (price.livemode !== STRIPE_KEY_IS_LIVE) {
      return checkoutErrorRedirect(origin, plan, 'price_mode_mismatch')
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
        source: 'startclaw-web',
      },
    })

    if (!session.url) {
      return NextResponse.redirect(new URL(`/onboard?plan=${plan}&payment_error=no_checkout_url`, origin), 303)
    }

    return NextResponse.redirect(session.url, 303)
  } catch (error) {
    const code = mapStripeCheckoutError(error)
    console.error('stripe_checkout_failed', {
      plan,
      priceId,
      errorCode: (error as { code?: string })?.code,
      errorType: (error as { type?: string })?.type,
      errorMessage: (error as { message?: string })?.message,
      rawErrorCode: (error as { raw?: { code?: string } })?.raw?.code,
      rawErrorType: (error as { raw?: { type?: string } })?.raw?.type,
      rawErrorMessage: (error as { raw?: { message?: string } })?.raw?.message,
    })

    return checkoutErrorRedirect(origin, plan, code)
  }
}
