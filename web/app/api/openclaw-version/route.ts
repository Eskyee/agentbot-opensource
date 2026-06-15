import { NextResponse } from 'next/server'
import { getInternalApiKey, getBackendApiUrl } from '@/app/api/lib/api-keys'
import { DEFAULT_OPENCLAW_IMAGE, DEFAULT_OPENCLAW_VERSION } from '@/app/lib/openclaw-version'


function normalizeOpenClawVersion(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return DEFAULT_OPENCLAW_VERSION
  const normalized = value.trim()
  return normalized === 'latest' ? DEFAULT_OPENCLAW_VERSION : normalized
}


export async function GET() {
  const BACKEND_API_URL = getBackendApiUrl()
  try {
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
      openclawVersion: normalizeOpenClawVersion(data?.openclawVersion),
      image: data?.image || DEFAULT_OPENCLAW_IMAGE,
      deployedAt: data?.deployedAt
    })
  } catch {
    return NextResponse.json({ openclawVersion: DEFAULT_OPENCLAW_VERSION, image: DEFAULT_OPENCLAW_IMAGE })
  }
}
