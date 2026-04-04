import { NextResponse } from 'next/server'
import { getInternalApiKey, getBackendApiUrl } from '@/app/api/lib/api-keys'
import { DEFAULT_OPENCLAW_IMAGE, DEFAULT_OPENCLAW_VERSION } from '@/app/lib/openclaw-version'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const BACKEND_API_URL = getBackendApiUrl()
    const INTERNAL_API_KEY = getInternalApiKey()
    const response = await fetch(`${BACKEND_API_URL}/api/openclaw/version`, {
      headers: {
        Authorization: `Bearer ${INTERNAL_API_KEY}`
      },
      signal: AbortSignal.timeout(8000)
    })

    if (!response.ok) {
      return NextResponse.json({ openclawVersion: DEFAULT_OPENCLAW_VERSION, image: DEFAULT_OPENCLAW_IMAGE })
    }

    const data = await response.json()
    return NextResponse.json({
      openclawVersion: data?.openclawVersion || DEFAULT_OPENCLAW_VERSION,
      image: data?.image || DEFAULT_OPENCLAW_IMAGE,
      deployedAt: data?.deployedAt
    })
  } catch {
    return NextResponse.json({ openclawVersion: DEFAULT_OPENCLAW_VERSION, image: DEFAULT_OPENCLAW_IMAGE })
  }
}
