/**
 * fast-apply unit tests — validation + fence-stripping behavior.
 * The network path (gateway merge) is exercised in integration, not here.
 */
import { fastApply, FAST_APPLY_MODEL } from '@/app/lib/fast-apply'

describe('fast-apply', () => {
  it('exposes a sane default model', () => {
    expect(FAST_APPLY_MODEL).toContain('flash')
  })

  it('rejects empty code', async () => {
    await expect(fastApply({ code: '   ', edit: 'x' })).rejects.toThrow(/empty original code|upstream/i)
  })

  it('rejects empty edit', async () => {
    await expect(fastApply({ code: 'const a = 1', edit: '   ' })).rejects.toThrow(/empty edit|upstream/i)
  })
})
