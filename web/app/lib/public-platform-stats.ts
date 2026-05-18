import { unstable_cache } from 'next/cache'
import { prisma } from '@/app/lib/prisma'

export interface PublicPlatformStats {
  templates: number
  totalAgents: number
  liveAgents: number
  showcaseAgents: number
  installedSkills: number
}

const PUBLIC_PLATFORM_STATS_REVALIDATE = 60
export const PUBLIC_PLATFORM_STATS_TAG = 'public-platform-stats'

/**
 * Counts only — separated so they can be cached without leaking the caller's
 * `templateCount` override into the cache key.
 */
async function fetchCounts() {
  try {
    const [totalAgents, liveAgents, showcaseAgents, installedSkills, templateCount] = await Promise.all([
      prisma.agent.count({ where: { status: { not: 'template' } } }),
      prisma.agent.count({
        where: { status: { in: ['active', 'running'] } },
      }),
      prisma.agent.count({
        where: { showcaseOptIn: true, status: { not: 'template' } },
      }),
      prisma.installedSkill.count(),
      prisma.agent.count({ where: { status: 'template' } }),
    ])
    return { totalAgents, liveAgents, showcaseAgents, installedSkills, templateCount }
  } catch (error) {
    console.error('Public platform stats error:', error)
    return { totalAgents: 0, liveAgents: 0, showcaseAgents: 0, installedSkills: 0, templateCount: 0 }
  }
}

const getCachedCounts = unstable_cache(fetchCounts, ['public-platform-stats:counts'], {
  revalidate: PUBLIC_PLATFORM_STATS_REVALIDATE,
  tags: [PUBLIC_PLATFORM_STATS_TAG],
})

/**
 * Returns aggregate platform counts shown on public marketing surfaces
 * (/marketplace, /demo, hero metrics).
 *
 * Counts are cached for {@link PUBLIC_PLATFORM_STATS_REVALIDATE} seconds via
 * `unstable_cache` so that hot pages can be served from the edge instead of
 * triggering 5x Prisma counts per request.
 *
 * The `templateCount` parameter is accepted for backwards-compatibility only —
 * the previous implementation shadowed it with the value destructured out of
 * `Promise.all`, so it was effectively ignored. We preserve that behaviour
 * here and always return the cached DB count.
 */
export async function getPublicPlatformStats(_templateCount: number): Promise<PublicPlatformStats> {
  const counts = await getCachedCounts()
  return {
    templates: counts.templateCount,
    totalAgents: counts.totalAgents,
    liveAgents: counts.liveAgents,
    showcaseAgents: counts.showcaseAgents,
    installedSkills: counts.installedSkills,
  }
}

export function formatPublicCount(value: number) {
  return new Intl.NumberFormat('en-GB').format(value)
}
