import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'ok',
    checks: {
      database: 'unknown',
      gateway: 'unknown',
      auth: 'unknown',
    }
  }
  
  // Check database
  try {
    const dbRes = await fetch((process.env.NEXT_PUBLIC_APP_URL || 'https://agentbot.sh') + '/api/health')
    checks.checks.database = dbRes.ok ? 'ok' : 'error'
  } catch {
    checks.checks.database = 'error'
  }
  
  // Check auth endpoint
  try {
    const authRes = await fetch((process.env.NEXT_PUBLIC_APP_URL || 'https://agentbot.sh') + '/api/auth/session')
    checks.checks.auth = authRes.ok ? 'ok' : 'error'
  } catch {
    checks.checks.auth = 'error'
  }
  
  return NextResponse.json(checks)
}
