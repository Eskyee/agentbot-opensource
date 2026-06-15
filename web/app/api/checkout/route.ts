import { NextRequest, NextResponse } from 'next/server'

// This legacy endpoint is deprecated — use /api/stripe/checkout instead.
// Kept as a stub to avoid 404s on any old bookmarks/integrations.
export async function POST() {
  return NextResponse.json(
    { error: 'This endpoint is deprecated. Use GET /api/stripe/checkout?plan=<solo|collective|label|network>' },
    { status: 410 }
  )
}

export async function GET(request: NextRequest) {
  const search = request.nextUrl.search || ''
  const origin = request.nextUrl.origin
  return NextResponse.redirect(new URL(`/api/stripe/checkout${search}`, origin), 308)
}
