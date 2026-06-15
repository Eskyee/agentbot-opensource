import Stripe from 'stripe'

type PlanPrice = {
  amount: number
  currency: string
  formatted: string
}

export type PublicPricing = {
  starter: PlanPrice
  pro: PlanPrice
}

const FALLBACK_CURRENCY = 'gbp'
const FALLBACK_PRICES = {
  starter: 29,
  pro: 49,
  dfy: 1200,
}

const formatMoney = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(amount)
}

const fallbackPricing = (): PublicPricing & { dfy?: PlanPrice } => ({
  starter: {
    amount: FALLBACK_PRICES.starter,
    currency: FALLBACK_CURRENCY,
    formatted: formatMoney(FALLBACK_PRICES.starter, FALLBACK_CURRENCY),
  },
  pro: {
    amount: FALLBACK_PRICES.pro,
    currency: FALLBACK_CURRENCY,
    formatted: formatMoney(FALLBACK_PRICES.pro, FALLBACK_CURRENCY),
  },
  dfy: {
    amount: FALLBACK_PRICES.dfy,
    currency: FALLBACK_CURRENCY,
    formatted: formatMoney(FALLBACK_PRICES.dfy, FALLBACK_CURRENCY),
  },
})

const toPlanPrice = (price: Stripe.Price): PlanPrice | null => {
  if (!price.active || !price.recurring || price.unit_amount === null) {
    return null
  }

  const amount = price.unit_amount / 100
  const currency = price.currency

  return {
    amount,
    currency,
    formatted: formatMoney(amount, currency),
  }
}

export async function getPublicPricing(): Promise<PublicPricing & { dfy?: PlanPrice }> {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY || ''
  const starterPriceId = process.env.STRIPE_PRICE_ID_STARTER || ''
  const proPriceId = process.env.STRIPE_PRICE_ID_PRO || ''
  const dfyPriceId = process.env.STRIPE_PRICE_ID_DFY || ''

  if (!stripeSecretKey || !starterPriceId || !proPriceId || !dfyPriceId) {
    return fallbackPricing()
  }

  try {
    const stripe = new Stripe(stripeSecretKey)
    const [starterRaw, proRaw, dfyRaw] = await Promise.all([
      stripe.prices.retrieve(starterPriceId),
      stripe.prices.retrieve(proPriceId),
      stripe.prices.retrieve(dfyPriceId),
    ])

    const starter = toPlanPrice(starterRaw)
    const pro = toPlanPrice(proRaw)
    const dfy = toPlanPrice(dfyRaw)

    if (!starter || !pro || !dfy) {
      return fallbackPricing()
    }

    return { starter, pro, dfy }
  } catch {
    return fallbackPricing()
  }
}
