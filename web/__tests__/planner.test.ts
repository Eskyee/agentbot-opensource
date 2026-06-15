import { PLANNER_MODEL, planGoal } from '@/app/lib/planner'

describe('planner', () => {
  it('exposes a default model', () => {
    expect(PLANNER_MODEL).toContain('mimo')
  })

  it('throws clearly when no upstream is configured', async () => {
    // In the test env there are no gateway keys, so this fails fast rather than
    // hanging on a network call — confirms the no-config guard path.
    await expect(planGoal('Build a thing with several steps')).rejects.toThrow(
      /no gateway upstream|all upstreams failed/i,
    )
  })
})
