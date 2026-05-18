import {
  type BasefmRelayDestination,
  verifyRelayPlaybackCoverage,
} from '@/app/lib/basefmDistribution'

describe('verifyRelayPlaybackCoverage', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  test('marks basefm.space degraded when its live API does not include the current playback id', async () => {
    const relays: BasefmRelayDestination[] = [
      {
        key: 'basefm-space',
        name: 'basefm.space',
        type: 'hls-consumer',
        required: true,
        enabled: true,
        status: 'healthy',
        viewerUrl: 'https://basefm.space',
        probeUrl: 'https://basefm.space',
        note: null,
        lastHealthyAt: null,
        lastErrorAt: null,
        lastErrorMessage: null,
      },
    ]

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        streams: [
          {
            muxPlaybackId: 'stale-playback',
          },
        ],
      }),
    })

    const result = await verifyRelayPlaybackCoverage(
      {
        playbackId: 'current-playback',
        hlsUrl: 'https://stream.mux.com/current-playback.m3u8',
      },
      relays
    )

    expect(result[0]).toMatchObject({
      key: 'basefm-space',
      status: 'degraded',
      note: 'Relay live API is not serving the current Agentbot playback id.',
    })
  })

  test('keeps basefm.space healthy when its live API includes the current playback id', async () => {
    const relays: BasefmRelayDestination[] = [
      {
        key: 'basefm-space',
        name: 'basefm.space',
        type: 'hls-consumer',
        required: true,
        enabled: true,
        status: 'healthy',
        viewerUrl: 'https://basefm.space',
        probeUrl: 'https://basefm.space',
        note: null,
        lastHealthyAt: null,
        lastErrorAt: null,
        lastErrorMessage: null,
      },
    ]

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        streams: [
          {
            muxPlaybackId: 'current-playback',
          },
        ],
      }),
    })

    const result = await verifyRelayPlaybackCoverage(
      {
        playbackId: 'current-playback',
        hlsUrl: 'https://stream.mux.com/current-playback.m3u8',
      },
      relays
    )

    expect(result[0]).toMatchObject({
      key: 'basefm-space',
      status: 'healthy',
      note: null,
    })
  })
})
