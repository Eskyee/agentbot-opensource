import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/webhooks/railway-status
 * Receives Railway platform status webhook notifications
 * Format: https://docs.railway.com/reference/status-page
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Railway status webhook payload
    const {
      incident,
      component,
      page
    } = body

    const status = incident?.status || component?.status || 'unknown'
    const name = incident?.name || component?.name || 'Railway'
    const message = incident?.incident_updates?.[0]?.body || ''

    console.log(`[Railway Status] ${status}: ${name} — ${message}`)

    // TODO: Forward to Discord/Slack/email if needed
    // For now, just log it

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Railway Status] Error processing webhook:', error)
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}

/**
 * GET — health check
 */
export async function GET() {
  return NextResponse.json({ status: 'ok', endpoint: 'railway-status-webhook' })
}
