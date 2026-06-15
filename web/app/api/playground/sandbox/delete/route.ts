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

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sandboxName = searchParams.get('sandboxName')

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

    await sandbox.delete()

    return Response.json({ ok: true })
  } catch (error) {
    console.error('[sandbox.delete] failed', error)
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to delete sandbox' },
      { status: 500 }
    )
  }
}
