import { probeOpenClawRuntime } from '@/app/lib/openclaw-runtime-probe'

describe('probeOpenClawRuntime', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.OPENCLAW_IMAGE = 'ghcr.io/openclaw/openclaw:2026.4.11'
    global.fetch = jest.fn()
  })

  test('does not mark the runtime unreachable when /api/status is healthy but legacy probes 404', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: jest.fn().mockResolvedValue({}),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: jest.fn().mockResolvedValue({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          configured: false,
          running: false,
          version: '2026.4.11',
          uptime: '42s',
        }),
      })

    const result = await probeOpenClawRuntime('https://runtime.example.com')

    expect(result.status).toBe('setup')
    expect(result.openclawVersion).toBe('2026.4.11')
    expect(result.reason).toBe('Runtime reachable but setup is not complete')
    expect(result.checks).toEqual([
      {
        path: '/healthz',
        ok: false,
        status: 404,
        reason: 'HTTP 404',
      },
      {
        path: '/readyz',
        ok: false,
        status: 404,
        reason: 'HTTP 404',
      },
      {
        path: '/api/status',
        ok: true,
        status: 200,
        reason: null,
      },
    ])
  })

  test('uses ffmpeg details from health payload when legacy status endpoint is unavailable', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          version: '2026.4.11',
          ffmpeg: {
            available: true,
            version: 'ffmpeg 5.1.8',
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({}),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: jest.fn().mockResolvedValue({}),
      })

    const result = await probeOpenClawRuntime('https://runtime.example.com')

    expect(result.status).toBe('healthy')
    expect(result.reason).toBe('Legacy /api/status unavailable; using /healthz and /readyz')
    expect(result.ffmpeg).toEqual({
      available: true,
      version: 'ffmpeg 5.1.8',
    })
  })
})
