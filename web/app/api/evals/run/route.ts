/**
 * POST /api/evals/run — Trigger a benchmark run via soul service
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { protectAiEndpoint } from '@/app/lib/botid'
import { prisma } from '@/app/lib/prisma'
import { SoulClient } from '@/lib/soul'
import { DEFAULT_SOUL_SERVICE_URL } from '@/app/lib/openclaw-config'

export const runtime = 'nodejs'

const SOUL_URL = process.env.SOUL_SERVICE_URL || DEFAULT_SOUL_SERVICE_URL

async function getSoulClient(userId: string): Promise<SoulClient | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { openclawUrl: true },
    })
    const url = user?.openclawUrl || SOUL_URL
    if (!url) return null
    return new SoulClient(url)
  } catch {
    return SOUL_URL ? new SoulClient(SOUL_URL) : null
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const protection = await protectAiEndpoint(ip)
  if (protection.blocked) {
    return NextResponse.json({ error: protection.reason }, { status: protection.status })
  }

  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const soul = await getSoulClient(session.user.id)
  if (!soul) {
    return NextResponse.json({ error: 'Soul service not available' }, { status: 503 })
  }

  try {
    const result = await soul.triggerBenchmark()
    return NextResponse.json(result)
  } catch (err: any) {
    console.error('[Evals] Benchmark trigger failed:', err)
    return NextResponse.json({ error: err.message || 'Benchmark failed' }, { status: 502 })
  }
}
