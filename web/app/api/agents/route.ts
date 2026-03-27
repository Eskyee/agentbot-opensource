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

    const agents = await prisma.agent.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        name: true,
        model: true,
        status: true,
        websocketUrl: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' }
    })
    
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