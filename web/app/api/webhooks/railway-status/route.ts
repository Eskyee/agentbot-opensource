import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

/**
 * POST /api/webhooks/railway-status
 * Receives Railway platform status webhook notifications
 * Verification: X-Railway-Secret header matches RAILWAY_WEBHOOK_SECRET env var
 */
export async function POST(req: NextRequest) {
  try {
    // Verify webhook secret
    const webhookSecret = process.env.RAILWAY_WEBHOOK_SECRET
    if (webhookSecret) {
      const providedSecret = req.headers.get('x-railway-secret') ||
                             new URL(req.url).searchParams.get('secret')

      if (!providedSecret || !crypto.timingSafeEqual(
        Buffer.from(providedSecret),
        Buffer.from(webhookSecret)
      )) {
        console.warn('[Railway Status] Invalid webhook secret — rejecting')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    } else {
      console.warn('[Railway Status] RAILWAY_WEBHOOK_SECRET not set — accepting without verification')
    }

    const body = await req.json()

    const { incident, component, page } = body
    const status = incident?.status || component?.status || 'unknown'
    const name = incident?.name || component?.name || 'Railway'
    const message = incident?.incident_updates?.[0]?.body || ''

    console.log(`[Railway Status] ${status}: ${name} — ${message}`)

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Railway Status] Error processing webhook:', error)
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', endpoint: 'railway-status-webhook' })
}
