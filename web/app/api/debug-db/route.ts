import { NextResponse } from 'next/server'

const DEBUG_SECRET = process.env.DEBUG_SECRET

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  
  if (!DEBUG_SECRET || authHeader !== `Bearer ${DEBUG_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const hasDbUrl = !!process.env.DATABASE_URL
  const dbUrlPrefix = hasDbUrl ? process.env.DATABASE_URL?.substring(0, 20) + '...' : null
  
  return NextResponse.json({
    hasDbUrl,
    dbUrlPrefix,
    nodeEnv: process.env.NODE_ENV,
  })
}
