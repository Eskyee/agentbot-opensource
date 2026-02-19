import { NextResponse } from 'next/server'

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3001'
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'dev-secret-key-12345'

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/openclaw/version`, {
      headers: {
        Authorization: `Bearer ${INTERNAL_API_KEY}`
      }
    })

    if (!response.ok) {
      return NextResponse.json({ openclawVersion: '2026.2.17' })
    }

    const data = await response.json()
    return NextResponse.json({
      openclawVersion: data?.openclawVersion || '2026.2.17',
      image: data?.image
    })
  } catch {
    return NextResponse.json({ openclawVersion: '2026.2.17' })
  }
}
