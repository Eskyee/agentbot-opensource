import { buildBasefmDistribution } from '@/app/lib/basefmDistribution'

describe('buildBasefmDistribution', () => {
  test('treats off-air with no primary DJ as stopped instead of degraded', () => {
    const distribution = buildBasefmDistribution({
      availability: 'degraded',
      primaryDj: null,
      relays: [
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
      ],
    })

    expect(distribution.origin.status).toBe('degraded')
    expect(distribution.firstParty.status).toBe('stopped')
    expect(distribution.requiredRelayStatus).toBe('healthy')
    expect(distribution.overallStatus).toBe('degraded')
  })
})
