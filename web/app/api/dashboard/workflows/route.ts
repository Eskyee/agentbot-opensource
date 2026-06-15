import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const workflows = await prisma.workflow.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      include: { nodes: true },
    })

    return NextResponse.json(workflows.map((w) => ({
      id: w.id,
      name: w.name,
      description: w.description,
      status: w.status,
      nodes: w.nodes.map((n) => ({
        id: n.id,
        type: n.type,
        label: n.label ?? n.type,
        config: n.config,
        x: (n.position as Record<string, unknown>)?.x ?? 0,
        y: (n.position as Record<string, unknown>)?.y ?? 0,
      })),
      edges: w.edges,
      createdAt: w.createdAt.toISOString(),
      updatedAt: w.updatedAt.toISOString(),
      lastRun: w.lastRun?.toISOString() ?? null,
      runCount: w.runCount,
    })))
  } catch (error) {
    console.error('[Workflows API] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 })
    }

    const workflow = await prisma.workflow.create({
      data: {
        userId: session.user.id,
        name,
        description: description ?? '',
        status: 'draft',
        edges: [],
      },
      include: { nodes: true },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'workflow_created',
        category: 'config',
        detail: `Created workflow "${name}"`,
        metadata: { workflowId: workflow.id },
      },
    })

    return NextResponse.json({
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      status: workflow.status,
      nodes: [],
      edges: workflow.edges,
      createdAt: workflow.createdAt.toISOString(),
      updatedAt: workflow.updatedAt.toISOString(),
      lastRun: null,
      runCount: 0,
    }, { status: 201 })
  } catch (error) {
    console.error('[Workflows API] Create error:', error)
    return NextResponse.json({ error: 'Failed to create workflow' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { id, name, description, status, nodes, edges } = body

    if (!id) {
      return NextResponse.json({ error: 'Workflow id required' }, { status: 400 })
    }

    const existing = await prisma.workflow.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    // Update workflow metadata
    const updated = await prisma.workflow.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(edges !== undefined && { edges }),
      },
      include: { nodes: true },
    })

    // Sync nodes if provided
    if (nodes !== undefined) {
      // Delete removed nodes
      const newNodeIds = nodes.filter((n: { id?: string }) => n.id && !n.id.startsWith('node-')).map((n: { id: string }) => n.id)
      await prisma.workflowNode.deleteMany({
        where: {
          workflowId: id,
          id: { notIn: newNodeIds },
        },
      })

      // Upsert nodes
      for (const node of nodes) {
        if (node.id?.startsWith('node-')) {
          // New node
          await prisma.workflowNode.create({
            data: {
              workflowId: id,
              type: node.type,
              label: node.label ?? node.type,
              config: node.config ?? {},
              position: { x: node.x ?? 0, y: node.y ?? 0 },
            },
          })
        } else if (node.id) {
          // Existing node
          await prisma.workflowNode.update({
            where: { id: node.id },
            data: {
              type: node.type,
              label: node.label ?? node.type,
              config: node.config ?? {},
              position: { x: node.x ?? 0, y: node.y ?? 0 },
            },
          })
        }
      }
    }

    // Refetch with updated nodes
    const final = await prisma.workflow.findUnique({
      where: { id },
      include: { nodes: true },
    })

    if (!final) {
      return NextResponse.json({ error: 'Workflow disappeared' }, { status: 500 })
    }

    return NextResponse.json({
      id: final.id,
      name: final.name,
      description: final.description,
      status: final.status,
      nodes: final.nodes.map((n) => ({
        id: n.id,
        type: n.type,
        label: n.label ?? n.type,
        config: n.config,
        x: (n.position as Record<string, unknown>)?.x ?? 0,
        y: (n.position as Record<string, unknown>)?.y ?? 0,
      })),
      edges: final.edges,
      createdAt: final.createdAt.toISOString(),
      updatedAt: final.updatedAt.toISOString(),
      lastRun: final.lastRun?.toISOString() ?? null,
      runCount: final.runCount,
    })
  } catch (error) {
    console.error('[Workflows API] Patch error:', error)
    return NextResponse.json({ error: 'Failed to update workflow' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = req.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing workflow id' }, { status: 400 })
  }

  try {
    const workflow = await prisma.workflow.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    await prisma.workflow.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Workflows API] Delete error:', error)
    return NextResponse.json({ error: 'Failed to delete workflow' }, { status: 500 })
  }
}
