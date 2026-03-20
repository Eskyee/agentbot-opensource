export const dynamic = "force-static"
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'

function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return adminEmails.includes(email.toLowerCase())
}

export async function GET(request: NextRequest) {
  // Admin-only
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const priceIds = {
    starter: process.env.STRIPE_PRICE_ID_STARTER,
    pro: process.env.STRIPE_PRICE_ID_PRO,
    pro_plus: process.env.STRIPE_PRICE_ID_PRO_PLUS,
    scale: process.env.STRIPE_PRICE_ID_SCALE,
    white_glove: process.env.STRIPE_PRICE_ID_WHITE_GLOVE,
  }

  // Only show env var names, never values or prefixes
  const allEnvVars = Object.keys(process.env).filter(k => k.startsWith('STRIPE'))

  return NextResponse.json({
    allStripeEnvVars: allEnvVars,
    priceIds,
  })
}
