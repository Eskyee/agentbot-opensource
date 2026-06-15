import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

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

    if (!sandboxName) {
      return Response.json({ ok: false, error: 'sandboxName is required' }, { status: 400 })
    }

    const headers = getAuthHeaders()
    const params = getTeamParam()

    const stopRes = await fetch(`${SANDBOX_API}/${sandboxName}/stop${params}`, {
      method: 'POST',
      headers,
    })

    if (!stopRes.ok) {
      const err = await stopRes.text()
      throw new Error(`Stop failed: ${stopRes.status} ${err}`)
    }

    const data = await stopRes.json()

    return Response.json({ ok: true, snapshot: data.snapshot })
  } catch (error) {
    console.error('[sandbox.stop] failed', error)
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to stop sandbox' },
      { status: 500 }
    )
  }
}
