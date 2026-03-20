export const dynamic = "force-dynamic"
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'
import { prisma } from '@/app/lib/prisma'

function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return adminEmails.includes(email.toLowerCase())
}

export async function GET() {
  // Admin-only — blocked in production for non-admins
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const hasDbUrl = !!process.env.DATABASE_URL

  try {
    await prisma.$connect()
    const userCount = await prisma.user.count()
    await prisma.$disconnect()
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
