import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

// One-shot email test endpoint
// GET /api/admin/test-email?secret=YOUR_SECRET&to=email@example.com
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  const to = request.nextUrl.searchParams.get('to')
  const adminSecret = process.env.ADMIN_SECRET

  if (!secret || secret !== adminSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!to) {
    return NextResponse.json({ error: 'Missing ?to= param' }, { status: 400 })
  }

  const key = process.env.RESEND_API_KEY
  if (!key) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })
  }

  try {
    const resend = new Resend(key)
    const result = await resend.emails.send({
      from: 'Agentbot <noreply@raveculture.space>',
      to,
      subject: 'Agentbot email test 🦞',
      html: `
        <div style="font-family:sans-serif;background:#000;color:#fff;padding:40px;max-width:600px;margin:auto;border-radius:12px;">
          <div style="font-size:48px;text-align:center;margin-bottom:16px;">🦞</div>
          <h1 style="text-align:center;font-size:24px;margin:0 0 12px;">Email is working</h1>
          <p style="color:#999;text-align:center;">Sent from <strong>noreply@raveculture.space</strong> via Resend</p>
          <p style="color:#666;font-size:12px;text-align:center;margin-top:24px;">agentbot.raveculture.xyz</p>
        </div>
      `,
    })

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, id: result.data?.id })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
