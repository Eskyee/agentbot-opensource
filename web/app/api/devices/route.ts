import { NextResponse } from 'next/server'

interface Device {
  id: string
  name: string
  ip: string
  firstSeen: string
  lastSeen: string
  status: 'pending' | 'approved' | 'denied' | 'revoked'
}

let devices: Device[] = [
  {
    id: 'dev_pending_1',
    name: 'iPhone 15 Pro — Atlas Mobile',
    ip: '86.23.104.12',
    firstSeen: '2026-03-27T14:22:00Z',
    lastSeen: '2026-03-27T15:30:00Z',
    status: 'pending',
  },
  {
    id: 'dev_pending_2',
    name: 'Chrome — MacBook Pro',
    ip: '86.23.104.12',
    firstSeen: '2026-03-27T15:01:00Z',
    lastSeen: '2026-03-27T15:01:00Z',
    status: 'pending',
  },
  {
    id: 'dev_approved_1',
    name: 'Docker Container — agentbot-prod',
    ip: '10.0.1.42',
    firstSeen: '2026-03-25T09:00:00Z',
    lastSeen: '2026-03-27T15:29:00Z',
    status: 'approved',
  },
]

export async function GET() {
  const pending = devices.filter(d => d.status === 'pending')
  const approved = devices.filter(d => d.status === 'approved')

  return NextResponse.json({ pending, approved })
}

export async function POST(req: Request) {
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

    const device = devices.find(d => d.id === deviceId)
    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 })
    }

    if (action === 'approve') {
      if (device.status !== 'pending') {
        return NextResponse.json({ error: 'Device is not pending' }, { status: 400 })
      }
      device.status = 'approved'
      device.lastSeen = new Date().toISOString()
    } else if (action === 'deny') {
      if (device.status !== 'pending') {
        return NextResponse.json({ error: 'Device is not pending' }, { status: 400 })
      }
      device.status = 'denied'
    } else if (action === 'revoke') {
      if (device.status !== 'approved') {
        return NextResponse.json({ error: 'Device is not approved' }, { status: 400 })
      }
      device.status = 'revoked'
    }

    const pending = devices.filter(d => d.status === 'pending')
    const approved = devices.filter(d => d.status === 'approved')

    return NextResponse.json({
      success: true,
      device,
      pending,
      approved,
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
