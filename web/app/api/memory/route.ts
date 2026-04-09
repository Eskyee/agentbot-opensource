import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const agentId = searchParams.get('agentId')

    // agentId=all (or omitted) returns all memories for the user across all agents
    const fetchAll = !agentId || agentId === 'all'

    if (!fetchAll) {
      // Ownership check: ensure the specific agent belongs to this user
      const agent = await prisma.agent.findFirst({
        where: { id: agentId, userId: session.user.id }
      })
      if (!agent) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
      }
    }

    const memories = await prisma.agentMemory.findMany({
      where: {
        userId: session.user.id,
        ...(fetchAll ? {} : { agentId }),
      },
      orderBy: { updatedAt: 'desc' },
    })

    // Build structured memory from stored key-value pairs
    const memoryMap: Record<string, any> = {}
    for (const m of memories) {
      try {
        memoryMap[m.key] = JSON.parse(m.value)
      } catch {
        memoryMap[m.key] = m.value
      }
    }

    return NextResponse.json({
      memory: memoryMap,
      agentId,
      count: memories.length,
      lastUpdated: memories[0]?.updatedAt || null,
    })
  } catch (error) {
    console.error('Memory fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch memory' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { memory, agentId, key } = await req.json()

    if (!agentId) {
      return NextResponse.json({ error: 'agentId required' }, { status: 400 })
    }

    // Ownership check
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, userId: session.user.id }
    })
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // If a single key is provided, upsert that key
    if (key && memory !== undefined) {
      const value = typeof memory === 'string' ? memory : JSON.stringify(memory)
      if (value.length > 100000) {
        return NextResponse.json({ error: 'Memory value too large (max 100KB)' }, { status: 400 })
      }

      await prisma.agentMemory.upsert({
        where: {
          userId_agentId_key: {
            userId: session.user.id,
            agentId,
            key,
          }
        },
        update: { value },
        create: {
          userId: session.user.id,
          agentId,
          key,
          value,
        },
      })

      return NextResponse.json({
        success: true,
        agentId,
        key,
        saved: new Date().toISOString(),
      })
    }

    // If memory is an object, upsert all keys
    if (memory && typeof memory === 'object') {
      const entries = Object.entries(memory)
      if (entries.length > 50) {
        return NextResponse.json({ error: 'Too many memory keys (max 50)' }, { status: 400 })
      }

      for (const [k, v] of entries) {
        const value = typeof v === 'string' ? v : JSON.stringify(v)
        await prisma.agentMemory.upsert({
          where: {
            userId_agentId_key: {
              userId: session.user.id,
              agentId,
              key: k,
            }
          },
          update: { value },
          create: {
            userId: session.user.id,
            agentId,
            key: k,
            value,
          },
        })
      }

      return NextResponse.json({
        success: true,
        agentId,
        keysUpdated: entries.length,
        saved: new Date().toISOString(),
      })
    }

    return NextResponse.json({ error: 'Memory data required (object or key+memory pair)' }, { status: 400 })
  } catch (error) {
    console.error('Memory save error:', error)
    return NextResponse.json({ error: 'Failed to save memory' }, { status: 500 })
  }
}


export const dynamic = 'force-dynamic';