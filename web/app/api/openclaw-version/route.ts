import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3001'
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'dev-secret-key-12345'

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/openclaw/version`, {
      headers: {
        Authorization: `Bearer ${INTERNAL_API_KEY}`
      },
      signal: AbortSignal.timeout(8000)
    })

    if (!response.ok) {
      return NextResponse.json({ openclawVersion: '2026.2.27' })
    }

    const data = await response.json()
    return NextResponse.json({
      openclawVersion: data?.openclawVersion || '2026.2.27',
      image: data?.image,
      deployedAt: data?.deployedAt
    })
  } catch {
    return NextResponse.json({ openclawVersion: '2026.2.27' })
  }
}
