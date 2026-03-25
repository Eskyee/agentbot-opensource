import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'

/**
 * GET /api/mission-control/fleet/bookings
 * Returns active booking requests for the user's fleet
 */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ bookings: [] })
  }

  // TODO: Wire to real bookings DB table
  return NextResponse.json({ bookings: [] })
}
