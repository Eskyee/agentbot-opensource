import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'


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
    try {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          greenlightCertPem: cert,
          greenlightKeyPem: key,
        }
      })
    } catch (prismaError: any) {
      console.error('[Admin/Greenlight] Prisma update failed:', prismaError.message);
      return NextResponse.json({ error: `Prisma update failed: ${prismaError.message}` }, { status: 500 });
    }

    // 2. Mirror to backend 'users' plural table
    try {
      // Use column names matching db-init.ts (greenlight_cert_pem, greenlight_key_pem)
      await prisma.$executeRaw`
        UPDATE users 
        SET greenlight_cert_pem = ${cert}, 
            greenlight_key_pem = ${key},
            updated_at = NOW()
        WHERE email = ${session.user.email || ''}
      `
    } catch (mirrorError: any) {
      console.warn('[Admin/Greenlight] Mirroring failed but singular table updated:', mirrorError.message)
    }

    return NextResponse.json({ success: true, message: 'Greenlight credentials saved successfully' })
  } catch (error: any) {
    console.error('[Admin/Greenlight] Failed to save credentials:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
