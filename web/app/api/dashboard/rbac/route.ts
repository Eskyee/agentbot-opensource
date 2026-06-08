import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

const defaultPermissions = {
  canUseTools: true,
  canAccessInternet: true,
  canSendMessages: true,
  canModifyConfig: false,
  canAccessWallet: false,
  canExecuteCode: true,
}

const defaultLimits = {
  maxTokensPerDay: 500000,
  maxCostPerDay: 5,
  maxToolCallsPerHour: 100,
  maxMessageLength: 4000,
}

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const agents = await prisma.agent.findMany({
      where: { userId: session.user.id },
      include: { agentPolicy: true },
      orderBy: { updatedAt: 'desc' },
    })

    const policies = agents.map((agent) => ({
      agentId: agent.id,
      agentName: agent.name,
      agentStatus: agent.status,
      permissions: (agent.agentPolicy?.permissions as typeof defaultPermissions) ?? defaultPermissions,
      limits: (agent.agentPolicy?.limits as typeof defaultLimits) ?? defaultLimits,
      channels: (agent.agentPolicy?.channels as string[]) ?? [],
      allowedTools: (agent.agentPolicy?.allowedTools as string[]) ?? [],
      blockedTools: (agent.agentPolicy?.blockedTools as string[]) ?? [],
    }))

    return NextResponse.json(policies)
  } catch (error) {
    console.error('[RBAC API] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch policies' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { agentId, permissions, limits, channels, allowedTools, blockedTools } = body

    if (!agentId) {
      return NextResponse.json({ error: 'agentId required' }, { status: 400 })
    }

    // Verify agent belongs to user
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, userId: session.user.id },
    })

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Upsert policy
    const policy = await prisma.agentPolicy.upsert({
      where: { agentId },
      create: {
        userId: session.user.id,
        agentId,
        permissions: permissions ?? defaultPermissions,
        limits: limits ?? defaultLimits,
        channels: channels ?? [],
        allowedTools: allowedTools ?? [],
        blockedTools: blockedTools ?? [],
      },
      update: {
        ...(permissions !== undefined && { permissions }),
        ...(limits !== undefined && { limits }),
        ...(channels !== undefined && { channels }),
        ...(allowedTools !== undefined && { allowedTools }),
        ...(blockedTools !== undefined && { blockedTools }),
      },
    })

    // Log to audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        agentId,
        action: 'policy_updated',
        category: 'config',
        detail: `Updated permissions for ${agent.name}`,
        metadata: { permissions, limits, blockedTools },
      },
    })

    return NextResponse.json({
      agentId,
      agentName: agent.name,
      agentStatus: agent.status,
      permissions: policy.permissions,
      limits: policy.limits,
      channels: policy.channels,
      allowedTools: policy.allowedTools,
      blockedTools: policy.blockedTools,
    })
  } catch (error) {
    console.error('[RBAC API] Patch error:', error)
    return NextResponse.json({ error: 'Failed to update policy' }, { status: 500 })
  }
}
