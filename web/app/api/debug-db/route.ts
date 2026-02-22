import { NextResponse } from 'next/server'

export async function GET() {
  const hasDbUrl = !!process.env.DATABASE_URL
  const dbUrlPrefix = hasDbUrl ? process.env.DATABASE_URL?.substring(0, 20) + '...' : null
  
  return NextResponse.json({
    hasDbUrl,
    dbUrlPrefix,
    nodeEnv: process.env.NODE_ENV,
  })
}
