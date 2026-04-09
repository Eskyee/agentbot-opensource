// Debug Stripe endpoint — DISABLED in production
// This route previously listed Stripe env vars and price IDs.
// Removed for security. Use Render/Vercel dashboard for config verification.

import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    { error: 'Debug endpoint disabled' },
    { status: 404 }
  )
}
