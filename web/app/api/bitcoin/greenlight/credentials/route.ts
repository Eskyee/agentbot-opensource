import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { cert, key } = body

    if (!cert || !key) {
      return NextResponse.json({ error: 'Both certificate and key are required' }, { status: 400 })
    }

    // 1. Update Prisma User model
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        greenlightCertPem: cert,
        greenlightKeyPem: key,
      }
    })

    // 2. Mirror to backend 'users' plural table
    try {
      await prisma.$executeRaw`
        UPDATE users 
        SET greenlight_cert_pem = ${cert}, 
            greenlight_key_pem = ${key},
            updated_at = NOW()
        WHERE email = ${session.user.email || ''}
      `
    } catch (mirrorError) {
      console.warn('[Admin/Greenlight] Failed to mirror credentials to backend table:', mirrorError)
    }

    return NextResponse.json({ success: true, message: 'Greenlight credentials saved successfully' })
  } catch (error: any) {
    console.error('[Admin/Greenlight] Failed to save credentials:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
