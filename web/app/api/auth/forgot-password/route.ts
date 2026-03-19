import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { randomBytes } from 'crypto'
import { Resend } from 'resend'
import { isRateLimited, getClientIP } from '@/app/lib/security-middleware'

export async function POST(request: NextRequest) {
  // BotID protection
  try {
    const { checkBotId } = await import('botid/server')
    const { isBot } = await checkBotId()
    if (isBot) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
  } catch (e) {
    // BotID not configured - continue
  }

  const ip = getClientIP(request)
  if (await isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json({ message: 'If an account exists, a reset link has been sent' })
    }

    const resetToken = randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000)

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: resetToken,
        expires: resetTokenExpiry,
      },
    })

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://agentbot.raveculture.xyz'}/reset-password?token=${resetToken}`

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      try {
        const result = await resend.emails.send({
          from: 'Agentbot <noreply@raveculture.space>',
          to: email,
          subject: 'Reset your Agentbot password',
          html: `
            <!DOCTYPE html>
            <html>
              <body style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333;">Reset your password</h1>
                <p>You requested a password reset for your Agentbot account.</p>
                <p>Click the button below to reset your password:</p>
                <a href="${resetUrl}" style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
                  Reset Password
                </a>
                <p>Or copy and paste this link:</p>
                <p style="word-break: break-all; color: #666;">${resetUrl}</p>
                <p style="color: #888; font-size: 12px; margin-top: 20px;">
                  If you didn't request this, please ignore this email.
                </p>
              </body>
            </html>
          `,
        })
        if (result.error) {
          console.error('Resend error:', result.error)
          return NextResponse.json({ error: result.error.message }, { status: 400 })
        }
      } catch (err) {
        console.error('Resend exception:', err)
        return NextResponse.json({ error: 'Email service error' }, { status: 500 })
      }
    } else {
      console.log(`Password reset requested for ${email} (RESEND_API_KEY not configured — email not sent)`)
      // NOTE: do NOT log resetUrl — it contains a single-use secret token
    }

    return NextResponse.json({ message: 'If an account exists, a reset link has been sent' })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
