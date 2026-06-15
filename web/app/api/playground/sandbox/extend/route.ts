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
    const body = await req.json()
    const sessionId = body.sessionId as string
    const duration = (body.duration as number) || 30 * 60 * 1000

    if (!sessionId) {
      return Response.json({ ok: false, error: 'sessionId is required' }, { status: 400 })
    }

    const headers = getAuthHeaders()
    const params = `?projectId=${getProjectId()}${getTeamParam()}`

    const res = await fetch(`${SANDBOX_API}/sessions/${sessionId}/extend-timeout${params}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ duration }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Extend failed: ${res.status} ${err}`)
    }

    return Response.json({ ok: true })
  } catch (error) {
    console.error('[sandbox.extend] failed', error)
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to extend timeout' },
      { status: 500 }
    )
  }
}
