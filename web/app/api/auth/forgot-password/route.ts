import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { randomBytes } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
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

    console.log(`Password reset requested for ${email}: ${resetUrl}`)

    return NextResponse.json({ message: 'If an account exists, a reset link has been sent' })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
