export const dynamic = "force-static"
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// One-time endpoint to archive old Stripe products
// GET /api/admin/archive-old-products?secret=YOUR_NEXTAUTH_SECRET
const OLD_PRODUCT_IDS = [
  'prod_U3Gdww8XSjeqdg', // Enterprise Plan
  'prod_U3GE6JFRWQPhB2', // Pro Plan
  'prod_U3G8YgmflMAlGr', // Starter Plan
  'prod_U3FjKT5K7J3i9O', // White Glove Plan
  'prod_U3Fh9KSx8UzKs1', // Enterprise Plan (duplicate)
  'prod_U0Spg1EIGmFDYt', // Scale
]

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  const adminSecret = process.env.ADMIN_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret || secret !== adminSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })

  const stripe = new Stripe(stripeKey)
  const results: Record<string, string> = {}

  for (const productId of OLD_PRODUCT_IDS) {
    try {
      await stripe.products.update(productId, { active: false })
      results[productId] = 'archived'
    } catch (err) {
      results[productId] = `error: ${err instanceof Error ? err.message : String(err)}`
    }
  }

  return NextResponse.json({ results })
}
