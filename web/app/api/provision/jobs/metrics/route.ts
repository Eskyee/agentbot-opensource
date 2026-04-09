import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { getBackendApiUrl, getInternalApiKey } from '@/app/api/lib/api-keys'

const ADMIN_EMAILS = ['eskyjunglelab@gmail.com', 'admin@agentbot.raveculture.xyz', 'rbasefm@icloud.com']

export async function GET() {
  const session = await getAuthSession()
  const email = session?.user?.email?.toLowerCase() || ''

  if (!session?.user?.id || !ADMIN_EMAILS.includes(email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const response = await fetch(`${getBackendApiUrl()}/api/platform-jobs/metrics`, {
    headers: {
      Authorization: `Bearer ${getInternalApiKey()}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  })

  const body = await response.json()
  return NextResponse.json(body, { status: response.status })
}

export const dynamic = 'force-dynamic'
