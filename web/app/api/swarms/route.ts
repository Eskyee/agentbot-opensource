export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'
import { prisma } from '@/app/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const swarms = await prisma.agentSwarm.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      swarms: swarms.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        agents: JSON.parse(s.agents || '[]'),
        enabled: s.enabled,
        createdAt: s.createdAt,
      })),
      count: swarms.length,
    })
  } catch (error) {
    console.error('Swarms fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch swarms' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, description, agents, config } = await req.json()

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 })
    }
    if (name.length > 100) {
      return NextResponse.json({ error: 'Name too long (max 100 chars)' }, { status: 400 })
    }

    const swarm = await prisma.agentSwarm.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        description: description || null,
        agents: JSON.stringify(agents || []),
        enabled: true,
      },
    })

    return NextResponse.json({
      id: swarm.id,
      name: swarm.name,
      description: swarm.description,
      agents: JSON.parse(swarm.agents || '[]'),
      enabled: swarm.enabled,
      createdAt: swarm.createdAt,
    }, { status: 201 })
  } catch (error) {
    console.error('Swarm creation error:', error)
    return NextResponse.json({ error: 'Failed to create swarm' }, { status: 500 })
  }
}
