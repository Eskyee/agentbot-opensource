import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { getBackendApiUrl, getInternalApiKey } from '@/app/api/lib/api-keys'
import { persistManagedAgent } from '@/app/lib/managed-agent'

type JobResponse = {
  job: {
    id: string
    userId: string | null
    agentId: string | null
    status: string
    error: string | null
    result: Record<string, unknown> | null
    payload?: {
      plan?: string | null
      aiProvider?: string | null
      agentType?: string | null
    }
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
  const backendUrl = getBackendApiUrl()
  const apiKey = getInternalApiKey()

  const response = await fetch(`${backendUrl}/api/platform-jobs/${jobId}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  })

  const body = await response.json() as JobResponse | { error?: string }
  if (!response.ok || !('job' in body)) {
    return NextResponse.json(body, { status: response.status })
  }

  const job = body.job
  if (job.userId && job.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (job.status === 'completed' && job.result?.url && job.agentId) {
    await persistManagedAgent({
      userId: session.user.id,
      agentId: job.agentId,
      url: String(job.result.url),
      aiProvider: typeof job.result.aiProvider === 'string'
        ? job.result.aiProvider
        : (job.payload?.aiProvider || 'openrouter'),
      plan: typeof job.result.plan === 'string'
        ? job.result.plan
        : (job.payload?.plan || 'solo'),
      agentType: typeof job.result.agentType === 'string'
        ? job.result.agentType
        : (job.payload?.agentType || 'creative'),
      status: typeof job.result.status === 'string' ? job.result.status : 'deploying',
    }).catch((error) => {
      console.error('[ProvisionJob] Persist failed:', error)
    })
  }

  return NextResponse.json(body)
}
