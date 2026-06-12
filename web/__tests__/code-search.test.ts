import { searchCode } from '@/app/lib/code-search'

const files = [
  {
    path: 'app/lib/rate-limit.ts',
    content: [
      'export async function checkRateLimit(ip: string) {',
      '  // token bucket per ip',
      '  const limit = LIMITS[category]',
      '  return overBudget(ip, limit)',
      '}',
    ].join('\n'),
  },
  {
    path: 'app/lib/colors.ts',
    content: ['export const palette = {', "  orange: '#EF6F2E',", "  black: '#000000',", '}'].join('\n'),
  },
]

describe('searchCode', () => {
  it('returns empty for an empty query', () => {
    expect(searchCode('', files)).toEqual([])
  })

  it('ranks the relevant file first', () => {
    const hits = searchCode('rate limit ip', files)
    expect(hits.length).toBeGreaterThan(0)
    expect(hits[0].path).toBe('app/lib/rate-limit.ts')
  })

  it('boosts on filename match', () => {
    const hits = searchCode('palette', files)
    expect(hits[0].path).toBe('app/lib/colors.ts')
  })

  it('respects the limit', () => {
    const hits = searchCode('export', files, { limit: 1 })
    expect(hits.length).toBeLessThanOrEqual(1)
  })

  it('returns line ranges and snippets', () => {
    const [hit] = searchCode('checkRateLimit', files)
    expect(hit.startLine).toBeGreaterThanOrEqual(1)
    expect(hit.endLine).toBeGreaterThanOrEqual(hit.startLine)
    expect(hit.snippet).toContain('checkRateLimit')
  })
})
