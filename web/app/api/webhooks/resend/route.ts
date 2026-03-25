import { NextRequest, NextResponse } from 'next/server'

// Resend webhook events handler
// Events: email.sent, email.delivered, email.bounced, email.opened, email.clicked, etc.

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    // Log event (in production, store to DB)
    console.log(`[resend-webhook] ${type}:`, {
      type,
      email_id: data?.email_id,
      to: data?.to,
      subject: data?.subject,
      created_at: data?.created_at,
    })

    // Handle specific events
    switch (type) {
      case 'email.bounced':
        console.warn(`[resend-webhook] BOUNCED: ${data?.to} — ${data?.bounce?.message}`)
        // TODO: Mark email as bounced in DB
        break
      case 'email.complined':
        console.warn(`[resend-webhook] COMPLAINED: ${data?.to}`)
        // TODO: Remove from mailing list
        break
      case 'email.delivered':
        // Track delivery for analytics
        break
      case 'email.opened':
        // Track opens for engagement
        break
      case 'email.clicked':
        // Track clicks for engagement
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[resend-webhook] Error:', error)
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}
