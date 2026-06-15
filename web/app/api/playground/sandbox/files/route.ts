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
    signal: AbortSignal.timeout(180_000),
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

    const lines: string[] = ['set -e']
    const dirs = new Set<string>()

    for (const file of files) {
      const path = file.path.startsWith('/') ? file.path : `/vercel/sandbox/${file.path}`
      const dir = path.substring(0, path.lastIndexOf('/'))
      if (dir && !dirs.has(dir)) {
        dirs.add(dir)
        lines.push(`mkdir -p "${dir}"`)
      }
      const b64 = Buffer.from(file.content, 'utf-8').toString('base64')
      lines.push(`echo "${b64}" | base64 -d > "${path}"`)
    }

    const script = lines.join('\n')
    const cmdResult = await runCommand(sessionId, 'bash', ['-c', script])
    console.log('[sandbox.files] write result:', cmdResult?.command?.exitCode)

    const hasPackageJson = files.some((f) => f.path === 'package.json' || f.path.endsWith('/package.json'))

    if (runInstall && hasPackageJson) {
      console.log('[sandbox.files] running npm install')
      const installResult = await runCommand(sessionId, 'npm', ['install', '--loglevel', 'warn'], '/vercel/sandbox')
      console.log('[sandbox.files] npm install exit:', installResult?.command?.exitCode)
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
