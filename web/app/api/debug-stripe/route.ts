import { NextRequest, NextResponse } from 'next/server'

const DEBUG_SECRET = process.env.DEBUG_SECRET

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!DEBUG_SECRET || authHeader !== `Bearer ${DEBUG_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
