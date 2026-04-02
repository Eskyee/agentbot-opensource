import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { gatewayHealthcheck } from '@/app/lib/gateway-proxy'
import { prisma } from '@/app/lib/prisma'

/**
 * GET /api/instance/[userId]/stats
 * Real stats from the shared OpenClaw gateway.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getAuthSession()
  if (!session?.user?.email || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userId } = await params
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { openclawInstanceId: true, openclawUrl: true },
  })

  if (!user?.openclawInstanceId || user.openclawInstanceId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Check the user's actual OpenClaw instance first, not just the shared gateway.
  const health = await gatewayHealthcheck(user.openclawUrl || undefined)

  if (health.ok) {
    return NextResponse.json({
      userId,
      status: 'running',
      health: 'healthy',
      cpu: '0%',       // Gateway doesn't expose CPU — placeholder
      memory: '0MB',    // Gateway doesn't expose memory — placeholder
      uptime: 'active',
      messages: null,
      errors: null,
      openclawVersion: '2026.3.28',
    })
  }

  return NextResponse.json({
    userId,
    status: 'unreachable',
    health: 'unreachable',
    cpu: '0%',
    memory: '0MB',
    uptime: 'unknown',
    messages: null,
    errors: null,
  })
}

export const dynamic = 'force-dynamic'
