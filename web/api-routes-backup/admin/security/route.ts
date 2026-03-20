export const dynamic = "force-static"
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'

/**
 * Security monitoring endpoint - ADMIN ONLY
 * Returns security metrics
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Verify admin access
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if user is admin
    const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim())
    if (!ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    return NextResponse.json({
      status: 'ok',
      message: 'Security monitoring endpoint',
      timestamp: new Date().toISOString(),
      security: {
        rateLimiting: 'ENABLED',
        injectionPrevention: 'ENABLED',
        botDetection: 'ENABLED',
        authHardening: 'ENABLED',
        securityHeaders: 'ENABLED',
        logging: 'ENABLED'
      }
    })
  } catch (error) {
    console.error('Security endpoint error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
