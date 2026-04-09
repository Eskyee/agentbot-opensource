import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { getBackendApiUrl, getInternalApiKey } from '@/app/api/lib/api-keys'

export async function proxyBitcoinRequest(path: string, init?: RequestInit) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const backendUrl = getBackendApiUrl()
  const apiKey = getInternalApiKey()

  const response = await fetch(`${backendUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'x-user-id': session.user.id,
      'x-user-email': session.user.email || '',
      ...(init?.headers || {}),
    },
    signal: AbortSignal.timeout(10000),
    cache: 'no-store',
  })

  const text = await response.text()
  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json') && text ? JSON.parse(text) : text

  if (!response.ok) {
    return NextResponse.json(
      typeof data === 'object' && data ? data : { error: 'Bitcoin backend request failed' },
      { status: response.status }
    )
  }

  return NextResponse.json(data)
}
