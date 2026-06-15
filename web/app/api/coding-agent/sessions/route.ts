import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { getAuthSession } from '@/app/lib/getAuthSession'

export const dynamic = 'force-dynamic'

// POST /api/coding-agent/sessions — create a new coding session
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { repo, task, model = 'claude-sonnet-4-5' } = await req.json()

    if (!repo || !task) {
      return NextResponse.json({ error: 'repo and task required' }, { status: 400 })
    }

    const githubMatch = repo.match(/github\.com\/([^/]+)\/([^/]+)/)
    const branch = `feat/${task.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}`

    const codingSession = await prisma.managedAgentSession.create({
      data: {
        userId: session.user.id,
        type: 'coding-agent',
        metadata: {
          repo,
          owner: githubMatch?.[1] || 'unknown',
          repoName: githubMatch?.[2]?.replace(/\.git$/, '') || repo,
          task,
          model,
          branch,
          status: 'active',
          toolCalls: [],
          messages: [
            {
              role: 'assistant',
              content: `Session started. Working on: ${task}\nRepo: ${repo}\nBranch: ${branch}`,
              timestamp: new Date().toISOString(),
            },
          ],
          createdAt: new Date().toISOString(),
        },
      },
    })

    return NextResponse.json({
      ok: true,
      session: {
        id: codingSession.id,
        repo,
        branch,
        task,
        model,
        status: 'active',
        age: 'now',
      },
    })
  } catch (error) {
    console.error('[CodingAgent] Create session error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// GET /api/coding-agent/sessions — list user's coding sessions
export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessions = await prisma.managedAgentSession.findMany({
      where: {
        userId: session.user.id,
        type: 'coding-agent',
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    })

    const formatted = sessions.map((s) => {
      const meta = (s.metadata as Record<string, unknown>) || {}
      return {
        id: s.id,
        repo: meta.repo || 'unknown',
        branch: meta.branch || 'main',
        task: meta.task || '',
        model: meta.model || 'claude-sonnet-4-5',
        status: meta.status || 'idle',
        age: getAge(s.updatedAt),
      }
    })

    return NextResponse.json({ ok: true, sessions: formatted })
  } catch (error) {
    console.error('[CodingAgent] List sessions error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

function getAge(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}
