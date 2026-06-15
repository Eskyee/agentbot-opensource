import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const status = req.nextUrl.searchParams.get('status')
  const risk = req.nextUrl.searchParams.get('risk')

  try {
    const where: Record<string, unknown> = { userId: session.user.id }
    if (status && status !== 'all') where.status = status
    if (risk && risk !== 'all') where.risk = risk

    const approvals = await prisma.approvalRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { agent: { select: { name: true } } },
    })

    const formatted = approvals.map((a) => ({
      id: a.id,
      agentId: a.agentId,
      agentName: a.agent.name,
      action: a.action,
      category: a.category,
      description: a.description,
      payload: a.payload,
      risk: a.risk,
      status: a.status,
      requestedAt: a.createdAt.toISOString(),
      resolvedAt: a.resolvedAt?.toISOString() ?? null,
      resolvedBy: a.resolvedBy,
      autoApprove: false,
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('[Approvals API] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch approvals' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { id, decision } = body

    if (!id || !['approved', 'denied'].includes(decision)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const approval = await prisma.approvalRequest.findFirst({
      where: { id, userId: session.user.id, status: 'pending' },
    })

    if (!approval) {
      return NextResponse.json({ error: 'Approval not found or already resolved' }, { status: 404 })
    }

    const updated = await prisma.approvalRequest.update({
      where: { id },
      data: {
        status: decision,
        resolvedAt: new Date(),
        resolvedBy: session.user.email ?? session.user.id,
      },
    })

    // Log to audit trail
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        agentId: approval.agentId,
        action: `approval_${decision}`,
        category: 'config',
        detail: `${decision === 'approved' ? 'Approved' : 'Denied'}: ${approval.action}`,
        metadata: { approvalId: id, decision, risk: approval.risk },
      },
    })

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      resolvedAt: updated.resolvedAt?.toISOString(),
    })
  } catch (error) {
    console.error('[Approvals API] Patch error:', error)
    return NextResponse.json({ error: 'Failed to resolve approval' }, { status: 500 })
  }
}
