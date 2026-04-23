import { cacheLife } from 'next/cache'
import { redis } from './redis'

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
const REDIS_TIMEOUT_MS = 2_000

function sortPosts<T extends { isoDate: string }>(posts: T[]) {
  return [...posts].sort((a, b) => new Date(b.isoDate).getTime() - new Date(a.isoDate).getTime())
}

/**
 * Lists automatic blog posts from the store.
 * Uses 'use cache' for native Next.js 16 edge caching.
 */
export async function listAutoBlogPosts(): Promise<AutoBlogPost[]> {
  'use cache'
  cacheLife('minutes') // Stale for 5m, revalidate 15m by default

  if (!redis) return []

  try {
    const posts = await Promise.race([
      redis.get<AutoBlogPost[]>(INDEX_KEY),
      new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), REDIS_TIMEOUT_MS)),
    ])
    return Array.isArray(posts) ? sortPosts(posts) : []
  } catch (error) {
    console.warn('[AutoBlog] list error:', error instanceof Error ? error.message : error)
    return []
  }
}

/**
 * Gets a specific automatic blog post by slug.
 * Uses 'use cache' for native Next.js 16 edge caching.
 */
export async function getAutoBlogPost(slug: string): Promise<AutoBlogPost | null> {
  'use cache'
  cacheLife('hours') // Content doesn't change often

  if (!redis) return null

  try {
    const post = await Promise.race([
      redis.get<AutoBlogPost>(`${POST_KEY_PREFIX}${slug}`),
      new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), REDIS_TIMEOUT_MS)),
    ])
    return post || null
  } catch (error) {
    console.warn('[AutoBlog] get error:', error instanceof Error ? error.message : error)
    return null
  }
}

export async function upsertAutoBlogPost(post: AutoBlogPost): Promise<void> {
  if (!redis) throw new Error('KV is not configured')

  // We can't easily invalidate 'use cache' from inside the same process without tags,
  // but for now, we just update Redis. Next.js will revalidate after cacheLife expires.
  
  const existing = await redis.get<AutoBlogPost[]>(INDEX_KEY) || []
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
