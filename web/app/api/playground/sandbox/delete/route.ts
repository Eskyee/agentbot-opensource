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

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sandboxName = searchParams.get('sandboxName')

    if (!sandboxName) {
      return Response.json({ ok: false, error: 'sandboxName is required' }, { status: 400 })
    }

    const headers = getAuthHeaders()
    const params = `?projectId=${getProjectId()}${getTeamParam()}`

    const deleteRes = await fetch(`${SANDBOX_API}/${encodeURIComponent(sandboxName)}${params}`, {
      method: 'DELETE',
      headers,
    })

    if (!deleteRes.ok) {
      const err = await deleteRes.text()
      throw new Error(`Delete failed: ${deleteRes.status} ${err}`)
    }

    return Response.json({ ok: true })
  } catch (error) {
    console.error('[sandbox.delete] failed', error)
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to delete sandbox' },
      { status: 500 }
    )
  }
}
