import { NextResponse } from 'next/server'
import { checkServices } from '@/app/lib/service-health'

export async function GET() {
  const services = await checkServices()

  return NextResponse.json({
    services,
    timestamp: new Date().toISOString(),
  }, {
    headers: {
      'Cache-Control': 'max-age=30, stale-while-revalidate=60',
    },
  })
}

export const dynamic = 'force-dynamic'
