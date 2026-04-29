import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { buildAppUrl } from '@/app/lib/app-url'
import crypto from 'crypto'

interface Invite {
  code: string
  email: string | null
  audience: string
  createdAt: string
  usedAt?: string
  expiresAt?: string
  status: 'active' | 'used' | 'expired'
}

function isAdmin(email?: string | null) {
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return !!email && adminEmails.includes(email.toLowerCase())
}

export async function GET() {
  const session = await getAuthSession()
  const adminEmail = session?.user?.email
  if (!isAdmin(adminEmail)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  try {
    const rows = await prisma.invite_codes.findMany({
      orderBy: { created_at: 'desc' },
      take: 200,
    })
    const now = Date.now()
    const inviteList: Invite[] = rows.map((invite) => {
      const expired = Boolean(invite.expires_at && invite.expires_at.getTime() <= now)
      return {
        code: invite.code,
        email: invite.email,
        audience: invite.audience,
        createdAt: invite.created_at?.toISOString() ?? new Date(0).toISOString(),
        usedAt: invite.used_at?.toISOString(),
        expiresAt: invite.expires_at?.toISOString(),
        status: invite.used ? 'used' : expired ? 'expired' : 'active',
      }
    })
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
  const adminEmail = session?.user?.email
  if (!isAdmin(adminEmail)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  try {
    const body = await request.json()
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const audience = typeof body?.audience === 'string' ? body.audience.trim().toLowerCase() : 'headliner'
    const expiresAtInput = typeof body?.expiresAt === 'string' ? body.expiresAt.trim() : ''

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }
    if (!['headliner', 'guest', 'partner'].includes(audience)) {
      return NextResponse.json({ error: 'Invalid invite audience' }, { status: 400 })
    }

    const token = crypto.randomBytes(32).toString('hex')

    const expiresAt = expiresAtInput ? new Date(expiresAtInput) : null
    if (expiresAt && Number.isNaN(expiresAt.getTime())) {
      return NextResponse.json({ error: 'Invalid expiry date' }, { status: 400 })
    }

    const invite = await prisma.invite_codes.create({
      data: {
        code: token,
        email,
        audience,
        created_by: adminEmail,
        expires_at: expiresAt,
      },
    })

    const responseInvite: Invite = {
      code: token,
      email: invite.email,
      audience: invite.audience,
      createdAt: invite.created_at?.toISOString() ?? new Date().toISOString(),
      expiresAt: invite.expires_at?.toISOString(),
      status: 'active',
    }

    const invitePath = audience === 'headliner' ? '/basefm/headliner' : '/invite'

    return NextResponse.json(
      {
        success: true,
        invite: responseInvite,
        code: responseInvite.code,
        email: responseInvite.email,
        audience: responseInvite.audience,
        inviteUrl: `${buildAppUrl(invitePath)}?token=${token}`,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to create invite:', error)
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
  }
}
