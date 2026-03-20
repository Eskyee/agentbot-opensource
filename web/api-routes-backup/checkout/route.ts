export const dynamic = "force-static"
import { NextResponse } from 'next/server'

// This legacy endpoint is deprecated — use /api/stripe/checkout instead.
// Kept as a stub to avoid 404s on any old bookmarks/integrations.
export async function POST() {
  return NextResponse.json(
    { error: 'This endpoint is deprecated. Use GET /api/stripe/checkout?plan=<underground|collective|label>' },
    { status: 410 }
  )
}

export async function GET() {
  return NextResponse.redirect('/api/stripe/checkout', 308)
}
