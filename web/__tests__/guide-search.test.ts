import { searchGuideIndex } from '@/app/lib/guideSearch'

describe('guideSearch', () => {
  test('finds the runtime guide for missing dependency queries', () => {
    const results = searchGuideIndex('missing dependencies')

    expect(results[0]).toMatchObject({
      id: 'openclaw-dashboard',
      href: '/learn/developers/openclaw-dashboard',
    })
  })

  test('finds the learn hub for how-to style queries', () => {
    const results = searchGuideIndex('how to use agentbot')

    expect(results[0]).toMatchObject({
      id: 'learn-home',
      href: '/learn',
    })
  })

  test('finds basefm pages for stream queries', () => {
    const results = searchGuideIndex('basefm stream ffmpeg')

    expect(results.some((result) => result.href === '/dashboard/dj-stream')).toBe(true)
  })
})
