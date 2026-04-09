import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { getBackendApiUrl, getInternalApiKey } from '@/app/api/lib/api-keys'

type JobResponse = {
  job: {
    id: string
    userId: string | null
    status: string
    error: string | null
    result: Record<string, unknown> | null
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { jobId } = await params
  const response = await fetch(`${getBackendApiUrl()}/api/platform-jobs/${jobId}`, {
    headers: {
      Authorization: `Bearer ${getInternalApiKey()}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  })

  const body = await response.json() as JobResponse | { error?: string }
  if (!response.ok || !('job' in body)) {
    return NextResponse.json(body, { status: response.status })
  }

  if (body.job.userId && body.job.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json(body)
}
