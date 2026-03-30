/**
 * Legacy Stripe webhook endpoint — DEPRECATED
 *
 * All Stripe webhooks should now go to: /api/webhooks/stripe
 * This endpoint returns 410 Gone to signal permanent migration.
 */

import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: 'This endpoint is deprecated. Use /api/webhooks/stripe instead.' },
    { status: 410 }
  )
}

export async function GET() {
  return NextResponse.json(
    { error: 'This endpoint is deprecated. Use /api/webhooks/stripe instead.' },
    { status: 410 }
  )
}
