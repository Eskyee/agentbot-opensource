import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const runtime = (body.runtime as string) || 'node24'
    const ports = (body.ports as number[]) || [3000]
    const timeout = (body.timeout as number) || 30 * 60 * 1000

    const headers = getAuthHeaders()
    const projectId = getProjectId()
    const params = `?projectId=${projectId}${getTeamParam()}`

    const createRes = await fetch(`${SANDBOX_API}${params}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        runtime,
        ports,
        timeout,
        projectId,
      }),
      signal: AbortSignal.timeout(60_000),
    })

    if (!createRes.ok) {
      const err = await createRes.text()
      throw new Error(`Vercel API ${createRes.status}: ${err}`)
    }

    const sandbox = await createRes.json()

    const route = sandbox.routes?.find((r: { port: number }) => r.port === 3000)
    const sandboxName = sandbox.sandbox?.name || sandbox.sandbox?.id || sandbox.name || sandbox.id
    const sessionId = sandbox.session?.sessionId || sandbox.sessionId || sandbox.id
    const previewUrl = route?.url || `https://${sandboxName}.vercel.app`

    return Response.json({
      ok: true,
      sandbox: {
        name: sandboxName,
        sessionId,
        previewUrl,
        status: sandbox.session?.status || sandbox.status,
        runtime: sandbox.sandbox?.runtime || sandbox.runtime,
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
