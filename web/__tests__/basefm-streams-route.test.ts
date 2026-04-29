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

jest.mock('@/app/lib/admin', () => ({
  isAdminEmail: jest.fn(),
}))

jest.mock('@/app/lib/basefmMux', () => ({
  getMuxCredentials: jest.fn(() => ({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
  })),
  retireMuxLiveStream: jest.fn(),
}))

jest.mock('@/app/lib/prisma', () => ({
  prisma: {
    dj_sessions: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    user: {
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}))

import { NextRequest } from 'next/server'
import { verifyBasefmSessionToken } from '@/app/lib/basefmSession'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { retireMuxLiveStream } from '@/app/lib/basefmMux'
import { getCommunityProgramForUser } from '@/app/lib/communityProgram'
import { isAdminEmail } from '@/app/lib/admin'
import { prisma } from '@/app/lib/prisma'
import { DELETE, GET, POST } from '@/app/api/basefm/streams/route'

describe('/api/basefm/streams', () => {
  const mockedVerifySessionToken = verifyBasefmSessionToken as jest.Mock
  const mockedSession = getAuthSession as jest.Mock
  const mockedRetireMuxLiveStream = retireMuxLiveStream as jest.Mock
  const mockedCommunityProgram = getCommunityProgramForUser as jest.Mock
  const mockedIsAdminEmail = isAdminEmail as jest.Mock
  const mockedDjSessions = prisma.dj_sessions as unknown as {
    findFirst: jest.Mock
    findMany: jest.Mock
    findUnique: jest.Mock
    create: jest.Mock
    update: jest.Mock
    updateMany: jest.Mock
  }
  const mockedUsers = prisma.user as unknown as {
    update: jest.Mock
    updateMany: jest.Mock
  }

  beforeEach(() => {
    jest.clearAllMocks()
    delete process.env.BASEFM_ARCHIVE_CREDIT_COST
    mockedDjSessions.findFirst.mockReset()
    mockedDjSessions.findMany.mockReset()
    mockedDjSessions.findUnique.mockReset()
    mockedDjSessions.create.mockReset()
    mockedDjSessions.update.mockReset()
    mockedDjSessions.updateMany.mockReset()
    mockedUsers.update.mockReset()
    mockedUsers.updateMany.mockReset()
    mockedSession.mockResolvedValue(null)
    mockedIsAdminEmail.mockReturnValue(false)
    mockedCommunityProgram.mockResolvedValue(null)
    mockedDjSessions.findFirst.mockResolvedValue(null)
    mockedDjSessions.findMany.mockResolvedValue([])
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
    mockedDjSessions.updateMany.mockResolvedValue({ count: 1 })
    mockedUsers.update.mockResolvedValue({})
    mockedUsers.updateMany.mockResolvedValue({ count: 1 })
    mockedRetireMuxLiveStream.mockResolvedValue({
      ok: true,
      streamId: 'mux-stream',
      streamDisabled: true,
      streamDeleted: true,
      preserveAssets: false,
      deletedAssetIds: [],
      retainedAssetIds: [],
      errors: [],
    })
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

  test('checks for a current live session before creating a new Mux stream', async () => {
    mockedDjSessions.findMany.mockResolvedValue([{
      id: 11,
      wallet: '0xrave',
      user_id: 'anonymous',
      dj_name: 'DJ Test',
      mux_stream_id: 'mux-stream-live',
      playback_id: 'playback-live',
      started_at: new Date(Date.now() - 60_000),
      ended_at: null,
      max_duration: 7200,
      status: 'live',
    }])
    ;(global.fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue({ result: '0x1000000000000000000000000' }),
    })

    const request = new NextRequest('http://localhost/api/basefm/streams', {
      method: 'POST',
      body: JSON.stringify({ wallet: '0xrave', name: 'DJ Test', city: 'London' }),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(409)
    expect(body.error).toBe('active_session_exists')
    expect((global.fetch as jest.Mock).mock.calls).toHaveLength(1)
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe('https://mainnet.base.org')
  })

  test('auto-ends expired current sessions before allowing a new stream', async () => {
    mockedDjSessions.findMany.mockResolvedValue([{
      id: 12,
      wallet: '0xrave',
      user_id: 'anonymous',
      dj_name: 'DJ Old',
      mux_stream_id: 'mux-stream-old',
      playback_id: 'playback-old',
      started_at: new Date(Date.now() - 8_000_000),
      ended_at: null,
      max_duration: 7200,
      status: 'live',
    }])
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({ result: '0x1000000000000000000000000' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: {
            id: 'mux-stream-new',
            stream_key: 'stream-key',
            status: 'idle',
            playback_ids: [{ id: 'playback-new' }],
            metadata: { dj_name: 'DJ Test' },
          },
        }),
      })

    const request = new NextRequest('http://localhost/api/basefm/streams', {
      method: 'POST',
      body: JSON.stringify({ wallet: '0xrave', name: 'DJ Test', city: 'London' }),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.ffmpeg.audioOnlyCommand).toContain('-i "/path/to/set.mp3"')
    expect(body.ffmpeg.playlistCommand).toContain('-f concat -safe 0 -i "/tmp/basefm-playlist.txt"')
    expect(body.ffmpeg.artworkCommand).toContain('bafybeicst263mihhveiveb4jghdta5dkrt5nphpgygsux435kn7nlabvje')
    expect(JSON.parse((global.fetch as jest.Mock).mock.calls[1][1].body).metadata.dj_city).toBe('London')
    expect(mockedDjSessions.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        metadata: expect.objectContaining({ city: 'London' }),
      }),
    })
    expect(mockedDjSessions.updateMany).toHaveBeenCalledWith({
      where: { id: { in: [12] } },
      data: { status: 'auto-ended', ended_at: expect.any(Date) },
    })
    expect(mockedRetireMuxLiveStream).toHaveBeenCalledWith('mux-stream-old', {
      preserveAssets: undefined,
    })
  })

  test('lets admins bypass the 24h cooldown for same-day stream testing', async () => {
    mockedSession.mockResolvedValue({
      user: { id: 'admin-user', email: 'admin@example.com' },
    })
    mockedIsAdminEmail.mockReturnValue(true)
    mockedDjSessions.findFirst.mockResolvedValueOnce({
      id: 30,
      wallet: '0xrave',
      user_id: 'admin-user',
      dj_name: 'DJ Previous',
      mux_stream_id: 'mux-stream-old',
      playback_id: 'playback-old',
      started_at: new Date(Date.now() - 60 * 60 * 1000),
      ended_at: new Date(Date.now() - 10 * 60 * 1000),
      max_duration: 7200,
      status: 'ended',
    })
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({ result: '0x1000000000000000000000000' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: {
            id: 'mux-stream-admin',
            stream_key: 'admin-stream-key',
            status: 'idle',
            playback_ids: [{ id: 'playback-admin' }],
            metadata: { dj_name: 'Admin Test' },
          },
        }),
      })

    const request = new NextRequest('http://localhost/api/basefm/streams', {
      method: 'POST',
      body: JSON.stringify({ wallet: '0xrave', name: 'Admin Test' }),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.stream.streamKey).toBe('admin-stream-key')
  })

  test('requires authenticated ownership or a valid session token to inspect a stream', async () => {
    const request = new NextRequest('http://localhost/api/basefm/streams?wallet=0xany')

    const response = await GET(request)

    expect(response.status).toBe(401)
  })

  test('returns the active stream control payload for a signed session token', async () => {
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
      mux_stream_id: 'mux-stream-a',
      playback_id: 'playback',
      started_at: new Date(Date.now() - 30_000),
      ended_at: null,
      max_duration: 7200,
      status: 'active',
      metadata: { accessType: 'community-pass' },
    })
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        data: {
          id: 'mux-stream-a',
          stream_key: 'stream-key-a',
          status: 'idle',
          playback_ids: [{ id: 'playback-a' }],
          metadata: { dj_name: 'DJ Test', access_type: 'community-pass' },
        },
      }),
    })

    const request = new NextRequest('http://localhost/api/basefm/streams?sessionToken=signed-session-token')
    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.active).toBe(true)
    expect(body.stream).toMatchObject({
      id: 'mux-stream-a',
      streamKey: 'stream-key-a',
      fullRtmpUrl: 'rtmp://global-live.mux.com:5222/app/stream-key-a',
      playbackId: 'playback-a',
      accessGrantedBy: 'community-pass',
    })
    expect(body.ffmpeg.audioOnlyCommand).toContain('stream-key-a')
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
    mockedDjSessions.findMany.mockResolvedValue([
      {
        id: 9,
        user_id: 'anonymous',
        wallet: '0xowner',
        dj_name: 'DJ Test',
        mux_stream_id: 'mux-stream-a',
        playback_id: 'playback',
        started_at: new Date(Date.now() - 30_000),
        ended_at: null,
        max_duration: 7200,
        status: 'active',
      },
      {
        id: 10,
        user_id: 'anonymous',
        wallet: '0xowner',
        dj_name: 'DJ Older',
        mux_stream_id: 'mux-stream-b',
        playback_id: 'playback-2',
        started_at: new Date(Date.now() - 120_000),
        ended_at: null,
        max_duration: 7200,
        status: 'live',
      },
    ])
    mockedDjSessions.updateMany.mockResolvedValueOnce({ count: 2 })

    const request = new NextRequest('http://localhost/api/basefm/streams?sessionToken=signed-session-token', {
      method: 'DELETE',
    })

    const response = await DELETE(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({ success: true, ended: 2, muxStopped: true })
    expect(mockedDjSessions.updateMany).toHaveBeenCalledWith({
      where: { id: { in: [9, 10] } },
      data: { status: 'ended', ended_at: expect.any(Date) },
    })
    expect(mockedRetireMuxLiveStream).toHaveBeenNthCalledWith(1, 'mux-stream-a', {
      preserveAssets: false,
    })
    expect(mockedRetireMuxLiveStream).toHaveBeenNthCalledWith(2, 'mux-stream-b', {
      preserveAssets: false,
    })
  })

  test('allows DJs to preserve archive assets when explicitly requested', async () => {
    process.env.BASEFM_ARCHIVE_CREDIT_COST = '25'
    mockedVerifySessionToken.mockReturnValue({
      sessionId: 9,
      wallet: '0xowner',
      userId: null,
      exp: Math.floor(Date.now() / 1000) + 600,
    })
    mockedSession.mockResolvedValue({
      user: { id: 'owner-user', email: 'owner@example.com' },
    })
    mockedDjSessions.findUnique.mockResolvedValue({
      id: 9,
      user_id: 'owner-user',
      wallet: '0xowner',
      dj_name: 'DJ Test',
      playback_id: 'playback',
      mux_stream_id: 'mux-stream-a',
      started_at: new Date(Date.now() - 30_000),
      ended_at: null,
      max_duration: 7200,
      status: 'active',
    })
    mockedDjSessions.findMany.mockResolvedValue([
      {
        id: 9,
        user_id: 'owner-user',
        wallet: '0xowner',
        dj_name: 'DJ Test',
        mux_stream_id: 'mux-stream-a',
        playback_id: 'playback',
        started_at: new Date(Date.now() - 30_000),
        ended_at: null,
        max_duration: 7200,
        status: 'active',
      },
    ])
    mockedDjSessions.updateMany.mockResolvedValueOnce({ count: 1 })
    mockedRetireMuxLiveStream.mockResolvedValueOnce({
      ok: true,
      streamId: 'mux-stream-a',
      streamDisabled: true,
      streamDeleted: true,
      preserveAssets: true,
      deletedAssetIds: [],
      retainedAssetIds: ['asset-a', 'asset-b'],
      errors: [],
    })

    const request = new NextRequest('http://localhost/api/basefm/streams?sessionToken=signed-session-token', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ archive: true }),
    })

    const response = await DELETE(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      success: true,
      archived: true,
      archiveCreditCost: 25,
      retainedAssetIds: ['asset-a', 'asset-b'],
      deletedAssetIds: [],
    })
    expect(mockedDjSessions.updateMany).toHaveBeenCalledWith({
      where: { id: { in: [9] } },
      data: { status: 'archived', ended_at: expect.any(Date) },
    })
    expect(mockedRetireMuxLiveStream).toHaveBeenCalledWith('mux-stream-a', {
      preserveAssets: true,
    })
    expect(mockedUsers.updateMany).toHaveBeenCalledWith({
      where: { id: 'owner-user', referralCredits: { gte: 25 } },
      data: { referralCredits: { decrement: 25 } },
    })
  })

  test('fails archive closed when archive pricing is not configured', async () => {
    mockedVerifySessionToken.mockReturnValue({
      sessionId: 9,
      wallet: '0xowner',
      userId: null,
      exp: Math.floor(Date.now() / 1000) + 600,
    })
    mockedSession.mockResolvedValue({
      user: { id: 'owner-user', email: 'owner@example.com' },
    })
    mockedDjSessions.findUnique.mockResolvedValue({
      id: 9,
      user_id: 'owner-user',
      wallet: '0xowner',
      dj_name: 'DJ Test',
      playback_id: 'playback',
      mux_stream_id: 'mux-stream-a',
      started_at: new Date(Date.now() - 30_000),
      ended_at: null,
      max_duration: 7200,
      status: 'active',
    })

    const request = new NextRequest('http://localhost/api/basefm/streams?sessionToken=signed-session-token', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ archive: true }),
    })

    const response = await DELETE(request)
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body.error).toBe('Archive is temporarily unavailable until BASEFM archive pricing is configured.')
    expect(mockedUsers.updateMany).not.toHaveBeenCalled()
    expect(mockedRetireMuxLiveStream).not.toHaveBeenCalled()
  })
})
