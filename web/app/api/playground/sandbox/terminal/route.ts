import { NextRequest } from 'next/server'
import { Sandbox } from '@vercel/sandbox'

export const runtime = 'nodejs'
export const maxDuration = 60

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
    const command = body.command as string
    const args = (body.args as string[]) || []
    const cwd = (body.cwd as string) || '/vercel/sandbox'
    const sudo = body.sudo as boolean || false

    if (!sandboxName || !command) {
      return Response.json(
        { ok: false, error: 'sandboxName and command are required' },
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

    const result = await sandbox.runCommand({
      cmd: command,
      args,
      cwd,
      sudo,
    })

    const stdout = await result.stdout()
    const stderr = await result.stderr()

    return Response.json({
      ok: true,
      exitCode: result.exitCode,
      stdout,
      stderr,
    })
  } catch (error) {
    console.error('[sandbox.terminal] failed', error)
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to execute command' },
      { status: 500 }
    )
  }
}
