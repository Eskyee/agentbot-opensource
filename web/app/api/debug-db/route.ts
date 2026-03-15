import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
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
