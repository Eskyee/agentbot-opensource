import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { Resend } from 'resend'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { buildAppUrl } from '@/app/lib/app-url'
import { checkUserRateLimit } from '@/lib/rate-limit-user'


export async function POST(request: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.email || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rl = await checkUserRateLimit('email-change', session.user.id, 3, 3600)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many email change attempts. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    )
  }

  const { currentPassword, newEmail } = await request.json()

  if (!newEmail || typeof newEmail !== 'string') {
    return NextResponse.json({ error: 'New email is required' }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
  }
  if (newEmail.toLowerCase() === session.user.email.toLowerCase()) {
    return NextResponse.json({ error: 'New email must differ from current email' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (user.password) {
    if (!currentPassword || typeof currentPassword !== 'string') {
      return NextResponse.json({ error: 'Current password is required' }, { status: 400 })
    }
    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
    }
  }

  const emailTaken = await prisma.user.findUnique({ where: { email: newEmail } })
  if (emailTaken) {
    // Do not leak existence — return generic success-like message
    return NextResponse.json({ message: 'If the email is available, a confirmation link has been sent.' })
  }

  const token = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  await prisma.verificationToken.create({
    data: {
      identifier: `email-change:${user.id}:${newEmail}`,
      token,
      expires,
    },
  })

  const confirmUrl = `${buildAppUrl('/api/settings/email/confirm')}?token=${token}`

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    try {
      await resend.emails.send({
        from: 'Agentbot <noreply@raveculture.space>',
        to: newEmail,
        subject: 'Confirm your new Agentbot email',
        html: `
          <!DOCTYPE html>
          <html>
            <body style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #333;">Confirm your new email</h1>
              <p>You requested to change the email on your Agentbot account to this address.</p>
              <p>Click below to confirm. This link expires in 1 hour.</p>
              <a href="${confirmUrl}" style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
                Confirm new email
              </a>
              <p style="word-break: break-all; color: #666;">${confirmUrl}</p>
              <p style="color: #888; font-size: 12px; margin-top: 20px;">
                If you didn't request this, please ignore this email.
              </p>
            </body>
          </html>
        `,
      })
    } catch (err) {
      console.error('[settings/email] Resend error:', err)
      // Clean up the unusable token and fail the request so the user knows to retry
      await prisma.verificationToken.delete({ where: { token } }).catch(() => {})
      return NextResponse.json(
        { error: 'Failed to send confirmation email. Please try again shortly.' },
        { status: 502 },
      )
    }
  } else {
    console.log(`[settings/email] RESEND_API_KEY not set — confirm token for ${newEmail} generated but not sent`)
  }

  return NextResponse.json({ message: 'If the email is available, a confirmation link has been sent.' })
}
