import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { isAdminEmail } from '@/app/lib/admin'
import { getGlobalFlags } from '@/app/lib/feature-flags'
import { prisma } from '@/app/lib/prisma'

export async function GET() {
  if (!getGlobalFlags().debugRoutesEnabled) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  // Admin-only — blocked in production for non-admins
  const session = await getAuthSession()
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const hasDbUrl = !!process.env.DATABASE_URL

  try {
    const userCount = await prisma.user.count()
    return NextResponse.json({
      hasDbUrl,
      nodeEnv: process.env.NODE_ENV,
      connection: 'ok',
      userCount,
    })
  } catch (error: any) {
    console.error('debug-db error:', error)
    return NextResponse.json({
      hasDbUrl,
      nodeEnv: process.env.NODE_ENV,
      connection: 'failed',
    })
  }
}


