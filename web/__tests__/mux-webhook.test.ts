jest.mock('@/app/lib/prisma', () => ({
  prisma: {
    dj_sessions: {
      updateMany: jest.fn(),
    },
  },
}))

import crypto from 'crypto'
import { NextRequest } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { POST } from '@/app/api/webhooks/mux/route'

describe('/api/webhooks/mux', () => {
  const mockedDjSessions = prisma.dj_sessions as unknown as {
    updateMany: jest.Mock
  }

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.MUX_SIGNING_SECRET = 'mux-webhook-secret'
    mockedDjSessions.updateMany.mockResolvedValue({ count: 1 })
  })

  function createSignedRequest(payload: Record<string, unknown>) {
    const body = JSON.stringify(payload)
    const timestamp = String(Math.floor(Date.now() / 1000))
    const sig = crypto
      .createHmac('sha256', process.env.MUX_SIGNING_SECRET!)
      .update(`${timestamp}.${body}`)
      .digest('hex')

    return new NextRequest('http://localhost/api/webhooks/mux', {
      method: 'POST',
      body,
      headers: {
        'mux-signature': `t=${timestamp},v1=${sig}`,
      },
    })
  }

  test('marks a session live when Mux says the stream is active', async () => {
    const request = createSignedRequest({
      type: 'video.live_stream.active',
      data: {
        id: 'stream-1',
        playback_ids: [{ id: 'playback-1' }],
      },
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(mockedDjSessions.updateMany).toHaveBeenCalledWith({
      where: { mux_stream_id: 'stream-1' },
      data: { status: 'live', playback_id: 'playback-1' },
    })
  })

  test('returns a live session to active standby when Mux goes idle', async () => {
    const request = createSignedRequest({
      type: 'video.live_stream.idle',
      data: { id: 'stream-2' },
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(mockedDjSessions.updateMany).toHaveBeenCalledWith({
      where: { mux_stream_id: 'stream-2', status: 'live' },
      data: { status: 'active' },
    })
  })
})
