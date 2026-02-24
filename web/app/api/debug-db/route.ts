import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }
  
  const hasDbUrl = !!process.env.DATABASE_URL
  const dbUrlPrefix = hasDbUrl ? process.env.DATABASE_URL?.substring(0, 20) + '...' : null
  
  try {
    await prisma.$connect()
    const userCount = await prisma.user.count()
    await prisma.$disconnect()
    return NextResponse.json({
      hasDbUrl,
      dbUrlPrefix,
      nodeEnv: process.env.NODE_ENV,
      connection: 'ok',
      userCount,
    })
  } catch (error: any) {
    return NextResponse.json({
      hasDbUrl,
      dbUrlPrefix,
      nodeEnv: process.env.NODE_ENV,
      connection: 'failed',
      error: error.message,
    })
  }
}
