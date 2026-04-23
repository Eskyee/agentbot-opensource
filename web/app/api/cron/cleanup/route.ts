import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { sendSupportAlert } from '@/app/lib/support-alert'

/**
 * CRON cleanup endpoint for scheduled maintenance tasks and self-healing
 * Triggered by Vercel CRON every 15 minutes.
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

    // 3. Auto-terminate stale DJ sessions & Reconcile with Mux
    const staleSessionThreshold = new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours absolute max
    // @ts-ignore
    if (prisma.dj_sessions) {
      // 3a. Hard cutoff for absolute max duration
      // @ts-ignore
      const staleDjs = await prisma.dj_sessions.updateMany({
        where: {
          status: { in: ['active', 'live'] },
          started_at: { lt: staleSessionThreshold },
        },
        data: {
          status: 'auto-ended',
          ended_at: new Date(),
        },
      })
      if (staleDjs.count > 0) {
        results.push(`Auto-terminated ${staleDjs.count} stale DJ sessions (max-duration)`)
        healedCount += staleDjs.count
      }

      // 3b. Active Mux reconciliation
      const muxTokenId = process.env.MUX_TOKEN_ID
      const muxTokenSecret = process.env.MUX_TOKEN_SECRET
      if (muxTokenId && muxTokenSecret) {
        try {
          const auth = Buffer.from(`${muxTokenId}:${muxTokenSecret}`).toString('base64')
          const muxRes = await fetch('https://api.mux.com/video/v1/live-streams?limit=100', {
            headers: { 'Authorization': `Basic ${auth}` },
            signal: AbortSignal.timeout(10000)
          })
          
          if (muxRes.ok) {
            const muxData = await muxRes.json()
            const activeMuxStreamIds = new Set((muxData.data || [])
              .filter((s: any) => s.status === 'active')
              .map((s: any) => s.id))
            
            // @ts-ignore
            const currentlyLive = await prisma.dj_sessions.findMany({
              where: { status: { in: ['active', 'live'] } },
              select: { id: true, mux_stream_id: true }
            })

            const ghostSessions = currentlyLive.filter(s => !activeMuxStreamIds.has(s.mux_stream_id))
            if (ghostSessions.length > 0) {
              // @ts-ignore
              await prisma.dj_sessions.updateMany({
                where: { id: { in: ghostSessions.map(s => s.id) } },
                data: { status: 'auto-ended', ended_at: new Date() }
              })
              results.push(`Closed ${ghostSessions.length} ghost streams (Mux disconnected)`)
              healedCount += ghostSessions.length
            }
          }
        } catch (err) {
          console.warn('[Self-Heal] Mux reconciliation failed:', err)
        }
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

    // 5. Cross-platform reconciliation (basefm.space)
    const basefmOpsSecret = process.env.INTERNAL_OPS_SECRET
    const basefmApiUrl = process.env.BASEFM_API_URL || 'https://basefm.space'
    if (basefmOpsSecret) {
      try {
        const basefmRes = await fetch(`${basefmApiUrl}/api/admin/cleanup-all`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${basefmOpsSecret}` },
          signal: AbortSignal.timeout(10000)
        })
        if (basefmRes.ok) {
          const basefmData = await basefmRes.json()
          if (basefmData.cleared > 0) {
            results.push(`Triggered basefm.space cleanup: ${basefmData.cleared} ghost streams resolved`)
            healedCount += basefmData.cleared
          }
        }
      } catch (err) {
        console.warn('[Self-Heal] basefm.space cross-reconciliation failed:', err)
      }
    }

    // 6. Send unified support alert if self-healing actions were taken
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
