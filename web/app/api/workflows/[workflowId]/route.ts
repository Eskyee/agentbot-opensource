import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { authOptions } from '@/app/lib/auth'
import { prisma } from '@/app/lib/prisma'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { workflowId } = await params
    const workflow = await prisma.workflow.findFirst({
      where: { id: workflowId, userId: session.user.id },
      include: { nodes: { orderBy: { createdAt: 'asc' } } },
    })

    if (!workflow) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ workflow })
  } catch (error: any) {
    console.error('Workflow GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { workflowId } = await params
    const body = await req.json()

    // Verify ownership
    const existing = await prisma.workflow.findFirst({
      where: { id: workflowId, userId: session.user.id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { name, description, enabled, nodes } = body

    // If nodes are provided, replace all nodes
    if (nodes) {
      await prisma.workflowNode.deleteMany({ where: { workflowId } })
    }

    const workflow = await prisma.workflow.update({
      where: { id: workflowId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(enabled !== undefined && { enabled }),
        ...(nodes && {
          nodes: {
            create: nodes.map((n: any) => ({
              type: n.type,
              config: JSON.stringify(n.config || {}),
              position: JSON.stringify(n.position || { x: 0, y: 0 }),
            })),
          },
        }),
      },
      include: { nodes: true },
    })

    return NextResponse.json({ workflow })
  } catch (error: any) {
    console.error('Workflow PUT error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { workflowId } = await params
    // Verify ownership
    const existing = await prisma.workflow.findFirst({
      where: { id: workflowId, userId: session.user.id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.workflow.delete({ where: { id: workflowId } })

    return NextResponse.json({ deleted: true })
  } catch (error: any) {
    console.error('Workflow DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
