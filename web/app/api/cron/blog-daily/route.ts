import { NextRequest, NextResponse } from 'next/server'
import { checkServices } from '@/app/lib/service-health'
import { getPublicPlatformStats } from '@/app/lib/public-platform-stats'
import { blogPosts } from '@/app/blog/blogPosts'
import { formatDateLabel, getAutoBlogPost, upsertAutoBlogPost, type AutoBlogPost } from '@/app/lib/auto-blog'

function getLondonNow() {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  })

  const parts = Object.fromEntries(
    formatter.formatToParts(now).map((part) => [part.type, part.value])
  )

  const isoDate = `${parts.year}-${parts.month}-${parts.day}`
  const hour = Number(parts.hour)
  return { now, isoDate, hour }
}

function buildPost(input: {
  isoDate: string
  dateLabel: string
  serviceSummary: string
  statsSummary: string
  services: Awaited<ReturnType<typeof checkServices>>
}): AutoBlogPost {
  const unhealthy = input.services.filter((service) => service.status !== 'ok')
  const healthLine = unhealthy.length === 0
    ? 'All tracked public services responded normally during today’s publishing run.'
    : `There were ${unhealthy.length} degraded services during the publishing run: ${unhealthy.map((service) => `${service.name} (${service.detail || service.status})`).join(', ')}.`

  return {
    slug: `daily-ops-${input.isoDate}`,
    dateLabel: input.dateLabel,
    isoDate: input.isoDate,
    title: `Daily Ops Brief — ${input.isoDate}`,
    excerpt: `${input.serviceSummary} ${input.statsSummary}`,
    tags: ['Daily Ops', 'Automation', 'Build Log'],
    track: 'Build Log',
    body: [
      `This is the automated daily operations brief for ${input.isoDate}.`,
      input.serviceSummary,
      input.statsSummary,
      healthLine,
      'This post is generated from the live public platform status surfaces and is meant to keep the blog moving daily at 9am London time.',
    ],
    createdAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
  }
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  const force = request.nextUrl.searchParams.get('force') === '1'

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { isoDate, hour } = getLondonNow()
  if (!force && hour !== 9) {
    return NextResponse.json({
      skipped: true,
      reason: 'outside_publish_window',
      targetHour: 9,
      timezone: 'Europe/London',
      isoDate,
    })
  }

  const existing = await getAutoBlogPost(`daily-ops-${isoDate}`)
  if (existing) {
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: 'already_published',
      slug: existing.slug,
    })
  }

  const [services, stats] = await Promise.all([
    checkServices(),
    getPublicPlatformStats(blogPosts.length),
  ])

  const healthyCount = services.filter((service) => service.status === 'ok').length
  const serviceSummary = `${healthyCount}/${services.length} tracked services reported healthy at publish time.`
  const statsSummary = `Public counts currently show ${stats.totalAgents} agents, ${stats.liveAgents} live agents, and ${stats.showcaseAgents} showcase entries.`
  const post = buildPost({
    isoDate,
    dateLabel: formatDateLabel(new Date()),
    serviceSummary,
    statsSummary,
    services,
  })

  await upsertAutoBlogPost(post)

  return NextResponse.json({
    success: true,
    slug: post.slug,
    publishedAt: post.publishedAt,
  })
}

export const dynamic = 'force-dynamic'
