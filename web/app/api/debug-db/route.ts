import { NextResponse } from 'next/server'

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }
  
  const hasDbUrl = !!process.env.DATABASE_URL
  const dbUrlPrefix = hasDbUrl ? process.env.DATABASE_URL?.substring(0, 20) + '...' : null
  
  return NextResponse.json({
    hasDbUrl,
    dbUrlPrefix,
    nodeEnv: process.env.NODE_ENV,
  })
}
