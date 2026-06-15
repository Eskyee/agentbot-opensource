import { NextRequest } from 'next/server'
import { Sandbox } from '@vercel/sandbox'

export const runtime = 'nodejs'
export const maxDuration = 30

function getSandboxConfig() {
  const teamId = process.env.VERCEL_TEAM_ID
  const projectId = process.env.VERCEL_PROJECT_ID
  const token = process.env.VERCEL_TOKEN

  if (!teamId || !projectId || !token) {
    throw new Error('Vercel Sandbox credentials not configured.')
  }

  return { teamId, projectId, token }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const sandboxName = body.sandboxName as string
    const command = (body.command as string) || 'npm run dev'
    const cwd = (body.cwd as string) || '/vercel/sandbox'

    if (!sandboxName) {
      return Response.json(
        { ok: false, error: 'sandboxName is required' },
        { status: 400 }
      )
    }

    const config = getSandboxConfig()

    const sandbox = await Sandbox.get({
      name: sandboxName,
      teamId: config.teamId,
      projectId: config.projectId,
      token: config.token,
    })

    const parts = command.split(/\s+/)
    const cmd = parts[0]
    const args = parts.slice(1)

    const proc = await sandbox.runCommand({
      cmd,
      args,
      cwd,
      detached: true,
    })

    return Response.json({
      ok: true,
      cmdId: proc.cmdId,
    })
  } catch (error) {
    console.error('[sandbox.start] failed', error)
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to start command' },
      { status: 500 }
    )
  }
}
