import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ workflows: [] }, { status: 401 })
    }

    const workflows = await prisma.workflow.findMany({
      where: { userId: session.user.id },
      include: {
        nodes: {
          select: { id: true, type: true, config: true, position: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ workflows })
  } catch (error: any) {
    console.error('Workflows GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, description, nodes } = body

    if (!name) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 })
    }

    const workflow = await prisma.workflow.create({
      data: {
        userId: session.user.id,
        name,
        description: description || null,
        enabled: true,
        nodes: nodes
          ? {
              create: nodes.map((n: any) => ({
                type: n.type,
                config: JSON.stringify(n.config || {}),
                position: JSON.stringify(n.position || { x: 0, y: 0 }),
              })),
            }
          : undefined,
      },
      include: { nodes: true },
    })

    return NextResponse.json({ workflow }, { status: 201 })
  } catch (error: any) {
    console.error('Workflows POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
