import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { safeCompare } from '@/app/lib/safe-compare'

/**
 * POST /api/ops/metrics/collect
 *
 * Receives metrics from agent containers and writes to container_metrics.
 * Auth: Bearer token matching INTERNAL_API_KEY env var, OR bridge secret.
 */
export async function POST(req: NextRequest) {
  try {
    // Auth check — accept INTERNAL_API_KEY or BRIDGE_SECRET
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.replace(/^Bearer\s+/i, '')
    const internalKey = process.env.INTERNAL_API_KEY
    const bridgeSecret = process.env.BRIDGE_SECRET

    const isInternal = safeCompare(token, internalKey)
    const isBridge = safeCompare(token, bridgeSecret)

    if (!isInternal && !isBridge) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { userId, containerName, cpuPercent, memPercent, messageCount, errorCount } = body

    if (!userId || !containerName) {
      return NextResponse.json(
        { error: 'userId and containerName are required' },
        { status: 400 }
      )
    }

    if (typeof cpuPercent !== 'number' || typeof memPercent !== 'number') {
      return NextResponse.json(
        { error: 'cpuPercent and memPercent must be numbers' },
        { status: 400 }
      )
    }

    const metric = await prisma.container_metrics.create({
      data: {
        user_id: String(userId),
        container_name: String(containerName),
        cpu_percent: cpuPercent,
        mem_percent: memPercent,
        message_count: messageCount ?? 0,
        error_count: errorCount ?? 0,
      },
    })

    return NextResponse.json({
      ok: true,
      id: metric.id.toString(),
      containerName: metric.container_name,
      sampledAt: metric.sampled_at,
    })
  } catch (error) {
    console.error('Metrics collect error:', error)
    return NextResponse.json({ error: 'Failed to collect metrics' }, { status: 500 })
  }
}
