import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 120

const SANDBOX_API = 'https://api.vercel.com/v1/sandboxes'

function getAuthHeaders() {
  const token = process.env.VERCEL_TOKEN
  if (!token) throw new Error('VERCEL_TOKEN not configured')
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

function getTeamParam() {
  const teamId = process.env.VERCEL_TEAM_ID
  return teamId ? `?teamId=${teamId}` : ''
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const sandboxName = body.sandboxName as string
    const files = body.files as Array<{ path: string; content: string }>
    const runInstall = body.runInstall !== false

    if (!sandboxName || !Array.isArray(files) || files.length === 0) {
      return Response.json({ ok: false, error: 'sandboxName and files[] are required' }, { status: 400 })
    }

    const headers = getAuthHeaders()
    const params = getTeamParam()

    const filesPayload = files.map((f) => ({
      path: f.path,
      content: Buffer.from(f.content, 'utf-8').toString('base64'),
    }))

    const writeRes = await fetch(`${SANDBOX_API}/${sandboxName}/files${params}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ files: filesPayload }),
    })

    if (!writeRes.ok) {
      const err = await writeRes.text()
      throw new Error(`Write files failed: ${writeRes.status} ${err}`)
    }

    const hasPackageJson = files.some((f) => f.path === 'package.json' || f.path.endsWith('/package.json'))

    if (runInstall && hasPackageJson) {
      const installRes = await fetch(`${SANDBOX_API}/${sandboxName}/commands${params}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          cmd: 'npm',
          args: ['install', '--loglevel', 'warn'],
          cwd: '/vercel/sandbox',
        }),
      })

      if (!installRes.ok) {
        const err = await installRes.text()
        console.warn('[sandbox.files] npm install failed:', err)
        return Response.json({ ok: true, warning: 'npm install failed', installError: err })
      }
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
