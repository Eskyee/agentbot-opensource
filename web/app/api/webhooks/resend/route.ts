import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'

// Resend webhook events handler
// Events: email.sent, email.delivered, email.bounced, email.opened, email.clicked, etc.
// Verification: Uses Svix webhook signature verification

const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature
    if (WEBHOOK_SECRET) {
      const svixId = request.headers.get('svix-id')
      const svixTimestamp = request.headers.get('svix-timestamp')
      const svixSignature = request.headers.get('svix-signature')

      if (!svixId || !svixTimestamp || !svixSignature) {
        console.warn('[resend-webhook] Missing Svix headers — rejecting')
        return NextResponse.json({ error: 'Missing signature headers' }, { status: 401 })
      }

      const body = await request.text()
      const wh = new Webhook(WEBHOOK_SECRET)

      try {
        wh.verify(body, {
          'svix-id': svixId,
          'svix-timestamp': svixTimestamp,
          'svix-signature': svixSignature,
        })
      } catch (err) {
        console.error('[resend-webhook] Signature verification failed:', err)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }

      // Re-parse verified body
      const { type, data } = JSON.parse(body)

      return handleEvent(type, data)
    }

    // No webhook secret configured — log warning, process without verification (dev only)
    console.warn('[resend-webhook] RESEND_WEBHOOK_SECRET not set — processing without verification')
    const body = await request.json()
    const { type, data } = body
    return handleEvent(type, data)
  } catch (error) {
    console.error('[resend-webhook] Error:', error)
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}

function handleEvent(type: string, data: any) {
  console.log(`[resend-webhook] ${type}:`, {
    type,
    email_id: data?.email_id,
    to: data?.to,
    subject: data?.subject,
    created_at: data?.created_at,
  })

  switch (type) {
    case 'email.bounced':
      console.warn(`[resend-webhook] BOUNCED: ${data?.to} — ${data?.bounce?.message}`)
      break
    case 'email.complained':
      console.warn(`[resend-webhook] COMPLAINED: ${data?.to}`)
      break
    case 'email.delivered':
    case 'email.opened':
    case 'email.clicked':
      // Track for analytics
      break
  }

  return NextResponse.json({ received: true })
}
