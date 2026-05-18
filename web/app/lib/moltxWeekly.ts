import { Redis } from '@upstash/redis'
import { blogPosts } from '@/app/blog/blogPosts'
import { formatPublicCount, getPublicPlatformStats } from '@/app/lib/public-platform-stats'
import { checkServices } from '@/app/lib/service-health'

const MOLTX_WEEKLY_KEY_PREFIX = 'social:moltx:weekly:'

function trimSecret(value: string | undefined) {
  return value?.replace(/\s+/g, '').trim() || ''
}

function getRedis() {
  const url = trimSecret(process.env.KV_REST_API_URL)
  const token = trimSecret(process.env.KV_REST_API_TOKEN)

  if (!url || !token) return null

  return new Redis({ url, token })
}

function getLondonWeekContext() {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const parts = Object.fromEntries(
    formatter.formatToParts(now).map((part) => [part.type, part.value])
  )

  const isoDate = `${parts.year}-${parts.month}-${parts.day}`
  const londonDate = new Date(`${isoDate}T12:00:00Z`)
  const day = londonDate.getUTCDay() || 7
  londonDate.setUTCDate(londonDate.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(londonDate.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((londonDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)

  return {
    now,
    isoDate,
    weekKey: `${parts.year}-W${String(week).padStart(2, '0')}`,
  }
}

function sanitizeTitle(title: string) {
  return title
    .replace(/[^\w\s:+/&-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function limitText(value: string, max: number) {
  if (value.length <= max) return value
  return `${value.slice(0, max - 1).trimEnd()}…`
}

export async function buildMoltxWeeklyUpdate() {
  const context = getLondonWeekContext()
  const recentPosts = [...blogPosts]
    .sort((a, b) => new Date(b.isoDate).getTime() - new Date(a.isoDate).getTime())
    .slice(0, 3)

  const [stats, services] = await Promise.all([
    getPublicPlatformStats(blogPosts.length),
    checkServices(),
  ])

  const healthyCount = services.filter((service) => service.status === 'ok').length
  const highlights = recentPosts.map((post) => sanitizeTitle(post.title)).join(' • ')

  const segments = [
    `Weekly Agentbot/baseFM update`,
    `${formatPublicCount(stats.totalAgents)} deployed / ${formatPublicCount(stats.liveAgents)} live agents`,
    `${formatPublicCount(stats.installedSkills)} installed skills`,
    `${healthyCount}/${services.length} core services healthy`,
    `Shipped: ${highlights}`,
    `Community rewards, baseFM Live, and agent infra keep moving on Base + Solana`,
    `agentbot.sh #Agentbot #baseFM`,
  ]

  let content = segments.join('\n')

  if (content.length > 500) {
    const shorterHighlights = recentPosts
      .map((post) => limitText(sanitizeTitle(post.title), 42))
      .join(' • ')

    content = [
      `Weekly Agentbot/baseFM update`,
      `${formatPublicCount(stats.totalAgents)} deployed / ${formatPublicCount(stats.liveAgents)} live · ${formatPublicCount(stats.installedSkills)} skills`,
      `Shipping: ${shorterHighlights}`,
      `Community rewards + baseFM Live keep growing on Base + Solana`,
      `agentbot.sh #Agentbot #baseFM`,
    ].join('\n')
  }

  return {
    ...context,
    content: limitText(content, 500),
    stats,
    services,
    recentPosts,
  }
}

export async function getMoltxWeeklyState(weekKey: string) {
  const redis = getRedis()
  if (!redis) return null

  try {
    return await redis.get(`${MOLTX_WEEKLY_KEY_PREFIX}${weekKey}`)
  } catch (error) {
    console.error('[MoltX Weekly] get state error:', error)
    return null
  }
}

export async function setMoltxWeeklyState(weekKey: string, value: unknown) {
  const redis = getRedis()
  if (!redis) return

  try {
    await redis.set(`${MOLTX_WEEKLY_KEY_PREFIX}${weekKey}`, value)
  } catch (error) {
    console.error('[MoltX Weekly] set state error:', error)
  }
}
