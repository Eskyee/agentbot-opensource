import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const category = req.nextUrl.searchParams.get('category')
  const limit = Math.min(Number(req.nextUrl.searchParams.get('limit')) || 50, 100)
  const offset = Number(req.nextUrl.searchParams.get('offset')) || 0

  try {
    const where: Record<string, unknown> = { userId: session.user.id }
    if (category && category !== 'all') {
      where.category = category
    }

    const [entries, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          agent: { select: { name: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ])

    const formatted = entries.map((e) => ({
      id: e.id,
      action: e.action,
      category: e.category,
      detail: e.detail,
      metadata: e.metadata,
      agentId: e.agentId,
      agentName: e.agent?.name ?? null,
      createdAt: e.createdAt.toISOString(),
    }))

    return NextResponse.json({
      entries: formatted,
      total,
      hasMore: offset + limit < total,
    })
  } catch (error) {
    console.error('[Changelog API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch changelog' },
      { status: 500 }
    )
  }
}

// Helper: write audit log entries (used by other API routes)
export async function logAuditEntry(params: {
  userId: string
  agentId?: string
  action: string
  category?: string
  detail?: string
  metadata?: Record<string, unknown>
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        agentId: params.agentId ?? null,
        action: params.action,
        category: params.category ?? 'agent',
        detail: params.detail ?? null,
        metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : undefined,
      },
    })
  } catch (error) {
    console.error('[AuditLog] Failed to write entry:', error)
  }
}
