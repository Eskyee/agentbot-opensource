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

    const result = await sandbox.stop()

    return Response.json({
      ok: true,
      snapshot: result.snapshot,
    })
  } catch (error) {
    console.error('[sandbox.stop] failed', error)
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to stop sandbox' },
      { status: 500 }
    )
  }
}
