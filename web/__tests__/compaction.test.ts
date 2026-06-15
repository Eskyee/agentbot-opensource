/**
 * compaction unit tests — the no-op path (nothing old enough) needs no network.
 */
import { compactMessages, COMPACTION_MODEL } from '@/app/lib/compaction'

describe('compaction', () => {
  it('uses a fast default model', () => {
    expect(COMPACTION_MODEL).toContain('flash')
  })

  it('is a no-op when everything fits within keepRecent', async () => {
    const messages = [
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hello' },
    ]
    const result = await compactMessages({ messages, keepRecent: 6 })
    expect(result.compactedCount).toBe(0)
    expect(result.messages).toEqual(messages)
    expect(result.tokensAfter).toBe(result.tokensBefore)
    expect(result.provider).toBe('none')
  })
})
