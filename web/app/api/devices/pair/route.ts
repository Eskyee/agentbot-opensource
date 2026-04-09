import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

export const dynamic = 'force-dynamic'

// POST - Generate a pairing request (called from iPhone)
export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const deviceName = body.name || 'My iPhone'

  const device = await prisma.pairedDevice.create({
    data: {
      userId: session.user.id,
      name: deviceName,
      ip: req.headers.get('x-forwarded-for') || 'self-pair',
      status: 'approved', // Self-pair = auto-approve
    },
  })

  return NextResponse.json({
    success: true,
    device: {
      id: device.id,
      name: device.name,
      status: device.status,
      pairedAt: device.createdAt,
    },
  })
}
