import { NextResponse } from 'next/server'
import { getInternalApiKey, getBackendApiUrl } from '@/app/api/lib/api-keys'
import { DEFAULT_OPENCLAW_IMAGE, DEFAULT_OPENCLAW_VERSION } from '@/app/lib/openclaw-version'

function normalizeOpenClawVersion(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return DEFAULT_OPENCLAW_VERSION
  const normalized = value.trim()
  // Strip prefix like "OpenClaw " if present
  const version = normalized.replace(/^OpenClaw\s+/i, '')
  return normalized === 'latest' ? DEFAULT_OPENCLAW_VERSION : version || 'unknown'
}

export async function GET() {
  // Try gateway direct version endpoint first (always current)
  const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || process.env.GATEWAY_URL
  if (GATEWAY_URL) {
    try {
      const gwRes = await fetch(`${GATEWAY_URL}/api/version`, {
        signal: AbortSignal.timeout(5000)
      })
      if (gwRes.ok) {
        const gwData = await gwRes.json()
        if (gwData?.openclawVersion && gwData.openclawVersion !== 'unknown') {
          return NextResponse.json({
            openclawVersion: normalizeOpenClawVersion(gwData.openclawVersion),
            image: DEFAULT_OPENCLAW_IMAGE,
            source: 'gateway',
            ts: gwData.ts,
          })
        }
      }
    } catch {
      // Fall through to backend
    }
  }

  // Fall back to backend API
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
      return NextResponse.json({ openclawVersion: DEFAULT_OPENCLAW_VERSION, image: DEFAULT_OPENCLAW_IMAGE, source: 'default' })
    }

    const data = await response.json()
    const backendVersion = normalizeOpenClawVersion(data?.openclawVersion)
    // Use default if it's newer than backend (e.g. after code deploy but before backend redeploy)
    const finalVersion = DEFAULT_OPENCLAW_VERSION > backendVersion ? DEFAULT_OPENCLAW_VERSION : backendVersion
    return NextResponse.json({
      openclawVersion: finalVersion,
      image: data?.image || DEFAULT_OPENCLAW_IMAGE,
      source: 'backend',
      deployedAt: data?.deployedAt
    })
  } catch {
    return NextResponse.json({ openclawVersion: DEFAULT_OPENCLAW_VERSION, image: DEFAULT_OPENCLAW_IMAGE, source: 'default' })
  }
}
