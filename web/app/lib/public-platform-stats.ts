import { prisma } from '@/app/lib/prisma'

export async function getPublicPlatformStats(templateCount: number) {
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
