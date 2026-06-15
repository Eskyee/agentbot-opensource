import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

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
    const command = body.command as string
    const args = (body.args as string[]) || []
    const cwd = (body.cwd as string) || '/vercel/sandbox'

    if (!sandboxName || !command) {
      return Response.json({ ok: false, error: 'sandboxName and command are required' }, { status: 400 })
    }

    const headers = getAuthHeaders()
    const params = getTeamParam()

    const runRes = await fetch(`${SANDBOX_API}/${sandboxName}/commands${params}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ cmd: command, args, cwd }),
    })

    if (!runRes.ok) {
      const err = await runRes.text()
      throw new Error(`Command failed: ${runRes.status} ${err}`)
    }

    const data = await runRes.json()

    return Response.json({
      ok: true,
      exitCode: data.exitCode,
      stdout: data.stdout,
      stderr: data.stderr,
    })
  } catch (error) {
    console.error('[sandbox.terminal] failed', error)
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to execute command' },
      { status: 500 }
    )
  }
}
