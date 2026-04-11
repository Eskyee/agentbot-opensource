jest.mock('@/app/lib/prisma', () => ({
  prisma: {
    dj_sessions: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}))

import { prisma } from '@/app/lib/prisma'
import { GET } from '@/app/api/basefm/live/route'

describe('/api/basefm/live', () => {
  const mockedDjSessions = prisma.dj_sessions as unknown as {
    findMany: jest.Mock
    updateMany: jest.Mock
  }

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.MUX_TOKEN_ID = 'mux-token-id'
    process.env.MUX_TOKEN_SECRET = 'mux-token-secret'
    mockedDjSessions.findMany.mockResolvedValue([])
    mockedDjSessions.updateMany.mockResolvedValue({ count: 1 })
    global.fetch = jest.fn()
  })

  test('returns a primary live DJ from Mux and syncs the live cache', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        data: [
          {
            id: 'stream-1',
            stream_key: 'key-1',
            status: 'active',
            created_at: 1712800000,
            playback_ids: [{ id: 'playback-1', policy: 'public' }],
            metadata: { dj_name: 'DJ Atlas', dj_wallet: '0xabc' },
          },
        ],
      }),
    })

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.primaryDj).toMatchObject({
      id: 'stream-1',
      name: 'DJ Atlas',
      playbackId: 'playback-1',
      source: 'mux',
    })
    expect(mockedDjSessions.updateMany).toHaveBeenCalledWith({
      where: { mux_stream_id: 'stream-1' },
      data: { status: 'live', playback_id: 'playback-1' },
    })
  })

  test('ends stale live sessions when Mux no longer reports them active', async () => {
    mockedDjSessions.findMany
      .mockResolvedValueOnce([
        {
          id: 3,
          wallet: '0xabc',
          dj_name: 'Old Live DJ',
          playback_id: 'playback-old',
          mux_stream_id: 'stream-old',
          started_at: new Date('2026-04-11T12:00:00.000Z'),
          status: 'live',
        },
      ])
      .mockResolvedValueOnce([])

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        data: [],
      }),
    })

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.count).toBe(0)
    expect(mockedDjSessions.updateMany).toHaveBeenCalledWith({
      where: { id: { in: [3] } },
      data: {
        status: 'ended',
        ended_at: expect.any(Date),
      },
    })
  })

  test('falls back to cached live sessions when Mux is unavailable', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Mux unavailable'))
    mockedDjSessions.findMany.mockResolvedValue([
      {
        id: 1,
        wallet: '0xabc',
        dj_name: 'Cached DJ',
        playback_id: 'playback-cache',
        mux_stream_id: 'stream-cache',
        started_at: new Date('2026-04-11T12:00:00.000Z'),
        status: 'live',
      },
    ])

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.availability).toBe('degraded')
    expect(body.primaryDj).toMatchObject({
      id: 'stream-cache',
      name: 'Cached DJ',
      playbackId: 'playback-cache',
      source: 'session-cache',
    })
  })
})
