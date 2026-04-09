import { formatDateLabel } from '@/app/lib/auto-blog'

describe('auto-blog helpers', () => {
  test('formats date labels in Europe/London style', () => {
    const date = new Date('2026-04-09T08:00:00.000Z')
    expect(formatDateLabel(date)).toBe('9 Apr')
  })
})
