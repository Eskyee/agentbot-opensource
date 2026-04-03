import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { SecureRoute } from '@/app/lib/secure-route'
import { SecurityMiddleware } from '@/app/lib/security-middleware'
import { buildAppUrl } from '@/app/lib/app-url'

// This endpoint handles sensitive operations
// Protected with: Auth, Rate Limiting, Injection Prevention, DDoS Protection

export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { name } = body

    if (!name) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 })
    }

    // Security: Validate input doesn't contain injection patterns
    if (SecurityMiddleware.containsSQLInjection(name) || 
        SecurityMiddleware.containsXSSPayload(name)) {
      SecurityMiddleware.logSuspiciousActivity(
        SecurityMiddleware.getClientIP(req),
        'INJECTION_IN_INVITE',
        { field: 'name' }
      )
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Generate secure invite token — crypto-random, not Math.random()
    const token = crypto.randomBytes(32).toString('hex')
    
    return NextResponse.json({
      success: true,
      inviteUrl: `${buildAppUrl('/invite')}?token=${token}&name=${encodeURIComponent(name)}`,
      token
    }, { status: 201 })
  } catch (error) {
    console.error('Invite error:', error)
    SecurityMiddleware.logSuspiciousActivity(
      SecurityMiddleware.getClientIP(req),
      'INVITE_ERROR',
      { error: String(error) }
    )
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
  }
}



export const dynamic = 'force-dynamic';
