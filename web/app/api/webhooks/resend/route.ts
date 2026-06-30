import { NextRequest, NextResponse } from 'next/server'
import * as svix from 'svix'
import { Resend } from 'resend'

// svix exports Webhook at runtime but omits it from its type defs; bind it
// here with the shape we use so the route stays type-safe.
const Webhook = (svix as unknown as {
  Webhook: new (secret: string) => { verify(payload: string, headers: Record<string, string>): unknown }
}).Webhook

// Resend webhook events handler
// Events: email.sent, email.delivered, email.bounced, email.opened, email.clicked, email.received, etc.
// Verification: Uses Svix webhook signature verification

const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET
const RESEND_API_KEY = process.env.RESEND_API_KEY
const FORWARD_TO = 'YOUR_ADMIN_EMAIL_1'

export async function POST(request: NextRequest) {
  try {
    // Fail CLOSED: without a secret we can't authenticate the sender, and this
    // handler can trigger outbound email forwarding. Previously an unset secret
    // processed the event unverified.
    if (!WEBHOOK_SECRET) {
      console.error('[resend-webhook] RESEND_WEBHOOK_SECRET not configured — rejecting')
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
    }

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
  } catch (error) {
    console.error('[resend-webhook] Error:', error)
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}

async function handleEvent(type: string, data: any) {
  console.log(`[resend-webhook] ${type}:`, {
    type,
    email_id: data?.email_id,
    to: data?.to,
    subject: data?.subject,
    created_at: data?.created_at,
  })

  switch (type) {
    case 'email.received':
      // Forward incoming emails to personal inbox
      await forwardIncoming(data)
      break
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

async function forwardIncoming(data: any) {
  if (!RESEND_API_KEY) {
    console.error('[resend-webhook] RESEND_API_KEY not set — cannot forward')
    return
  }

  try {
    // Fetch full email content
    const resend = new Resend(RESEND_API_KEY)
    const { data: email, error } = await resend.emails.receiving.get(data.email_id)

    if (error || !email) {
      console.error('[resend-webhook] Failed to fetch email:', error)
      return
    }

    const from = email.from || 'unknown'
    const subject = email.subject || 'No subject'
    const text = email.text || ''
    const html = email.html || `<p>${text}</p>`

    // Forward to personal inbox
    const { error: sendError } = await resend.emails.send({
      from: `Agentbot Inbox <hello@agentbot.sh>`,
      to: [FORWARD_TO],
      subject: `[FWD] ${subject}`,
      html: `
        <div style="font-family: monospace; font-size: 12px; color: #666; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-bottom: 12px;">
          <strong>Forwarded from:</strong> hello@agentbot.sh<br>
          <strong>From:</strong> ${from}<br>
          <strong>Subject:</strong> ${subject}
        </div>
        ${html}
      `,
      reply_to: [from],
    })

    if (sendError) {
      console.error('[resend-webhook] Forward failed:', sendError)
    } else {
      console.log(`[resend-webhook] Forwarded email from ${from} to ${FORWARD_TO}`)
    }
  } catch (err) {
    console.error('[resend-webhook] Forward error:', err)
  }
}
