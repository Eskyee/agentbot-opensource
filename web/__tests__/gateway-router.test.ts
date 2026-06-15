import { isAutoModel, scoreDifficulty, buildAutoLadder, stripRouteHint } from '@/app/lib/gateway-router'

describe('gateway-router', () => {
  describe('isAutoModel', () => {
    it('recognizes auto aliases', () => {
      expect(isAutoModel('auto')).toBe(true)
      expect(isAutoModel('AUTO')).toBe(true)
      expect(isAutoModel('gitlawb/auto')).toBe(true)
      expect(isAutoModel('agentbot/auto')).toBe(true)
    })
    it('rejects concrete models', () => {
      expect(isAutoModel('xiaomi/mimo-v2.5-pro')).toBe(false)
      expect(isAutoModel('')).toBe(false)
    })
  })

  describe('scoreDifficulty', () => {
    it('scores a trivial prompt low', () => {
      expect(scoreDifficulty({ messages: [{ role: 'user', content: 'hi' }] })).toBeLessThan(20)
    })
    it('scores tools + code + long context high', () => {
      const big = 'x'.repeat(80_000)
      const score = scoreDifficulty({
        messages: [{ role: 'user', content: '```ts\nfunction f(){}\n```\n' + big }],
        tools: [{ type: 'function' }],
        reasoning: { effort: 'high' },
      })
      expect(score).toBeGreaterThanOrEqual(80)
    })
  })

  describe('buildAutoLadder', () => {
    it('returns the cheapest capable model first for easy requests', () => {
      const ladder = buildAutoLadder({ messages: [{ role: 'user', content: 'hello' }] })
      expect(ladder.length).toBeGreaterThan(0)
      expect(ladder.length).toBeLessThanOrEqual(3)
      expect(ladder[0]).toContain('mimo')
    })
    it('quality priority leads with a stronger model than cost priority', () => {
      const msg = { messages: [{ role: 'user', content: 'design a system' }] }
      const cost = buildAutoLadder(msg, { priority: 'cost' })
      const quality = buildAutoLadder(msg, { priority: 'quality' })
      expect(cost[0]).not.toEqual(quality[0])
    })
    it('respects max_cost_usd by excluding pricier models', () => {
      const ladder = buildAutoLadder(
        { messages: [{ role: 'user', content: 'hello' }] },
        { max_cost_usd: 0.0000005 }, // 0.5 per 1M — only the cheapest tiers
      )
      expect(ladder.every((id) => !id.includes('claude'))).toBe(true)
    })
  })

  describe('stripRouteHint', () => {
    it('removes route and returns the hint', () => {
      const { body, hint } = stripRouteHint({ model: 'auto', route: { priority: 'cost' }, messages: [] })
      expect('route' in body).toBe(false)
      expect(hint?.priority).toBe('cost')
    })
    it('passes through bodies with no hint', () => {
      const { body, hint } = stripRouteHint({ model: 'auto', messages: [] })
      expect(hint).toBeUndefined()
      expect(body.model).toBe('auto')
    })
  })
})
