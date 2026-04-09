import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

/**
 * GET /api/scheduled-tasks?agentId=xxx
 * List scheduled tasks for a user (optionally filtered by agent)
 */
export async function GET(req: NextRequest) {
  const session = await getAuthSession()

  if (!session?.user?.email || !session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const agentId = searchParams.get('agentId')

  try {
    const where: Record<string, any> = { userId: session.user.id }
    if (agentId) where.agentId = agentId

    const tasks = await prisma.scheduledTask.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        cronSchedule: true,
        prompt: true,
        enabled: true,
        lastRun: true,
        nextRun: true,
        agentId: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      tasks,
      count: tasks.length,
    })
  } catch (error) {
    console.error('Scheduled tasks list error:', error)
    return NextResponse.json({ error: 'Failed to list tasks' }, { status: 500 })
  }
}

/**
 * POST /api/scheduled-tasks
 * Create a new scheduled task
 */
export async function POST(req: NextRequest) {
  const session = await getAuthSession()

  if (!session?.user?.email || !session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, description, cronSchedule, prompt, agentId, enabled } = await req.json()

    if (!name || !cronSchedule || !prompt || !agentId) {
      return NextResponse.json(
        { error: 'name, cronSchedule, prompt, and agentId are required' },
        { status: 400 }
      )
    }

    // Validate cron format (basic check)
    const cronParts = cronSchedule.trim().split(/\s+/)
    if (cronParts.length < 5 || cronParts.length > 6) {
      return NextResponse.json(
        { error: 'Invalid cron schedule. Expected 5-6 fields (e.g., "0 9 * * *")' },
        { status: 400 }
      )
    }

    // Verify agent belongs to user
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, userId: session.user.id },
    })
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const task = await prisma.scheduledTask.create({
      data: {
        userId: session.user.id,
        agentId,
        name: name.trim(),
        description: description || null,
        cronSchedule: cronSchedule.trim(),
        prompt,
        enabled: enabled !== false,
      },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Scheduled task create error:', error)
    return NextResponse.json({ error: 'Task creation failed' }, { status: 500 })
  }
}

/**
 * PUT /api/scheduled-tasks
 * Update a scheduled task
 */
export async function PUT(req: NextRequest) {
  const session = await getAuthSession()

  if (!session?.user?.email || !session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { taskId, name, description, cronSchedule, prompt, enabled } = await req.json()

    if (!taskId) {
      return NextResponse.json({ error: 'taskId required' }, { status: 400 })
    }

    // Verify task belongs to user
    const existing = await prisma.scheduledTask.findFirst({
      where: { id: taskId, userId: session.user.id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const data: Record<string, any> = {}
    if (name !== undefined) data.name = name.trim()
    if (description !== undefined) data.description = description
    if (cronSchedule !== undefined) data.cronSchedule = cronSchedule.trim()
    if (prompt !== undefined) data.prompt = prompt
    if (enabled !== undefined) data.enabled = enabled

    const task = await prisma.scheduledTask.update({
      where: { id: taskId },
      data,
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error('Scheduled task update error:', error)
    return NextResponse.json({ error: 'Task update failed' }, { status: 500 })
  }
}

/**
 * DELETE /api/scheduled-tasks
 * Delete a scheduled task
 */
export async function DELETE(req: NextRequest) {
  const session = await getAuthSession()

  if (!session?.user?.email || !session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { taskId } = await req.json()

    if (!taskId) {
      return NextResponse.json({ error: 'taskId required' }, { status: 400 })
    }

    // Verify task belongs to user
    const existing = await prisma.scheduledTask.findFirst({
      where: { id: taskId, userId: session.user.id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    await prisma.scheduledTask.delete({ where: { id: taskId } })

    return NextResponse.json({ success: true, taskId })
  } catch (error) {
    console.error('Scheduled task delete error:', error)
    return NextResponse.json({ error: 'Task deletion failed' }, { status: 500 })
  }
}


export const dynamic = 'force-dynamic';