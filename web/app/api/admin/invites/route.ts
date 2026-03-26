import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import crypto from 'crypto'

const invites = new Map()

interface Invite {
  code: string
  email: string
  createdAt: string
  usedAt?: string
  status: 'active' | 'used' | 'expired'
  userId?: string
}

function isAdmin(email?: string | null) {
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return !!email && adminEmails.includes(email.toLowerCase())
}

export async function GET() {
  const session = await getAuthSession()
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  try {
    const inviteList = Array.from(invites.values())
    return NextResponse.json({
      invites: inviteList,
      total: inviteList.length,
      active: inviteList.filter((i: Invite) => i.status === 'active').length,
    })
  } catch (error) {
    console.error('Failed to get invites:', error)
    return NextResponse.json({ error: 'Failed to get invites' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getAuthSession()
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const token = crypto.randomBytes(32).toString('hex')
    const invite: Invite = {
      code: token,
      email,
      createdAt: new Date().toISOString(),
      status: 'active',
    }

    invites.set(token, invite)

    return NextResponse.json(
      {
        success: true,
        code: token,
        email,
        inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://agentbot.raveculture.xyz'}/invite?token=${token}`,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to create invite:', error)
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
  }
}


export const dynamic = 'force-dynamic';