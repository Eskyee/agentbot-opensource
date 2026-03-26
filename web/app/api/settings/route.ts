import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      credits: user.referralCredits ?? 0,
      twoFactorEnabled: false,
    })
  } catch (error) {
    console.error('Settings fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, notifications } = body

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        ...(name !== undefined && { name }),
      }
    })

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      credits: user.referralCredits ?? 0,
      twoFactorEnabled: false,
    })
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, email } = await req.json()

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Check email uniqueness before updating
    if (email && email !== session.user.email) {
      const emailTaken = await prisma.user.findUnique({ where: { email } })
      if (emailTaken) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
      }
    }

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        ...(name && { name }),
        ...(email && email !== session.user.email && { email })
      }
    })

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      credits: user.referralCredits ?? 0,
      twoFactorEnabled: false,
    })
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}


export const dynamic = 'force-dynamic';