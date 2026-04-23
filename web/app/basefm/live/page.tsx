import { headers } from 'next/headers'
import { BasefmLivePageClient } from '@/components/basefm/BasefmLivePageClient'
import type { LiveResponse } from '@/components/basefm/BasefmLivePlayer'


function getBaseUrl(hostHeader: string | null, protoHeader: string | null) {
  if (hostHeader) {
    return `${protoHeader || 'https'}://${hostHeader}`
  }

  return process.env.NEXTAUTH_URL || 'http://localhost:3000'
}

async function getInitialLiveData() {
  const headerStore = await headers()
  const baseUrl = getBaseUrl(
    headerStore.get('x-forwarded-host') || headerStore.get('host'),
    headerStore.get('x-forwarded-proto')
  )

  try {
    const response = await fetch(`${baseUrl}/api/basefm/live`, {
      cache: 'no-store',
      next: { revalidate: 0 },
    })

    const data = (await response.json()) as LiveResponse

    return {
      initialLiveData: data,
      initialError: response.ok ? data.error || null : data.error || 'Unable to load live station',
    }
  } catch (error) {
    return {
      initialLiveData: null,
      initialError: error instanceof Error ? error.message : 'Unable to load live station',
    }
  }
}

export default async function BasefmLivePage() {
  const { initialLiveData, initialError } = await getInitialLiveData()

  return (
    <BasefmLivePageClient
      initialLiveData={initialLiveData}
      initialError={initialError}
    />
  )
}
