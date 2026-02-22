import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }
  
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
