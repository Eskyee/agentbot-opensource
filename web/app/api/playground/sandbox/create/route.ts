import { NextRequest } from 'next/server'
import { Sandbox } from '@vercel/sandbox'

export const runtime = 'nodejs'
export const maxDuration = 30

function getSandboxConfig() {
  const teamId = process.env.VERCEL_TEAM_ID
  const projectId = process.env.VERCEL_PROJECT_ID
  const token = process.env.VERCEL_TOKEN

  if (!teamId || !projectId || !token) {
    throw new Error('Vercel Sandbox credentials not configured. Set VERCEL_TEAM_ID, VERCEL_PROJECT_ID, and VERCEL_TOKEN.')
  }

  return { teamId, projectId, token }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const name = body.name as string | undefined
    const runtime = (body.runtime as string) || 'node24'
    const ports = (body.ports as number[]) || [3000]
    const timeout = (body.timeout as number) || 5 * 60 * 1000

    const config = getSandboxConfig()

    const sandbox = await Sandbox.create({
      name,
      teamId: config.teamId,
      projectId: config.projectId,
      token: config.token,
      runtime,
      ports,
      timeout,
      persistent: true,
    })

    const previewUrl = sandbox.domain(3000)

    return Response.json({
      ok: true,
      sandbox: {
        name: sandbox.name,
        previewUrl,
        status: sandbox.status,
        runtime: sandbox.runtime,
      },
    })
  } catch (error) {
    console.error('[sandbox.create] failed', error)
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to create sandbox' },
      { status: 500 }
    )
  }
}
