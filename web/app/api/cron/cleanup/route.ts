import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { sendSupportAlert } from '@/app/lib/support-alert'

/**
 * CRON cleanup endpoint for scheduled maintenance tasks and self-healing
 *
 * Triggered by Vercel CRON every 15 minutes.
 * Configure in vercel.json:
 *   "crons": [{ "path": "/api/cron/cleanup", "schedule": "*/15 * * * *" }]
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
  let healedCount = 0

  try {
    // 1. Delete expired verification tokens
    // @ts-ignore
    if (prisma.verificationToken) {
      // @ts-ignore
      const deletedTokens = await prisma.verificationToken.deleteMany({
        where: { expires: { lt: new Date() } },
      })
      if (deletedTokens.count > 0) {
        results.push(`Deleted ${deletedTokens.count} expired verification tokens`)
        healedCount += deletedTokens.count
      }
    }

    // 2. Revert stale M2M jobs stuck in "claimed" for more than 2 hours
    const staleJobThreshold = new Date(Date.now() - 2 * 60 * 60 * 1000)
    const stuckJobs = await prisma.m2MJob.updateMany({
      where: {
        state: 'claimed',
        claimedAt: { lt: staleJobThreshold },
      },
      data: {
        state: 'open',
        claimerAgentId: null,
        claimedAt: null,
      },
    })
    if (stuckJobs.count > 0) {
      results.push(`Reverted ${stuckJobs.count} stuck M2M jobs to open`)
      healedCount += stuckJobs.count
    }

    // 3. Auto-terminate stale DJ sessions
    const staleSessionThreshold = new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours absolute max
    // @ts-ignore
    if (prisma.dj_sessions) {
      // @ts-ignore
      const staleDjs = await prisma.dj_sessions.updateMany({
        where: {
          status: 'active',
          started_at: { lt: staleSessionThreshold },
        },
        data: {
          status: 'auto-ended',
          ended_at: new Date(),
        },
      })
      if (staleDjs.count > 0) {
        results.push(`Auto-terminated ${staleDjs.count} stale DJ sessions`)
        healedCount += staleDjs.count
      }
    }

    // 4. Mark unresponsive OpenClaw Gateway agents as offline (no heartbeat in 15 minutes)
    const offlineThreshold = new Date(Date.now() - 15 * 60 * 1000)
    const offlineAgents = await prisma.$executeRaw`
      UPDATE agent_registrations
      SET status = 'offline'
      WHERE status = 'online' AND last_seen < ${offlineThreshold}
    `
    if (offlineAgents > 0) {
      results.push(`Marked ${offlineAgents} unresponsive agents as offline`)
      healedCount += offlineAgents
    }

    // 5. Send unified support alert if self-healing actions were taken
    if (healedCount > 0) {
      await sendSupportAlert({
        title: '🤖 Vercel Auto-Heal Report',
        message: `Self-healing cron job resolved ${healedCount} anomalies:\n- ` + results.join('\n- '),
      }).catch(() => {})
    }

    return NextResponse.json({ success: true, message: 'Self-healing & cleanup completed', results })
  } catch (error) {
    console.error('Self-healing error:', error)
    await sendSupportAlert({
      title: '🚨 Vercel Auto-Heal Failed',
      message: error instanceof Error ? error.message : 'Unknown error during self-healing cron job.',
    }).catch(() => {})
    
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
