process.env.MUX_TOKEN_ID = 'mux-token-id'
process.env.MUX_TOKEN_SECRET = 'mux-token-secret'

jest.mock('@/app/lib/basefmSession', () => ({
  createBasefmSessionToken: jest.fn(() => 'signed-session-token'),
  verifyBasefmSessionToken: jest.fn(),
}))

jest.mock('@/app/lib/getAuthSession', () => ({
  getAuthSession: jest.fn(),
}))

jest.mock('@/app/lib/communityProgram', () => ({
  getCommunityProgramForUser: jest.fn(),
}))

jest.mock('@/app/lib/prisma', () => ({
  prisma: {
    dj_sessions: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))

import { NextRequest } from 'next/server'
import { verifyBasefmSessionToken } from '@/app/lib/basefmSession'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { getCommunityProgramForUser } from '@/app/lib/communityProgram'
import { prisma } from '@/app/lib/prisma'
import { DELETE, GET, POST } from '@/app/api/basefm/streams/route'

describe('/api/basefm/streams', () => {
  const mockedVerifySessionToken = verifyBasefmSessionToken as jest.Mock
  const mockedSession = getAuthSession as jest.Mock
  const mockedCommunityProgram = getCommunityProgramForUser as jest.Mock
  const mockedDjSessions = prisma.dj_sessions as unknown as {
    findFirst: jest.Mock
    findUnique: jest.Mock
    create: jest.Mock
    update: jest.Mock
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockedSession.mockResolvedValue(null)
    mockedCommunityProgram.mockResolvedValue(null)
    mockedDjSessions.findFirst.mockResolvedValue(null)
    mockedDjSessions.findUnique.mockResolvedValue(null)
    mockedDjSessions.create.mockResolvedValue({
      id: 7,
      user_id: 'anonymous',
      wallet: '0xstream',
      dj_name: 'DJ Test',
      mux_stream_id: 'mux-stream',
      playback_id: 'playback',
      started_at: new Date('2026-04-11T12:00:00.000Z'),
      max_duration: 7200,
      status: 'active',
    })
    mockedDjSessions.update.mockResolvedValue({})
    global.fetch = jest.fn()
  })

  test('blocks community-pass starts for wallets other than the claimed wallet', async () => {
    mockedSession.mockResolvedValue({
      user: { id: 'user-1', email: 'user@example.com' },
    })
    mockedCommunityProgram.mockResolvedValue({
      rewards: { walletAddress: '0xclaimed' },
      perks: [{ key: 'basefm-pass', unlocked: true }],
    })
    ;(global.fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue({ result: '0x0' }),
    })

    const request = new NextRequest('http://localhost/api/basefm/streams', {
      method: 'POST',
      body: JSON.stringify({ wallet: '0xother', name: 'DJ Test' }),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(403)
    expect(body).toMatchObject({
      error: 'Community guest pass only works with your claimed Agentbot wallet.',
      wallet: '0xclaimed',
    })
    expect(mockedDjSessions.create).not.toHaveBeenCalled()
  })

  test('checks for an active session before creating a new Mux stream', async () => {
    mockedDjSessions.findFirst.mockResolvedValue({
      id: 11,
      started_at: new Date(Date.now() - 60_000),
    })
    ;(global.fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue({ result: '0x1000000000000000000000000' }),
    })

    const request = new NextRequest('http://localhost/api/basefm/streams', {
      method: 'POST',
      body: JSON.stringify({ wallet: '0xrave', name: 'DJ Test' }),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(409)
    expect(body.error).toBe('active_session_exists')
    expect((global.fetch as jest.Mock).mock.calls).toHaveLength(1)
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe('https://mainnet.base.org')
  })

  test('requires authenticated ownership or a valid session token to inspect a stream', async () => {
    const request = new NextRequest('http://localhost/api/basefm/streams?wallet=0xany')

    const response = await GET(request)

    expect(response.status).toBe(401)
  })

  test('allows session deletion only with a valid signed baseFM session token', async () => {
    mockedVerifySessionToken.mockReturnValue({
      sessionId: 9,
      wallet: '0xowner',
      userId: null,
      exp: Math.floor(Date.now() / 1000) + 600,
    })
    mockedDjSessions.findUnique.mockResolvedValue({
      id: 9,
      user_id: 'anonymous',
      wallet: '0xowner',
      dj_name: 'DJ Test',
      playback_id: 'playback',
      started_at: new Date(Date.now() - 30_000),
      ended_at: null,
      max_duration: 7200,
      status: 'active',
    })

    const request = new NextRequest('http://localhost/api/basefm/streams?sessionToken=signed-session-token', {
      method: 'DELETE',
    })

    const response = await DELETE(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({ success: true, ended: 1 })
    expect(mockedDjSessions.update).toHaveBeenCalledWith({
      where: { id: 9 },
      data: { status: 'ended', ended_at: expect.any(Date) },
    })
  })
})
