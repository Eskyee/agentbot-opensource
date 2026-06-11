import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { getAuthSession } from '@/app/lib/getAuthSession'

export const dynamic = 'force-dynamic'

interface CodingAgentRequest {
  action: 'create' | 'list' | 'status'
  repoUrl?: string
  task?: string
  agent?: 'claude' | 'codex' | 'gemini' | 'cursor'
  agentId?: string
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CodingAgentRequest = await req.json()
    const { action, repoUrl, task, agent = 'claude', agentId } = body

    if (action === 'create') {
      if (!repoUrl || !task) {
        return NextResponse.json({ error: 'repoUrl and task required' }, { status: 400 })
      }

      // Validate GitHub URL
      const githubMatch = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
      if (!githubMatch) {
        return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400 })
      }

      const [, owner, repo] = githubMatch

      // Create coding agent task
      const codingTask = await prisma.managedAgentSession.create({
        data: {
          userId: session.user.id,
          type: 'coding-agent',
          metadata: {
            repoUrl,
            owner,
            repo: repo.replace(/\.git$/, ''),
            task,
            agent,
            status: 'pending',
            createdAt: new Date().toISOString(),
          },
        },
      })

      // Trigger provisioning via backend
      try {
        const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:4000'
        await fetch(`${backendUrl}/api/coding-agent/deploy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId: codingTask.id,
            userId: session.user.id,
            repoUrl,
            task,
            agent,
          }),
        })
      } catch (err) {
        console.error('[CodingAgent] Backend trigger failed:', err)
      }

      return NextResponse.json({
        ok: true,
        taskId: codingTask.id,
        message: 'Coding agent task created',
      })
    }

    if (action === 'list') {
      const tasks = await prisma.managedAgentSession.findMany({
        where: {
          userId: session.user.id,
          type: 'coding-agent',
        },
        orderBy: { updatedAt: 'desc' },
        take: 20,
      })

      return NextResponse.json({ ok: true, tasks })
    }

    if (action === 'status' && agentId) {
      const task = await prisma.managedAgentSession.findUnique({
        where: { id: agentId },
      })

      if (!task || task.userId !== session.user.id) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }

      return NextResponse.json({ ok: true, task })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('[CodingAgent] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tasks = await prisma.managedAgentSession.findMany({
      where: {
        userId: session.user.id,
        type: 'coding-agent',
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({ ok: true, tasks })
  } catch (error) {
    console.error('[CodingAgent] GET Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
