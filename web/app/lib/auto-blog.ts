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
const CACHE_TTL_MS = 15_000
const REDIS_TIMEOUT_MS = 2_000

let indexCache: { value: AutoBlogPost[]; expiresAt: number } | null = null
const postCache = new Map<string, { value: AutoBlogPost | null; expiresAt: number }>()

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
  const now = Date.now()
  if (indexCache && indexCache.expiresAt > now) return indexCache.value

  const redis = getRedis()
  if (!redis) return []

  try {
    const posts = await Promise.race([
      redis.get<AutoBlogPost[]>(INDEX_KEY),
      new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), REDIS_TIMEOUT_MS)),
    ])
    const sorted = Array.isArray(posts) ? sortPosts(posts) : []
    indexCache = { value: sorted, expiresAt: now + CACHE_TTL_MS }
    return sorted
  } catch (error) {
    console.warn('[AutoBlog] list error:', error instanceof Error ? error.message : error)
    if (indexCache) return indexCache.value
    indexCache = { value: [], expiresAt: now + CACHE_TTL_MS }
    return []
  }
}

export async function getAutoBlogPost(slug: string): Promise<AutoBlogPost | null> {
  const now = Date.now()
  const cached = postCache.get(slug)
  if (cached && cached.expiresAt > now) return cached.value

  const redis = getRedis()
  if (!redis) return null

  try {
    const post = await Promise.race([
      redis.get<AutoBlogPost>(`${POST_KEY_PREFIX}${slug}`),
      new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), REDIS_TIMEOUT_MS)),
    ])
    const value = post || null
    postCache.set(slug, { value, expiresAt: now + CACHE_TTL_MS })
    return value
  } catch (error) {
    console.warn('[AutoBlog] get error:', error instanceof Error ? error.message : error)
    if (cached) return cached.value
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

  indexCache = null
  postCache.delete(post.slug)
}

export function formatDateLabel(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Europe/London',
  }).format(date)
}
