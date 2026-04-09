import { Redis } from '@upstash/redis'

export type AutoBlogTrack = 'Shipping' | 'Release' | 'Field Notes' | 'Build Log'

export interface AutoBlogPost {
  slug: string
  dateLabel: string
  isoDate: string
  title: string
  excerpt: string
  tags: string[]
  track: AutoBlogTrack
  body: string[]
  createdAt: string
  publishedAt: string
}

const INDEX_KEY = 'blog:auto:index'
const POST_KEY_PREFIX = 'blog:auto:post:'
const MAX_POSTS = 30

function trimSecret(value: string | undefined) {
  return value?.replace(/\s+/g, '').trim() || ''
}

function getRedis() {
  const url = trimSecret(process.env.KV_REST_API_URL)
  const token = trimSecret(process.env.KV_REST_API_TOKEN)

  if (!url || !token) return null

  return new Redis({ url, token })
}

function sortPosts<T extends { isoDate: string }>(posts: T[]) {
  return [...posts].sort((a, b) => new Date(b.isoDate).getTime() - new Date(a.isoDate).getTime())
}

export async function listAutoBlogPosts(): Promise<AutoBlogPost[]> {
  const redis = getRedis()
  if (!redis) return []

  try {
    const posts = await redis.get<AutoBlogPost[]>(INDEX_KEY)
    if (!Array.isArray(posts)) return []
    return sortPosts(posts)
  } catch (error) {
    console.error('[AutoBlog] list error:', error)
    return []
  }
}

export async function getAutoBlogPost(slug: string): Promise<AutoBlogPost | null> {
  const redis = getRedis()
  if (!redis) return null

  try {
    const post = await redis.get<AutoBlogPost>(`${POST_KEY_PREFIX}${slug}`)
    return post || null
  } catch (error) {
    console.error('[AutoBlog] get error:', error)
    return null
  }
}

export async function upsertAutoBlogPost(post: AutoBlogPost): Promise<void> {
  const redis = getRedis()
  if (!redis) throw new Error('KV is not configured')

  const existing = await listAutoBlogPosts()
  const filtered = existing.filter((entry) => entry.slug !== post.slug)
  const updated = sortPosts([post, ...filtered]).slice(0, MAX_POSTS)

  await Promise.all([
    redis.set(`${POST_KEY_PREFIX}${post.slug}`, post),
    redis.set(INDEX_KEY, updated),
  ])
}

export function formatDateLabel(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Europe/London',
  }).format(date)
}
