export const dynamic = "force-static"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

/**
 * CRON cleanup endpoint for scheduled maintenance tasks
 *
 * Triggered by Vercel CRON at 3am daily.
 * Configure in vercel.json:
 *   "crons": [{ "path": "/api/cron/cleanup", "schedule": "0 3 * * *" }]
 *
 * CRON_SECRET env var is required — set it in Vercel and use the same value
 * in your Vercel cron Authorization header config.
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')

  // Always require a secret — if CRON_SECRET is not configured, deny all requests
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: string[] = []

  try {
    // Delete expired verification tokens
    const deletedTokens = await prisma.verificationToken.deleteMany({
      where: { expires: { lt: new Date() } },
    })
    if (deletedTokens.count > 0) {
      results.push(`Deleted ${deletedTokens.count} expired verification tokens`)
    }

    return NextResponse.json({ success: true, message: 'Cleanup completed', results })
  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
