/**
 * Legacy Stripe webhook endpoint — DEPRECATED
 * 
 * This route previously handled Stripe webhooks directly.
 * All Stripe webhooks should now go to: /api/webhooks/stripe
 * 
 * Stripe webhook URL is configured in the Stripe dashboard.
 * If it currently points here, update to: /api/webhooks/stripe
 * 
 * This stub accepts events but logs a warning to encourage migration.
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  console.warn('[stripe/webhook] DEPRECATED — received webhook at legacy route. Redirect to /api/webhooks/stripe')
  
  // Forward to the real handler
  const forwarded = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/webhooks/stripe`,
    {
      method: 'POST',
      headers: Object.fromEntries(req.headers.entries()),
      body: await req.text(),
    }
  )

  return NextResponse.json(await forwarded.json(), { status: forwarded.status })
}

export async function GET() {
  return NextResponse.json({
    status: 'deprecated',
    message: 'Use /api/webhooks/stripe instead',
  })
}
