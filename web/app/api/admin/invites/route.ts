import { NextResponse } from 'next/server'
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

export async function GET() {
  try {
    // Get all invites (admin only)
    const inviteList = Array.from(invites.values())
    
    return NextResponse.json({
      invites: inviteList,
      total: inviteList.length,
      active: inviteList.filter(i => i.status === 'active').length,
    })
  } catch (error) {
    console.error('Failed to get invites:', error)
    return NextResponse.json(
      { error: 'Failed to get invites' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Generate unique invite code
    const code = `invite-${crypto.randomBytes(12).toString('hex')}`
    
    const invite: Invite = {
      code,
      email,
      createdAt: new Date().toISOString(),
      status: 'active',
    }

    invites.set(code, invite)

    return NextResponse.json(
      {
        success: true,
        code,
        email,
        inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL}/join?code=${code}`,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to create invite:', error)
    return NextResponse.json(
      { error: 'Failed to create invite' },
      { status: 500 }
    )
  }
}
