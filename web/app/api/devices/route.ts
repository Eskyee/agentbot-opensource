import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const devices = await prisma.pairedDevice.findMany({
    where: { userId: session.user.id },
    orderBy: { firstSeen: 'desc' },
  })

  return NextResponse.json({
    pending: devices.filter(d => d.status === 'pending'),
    approved: devices.filter(d => d.status === 'approved'),
  })
}

export async function POST(req: Request) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { deviceId, action } = body

    if (!deviceId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: deviceId, action' },
        { status: 400 }
      )
    }

    if (!['approve', 'deny', 'revoke'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: approve, deny, or revoke' },
        { status: 400 }
      )
    }

    const device = await prisma.pairedDevice.findFirst({
      where: { id: deviceId, userId: session.user.id },
    })

    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 })
    }

    if (action === 'approve' && device.status !== 'pending') {
      return NextResponse.json({ error: 'Device is not pending' }, { status: 400 })
    }
    if (action === 'deny' && device.status !== 'pending') {
      return NextResponse.json({ error: 'Device is not pending' }, { status: 400 })
    }
    if (action === 'revoke' && device.status !== 'approved') {
      return NextResponse.json({ error: 'Device is not approved' }, { status: 400 })
    }

    const statusMap: Record<string, string> = {
      approve: 'approved',
      deny: 'denied',
      revoke: 'revoked',
    }

    await prisma.pairedDevice.update({
      where: { id: deviceId },
      data: {
        status: statusMap[action],
        lastSeen: new Date(),
      },
    })

    const updated = await prisma.pairedDevice.findMany({
      where: { userId: session.user.id },
      orderBy: { firstSeen: 'desc' },
    })

    return NextResponse.json({
      success: true,
      pending: updated.filter(d => d.status === 'pending'),
      approved: updated.filter(d => d.status === 'approved'),
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
