import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

export async function GET() {
  try {
    const session = await getAuthSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({
        agents: [],
        count: 0,
        status: 'ok',
      })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        openclawInstanceId: true,
        openclawUrl: true,
      },
    })

    const agents = await prisma.agent.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        userId: true,
        name: true,
        model: true,
        status: true,
        websocketUrl: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' }
    })

    const hasRuntimeBackedAgent = Boolean(
      targetUser?.openclawInstanceId &&
      agents.some((agent) => agent.id === targetUser.openclawInstanceId)
    )

    if (targetUser?.openclawInstanceId && !hasRuntimeBackedAgent) {
      agents.unshift({
        id: targetUser.openclawInstanceId,
        userId: targetUser.id,
        name: 'Managed OpenClaw Runtime',
        model: 'openclaw',
        status: 'running',
        websocketUrl: targetUser.openclawUrl,
        createdAt: new Date(0),
        updatedAt: new Date(),
      })
    }
    
    return NextResponse.json({
      agents: agents || [],
      count: (agents || []).length,
      status: 'ok',
    })
  } catch (error) {
    console.error('Failed to fetch agents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agents', agents: [], count: 0 },
      { status: 500 }
    )
  }
}


export const dynamic = 'force-dynamic';
