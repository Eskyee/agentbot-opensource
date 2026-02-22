import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function GET(request: NextRequest) {
  const priceIds = {
    trial: process.env.STRIPE_PRICE_ID_TRIAL,
    starter: process.env.STRIPE_PRICE_ID_STARTER,
    pro: process.env.STRIPE_PRICE_ID_PRO,
    pro_plus: process.env.STRIPE_PRICE_ID_PRO_PLUS,
    scale: process.env.STRIPE_PRICE_ID_SCALE,
    white_glove: process.env.STRIPE_PRICE_ID_WHITE_GLOVE,
  }

  const allEnvVars = Object.keys(process.env).filter(k => k.startsWith('STRIPE'))

  return NextResponse.json({
    allStripeEnvVars: allEnvVars,
    priceIds,
  })
}
