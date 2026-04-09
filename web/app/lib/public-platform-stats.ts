import { prisma } from '@/app/lib/prisma'

export async function getPublicPlatformStats(templateCount: number) {
  try {
    const [totalAgents, liveAgents, showcaseAgents, installedSkills] = await Promise.all([
      prisma.agent.count(),
      prisma.agent.count({
        where: { status: { in: ['active', 'running'] } },
      }),
      prisma.agent.count({
        where: { showcaseOptIn: true },
      }),
      prisma.installedSkill.count(),
    ])

    return {
      templates: templateCount,
      totalAgents,
      liveAgents,
      showcaseAgents,
      installedSkills,
    }
  } catch (error) {
    console.error('Public platform stats error:', error)
    return {
      templates: templateCount,
      totalAgents: 0,
      liveAgents: 0,
      showcaseAgents: 0,
      installedSkills: 0,
    }
  }
}

export function formatPublicCount(value: number) {
  return new Intl.NumberFormat('en-GB').format(value)
}
