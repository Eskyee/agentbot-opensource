import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { prisma } from '@/app/lib/prisma'
import { getAuthSession } from '@/app/lib/getAuthSession'

/**
 * POST /api/ops/facts/commit
 *
 * Commits a fact with SHA-256 hash. Simulates GitLawb mirroring by:
 * 1. Hashing the fact data
 * 2. Storing it in execution_logs as a "fact" execution type
 * 3. Returning the hash as the leaf
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { factType, factData, agentId } = body

    if (!factType || typeof factType !== 'string') {
      return NextResponse.json({ error: 'factType is required' }, { status: 400 })
    }

    if (!factData || typeof factData !== 'object') {
      return NextResponse.json({ error: 'factData must be an object' }, { status: 400 })
    }

    // Generate deterministic hash
    const canonical = JSON.stringify(factData, Object.keys(factData).sort())
    const hash = createHash('sha256').update(canonical).digest('hex')
    const leaf = `0x${hash}`

    // Store as an execution log entry with fact metadata
    const factId = `fact/${factType}-${hash.slice(0, 8)}`

    const log = await prisma.execution_logs.create({
      data: {
        user_id: session.user.id,
        agent_id: agentId ? String(agentId) : null,
        execution_type: 'fact',
        success: true,
        error_message: JSON.stringify({
          factId,
          factType,
          leaf,
          data: factData,
          committedAt: new Date().toISOString(),
        }),
      },
    })

    return NextResponse.json({
      factId,
      hash,
      leaf,
      committed: true,
      logId: log.id,
      committedAt: log.created_at,
    })
  } catch (error) {
    console.error('Facts commit error:', error)
    return NextResponse.json({ error: 'Failed to commit fact' }, { status: 500 })
  }
}
