import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * CRON cleanup endpoint for scheduled maintenance tasks
 * 
 * Triggered by Vercel CRON at 3am daily
 * Configure in vercel.json:
 *   "crons": [{ "path": "/api/cron/cleanup", "schedule": "0 3 * * *" }]
 * 
 * Tasks performed:
 * - Clean up expired sessions (if applicable)
 * - Clean up old verification tokens
 * - Archive old logs (future enhancement)
 */
export async function GET(req: NextRequest) {
  // Verify CRON secret for security (if configured)
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret})`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: string[] = []

  try {
    // Clean up old verification tokens (older than 24 hours)
    const deletedTokens = await prisma.verificationToken.deleteMany({
      where: {
        expires: {
          lt: new Date()
        }
      }
    })
    if (deletedTokens.count > 0) {
      results.push(`Deleted ${deletedTokens.count} expired verification tokens`)
    }

    // Note: passwordResetToken cleanup can be added if that model is created
    // Currently using NextAuth's built-in token management

    // Clean up inactive user sessions (older than 30 days) - optional cleanup
    // This is a placeholder for future session cleanup logic
    // const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    // await prisma.session.deleteMany({ where: { expires: { lt: thirtyDaysAgo } } })

    return NextResponse.json({
      success: true,
      message: 'Cleanup completed',
      results
    })
  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
