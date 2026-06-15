import { bucketFor } from '@/app/lib/gateway-flywheel'

describe('gateway-flywheel', () => {
  describe('bucketFor', () => {
    it('returns low for difficulty 33', () => {
      expect(bucketFor(33)).toBe('low')
    })
    it('returns med for difficulty 34', () => {
      expect(bucketFor(34)).toBe('med')
    })
    it('returns med for difficulty 66', () => {
      expect(bucketFor(66)).toBe('med')
    })
    it('returns high for difficulty 67', () => {
      expect(bucketFor(67)).toBe('high')
    })
    it('returns low for difficulty 0', () => {
      expect(bucketFor(0)).toBe('low')
    })
    it('returns high for difficulty 100', () => {
      expect(bucketFor(100)).toBe('high')
    })
  })
})

describe('gateway-flywheel (isolated)', () => {
  let recordRouting: typeof import('@/app/lib/gateway-flywheel').recordRouting
  let applyLearnedOrder: typeof import('@/app/lib/gateway-flywheel').applyLearnedOrder
  let getFlywheelStats: typeof import('@/app/lib/gateway-flywheel').getFlywheelStats

  beforeEach(() => {
    jest.resetModules()
    // Re-import after reset to get fresh in-memory state
    const mod = require('@/app/lib/gateway-flywheel')
    recordRouting = mod.recordRouting
    applyLearnedOrder = mod.applyLearnedOrder
    getFlywheelStats = mod.getFlywheelStats
  })

  describe('applyLearnedOrder', () => {
    it('returns candidates unchanged when fewer than 2', async () => {
      const result = await applyLearnedOrder('low', ['xiaomi/mimo-v2.5-pro'])
      expect(result).toEqual(['xiaomi/mimo-v2.5-pro'])
    })

    it('returns candidates unchanged when no signal exists', async () => {
      const candidates = ['xiaomi/mimo-v2.5-pro', 'xiaomi/mimo-v2-flash']
      const result = await applyLearnedOrder('low', candidates)
      expect(result).toEqual(candidates)
    })

    it('reorders best success rate to front when signal exists', async () => {
      for (let i = 0; i < 25; i++) {
        await recordRouting({
          bucket: 'low',
          model: 'xiaomi/mimo-v2-flash',
          success: true,
          escalations: 0,
          latencyMs: 100,
        })
      }
      for (let i = 0; i < 25; i++) {
        await recordRouting({
          bucket: 'low',
          model: 'xiaomi/mimo-v2.5-pro',
          success: i < 12,
          escalations: 0,
          latencyMs: 200,
        })
      }

      const candidates = ['xiaomi/mimo-v2.5-pro', 'xiaomi/mimo-v2-flash']
      const result = await applyLearnedOrder('low', candidates)
      expect(result[0]).toBe('xiaomi/mimo-v2-flash')
    })

    it('does not reorder when all models are below MIN_SIGNAL', async () => {
      for (let i = 0; i < 5; i++) {
        await recordRouting({
          bucket: 'med',
          model: 'xiaomi/mimo-v2-flash',
          success: true,
          escalations: 0,
          latencyMs: 100,
        })
      }

      const candidates = ['xiaomi/mimo-v2.5-pro', 'xiaomi/mimo-v2-flash']
      const result = await applyLearnedOrder('med', candidates)
      expect(result).toEqual(candidates)
    })
  })

  describe('recordRouting + getFlywheelStats', () => {
    it('records routing outcomes and returns stats', async () => {
      await recordRouting({
        bucket: 'high',
        model: 'anthropic/claude-sonnet-4.5',
        success: true,
        escalations: 0,
        latencyMs: 500,
        outputTokens: 100,
      })
      await recordRouting({
        bucket: 'high',
        model: 'xiaomi/mimo-v2.5-pro',
        success: true,
        escalations: 1,
        latencyMs: 200,
        outputTokens: 50,
      })
      await recordRouting({
        bucket: 'high',
        model: 'xiaomi/mimo-v2-flash',
        success: false,
        escalations: 0,
        latencyMs: 100,
      })

      const stats = await getFlywheelStats()
      expect(stats.totalRouted).toBeGreaterThanOrEqual(3)
      expect(stats.topModels.length).toBeGreaterThanOrEqual(1)
      expect(stats.byBucket.high).toBeDefined()
      expect(stats.byBucket.high.routed).toBeGreaterThanOrEqual(3)
    })

    it('returns zero stats when no data recorded', async () => {
      const stats = await getFlywheelStats()
      expect(stats.totalRouted).toBe(0)
      expect(typeof stats.overallSuccessRate).toBe('number')
    })

    it('credits USD saved for sub-premium models but not the premium model', async () => {
      // mimo-v2.5-pro rate 1.044 vs premium 15 → (15 - 1.044) * 1000 tokens
      await recordRouting({ bucket: 'low', model: 'xiaomi/mimo-v2.5-pro', success: true, escalations: 0, latencyMs: 10, outputTokens: 1000 })
      // premium serving itself contributes no savings
      await recordRouting({ bucket: 'low', model: 'anthropic/claude-sonnet-4.5', success: true, escalations: 0, latencyMs: 10, outputTokens: 1000 })
      const stats = await getFlywheelStats()
      expect(stats.estimatedUsdSaved).toBeCloseTo(0.013956, 6)
    })

    it('does not credit savings on a failed request', async () => {
      await recordRouting({ bucket: 'low', model: 'xiaomi/mimo-v2.5-pro', success: false, escalations: 0, latencyMs: 10, outputTokens: 1000 })
      const stats = await getFlywheelStats()
      expect(stats.estimatedUsdSaved).toBe(0)
    })
  })
})
