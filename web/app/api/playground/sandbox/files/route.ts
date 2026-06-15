import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 120

const SANDBOX_API = 'https://vercel.com/api/v2/sandboxes'

function getAuthHeaders() {
  const token = process.env.VERCEL_TOKEN
  if (!token) throw new Error('VERCEL_TOKEN not configured')
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

function getTeamParam() {
  const teamId = process.env.VERCEL_TEAM_ID
  return teamId ? `&teamId=${teamId}` : ''
}

function getProjectId() {
  const projectId = process.env.VERCEL_PROJECT_ID
  if (!projectId) throw new Error('VERCEL_PROJECT_ID not configured')
  return projectId
}

async function runCommand(sessionId: string, command: string, args: string[], cwd?: string) {
  const headers = getAuthHeaders()
  const params = `?projectId=${getProjectId()}${getTeamParam()}`

  const res = await fetch(`${SANDBOX_API}/sessions/${sessionId}/cmd${params}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ command, args, cwd }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Command failed: ${res.status} ${err}`)
  }

  return res.json()
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const sessionId = body.sessionId as string
    const files = body.files as Array<{ path: string; content: string }>
    const runInstall = body.runInstall !== false

    if (!sessionId || !Array.isArray(files) || files.length === 0) {
      return Response.json({ ok: false, error: 'sessionId and files[] are required' }, { status: 400 })
    }

    const base64Files = files.map((f) => {
      const content = Buffer.from(f.content, 'utf-8').toString('base64')
      const path = f.path.startsWith('/') ? f.path : `/vercel/sandbox/${f.path}`
      return { path, content }
    })

    for (const file of base64Files) {
      const dir = file.path.substring(0, file.path.lastIndexOf('/'))
      if (dir) {
        await runCommand(sessionId, 'mkdir', ['-p', dir])
      }
      await runCommand(sessionId, 'bash', ['-c', `echo '${file.content}' | base64 -d > '${file.path}'`])
    }

    const hasPackageJson = files.some((f) => f.path === 'package.json' || f.path.endsWith('/package.json'))

    if (runInstall && hasPackageJson) {
      await runCommand(sessionId, 'npm', ['install', '--loglevel', 'warn'], '/vercel/sandbox')
    }

    return Response.json({ ok: true, filesWritten: files.length })
  } catch (error) {
    console.error('[sandbox.files] failed', error)
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to write files' },
      { status: 500 }
    )
  }
}
