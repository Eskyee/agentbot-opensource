import { prisma } from '@/app/lib/prisma'

export async function getPublicPlatformStats(templateCount: number) {
  try {
    const [liveAgents, showcaseAgents, installedSkills] = await Promise.all([
      prisma.agent.count({
        where: { status: { in: ['active', 'running'] } },
      }),
      prisma.agent.count({
        where: { showcaseOptIn: true, status: { in: ['active', 'running'] } },
      }),
      prisma.installedSkill.count(),
    ])

    return {
      templates: templateCount,
      liveAgents,
      showcaseAgents,
      installedSkills,
    }
  } catch (error) {
    console.error('Public platform stats error:', error)
    return {
      templates: templateCount,
      liveAgents: 0,
      showcaseAgents: 0,
      installedSkills: 0,
    }
  }
}

export function formatPublicCount(value: number) {
  return new Intl.NumberFormat('en-GB').format(value)
}
