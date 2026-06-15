import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

const SANDBOX_API = 'https://api.vercel.com/v1/sandboxes'

function getAuthHeaders() {
  const token = process.env.VERCEL_TOKEN
  if (!token) {
    throw new Error('VERCEL_TOKEN not configured')
  }
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

function getTeamId() {
  return process.env.VERCEL_TEAM_ID || ''
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const runtime = (body.runtime as string) || 'node24'
    const ports = (body.ports as number[]) || [3000]
    const timeout = (body.timeout as number) || 5 * 60 * 1000

    const headers = getAuthHeaders()
    const teamId = getTeamId()
    const params = teamId ? `?teamId=${teamId}` : ''

    const createRes = await fetch(`${SANDBOX_API}${params}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        runtime,
        ports,
        timeout,
      }),
    })

    if (!createRes.ok) {
      const err = await createRes.text()
      throw new Error(`Vercel API ${createRes.status}: ${err}`)
    }

    const sandbox = await createRes.json()

    const previewUrl = sandbox.routes?.find(
      (r: { port: number }) => r.port === 3000
    )?.url || sandbox.url || `https://${sandbox.id}.vercel.app`

    return Response.json({
      ok: true,
      sandbox: {
        name: sandbox.name || sandbox.id,
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
