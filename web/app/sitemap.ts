import { MetadataRoute } from 'next'
import fs from 'fs'
import path from 'path'
import { APP_URL } from '@/app/lib/app-url'
import { listAutoBlogPosts } from '@/app/lib/auto-blog'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Auto-discover blog posts from directory. Guarded: in a serverless/standalone
  // deployment the source `app/blog/posts` dir may not be present in the function
  // bundle (it's included via outputFileTracingIncludes in next.config.js). If
  // the read ever fails, fall back to no file-based blog URLs rather than 500 the
  // whole sitemap — search engines hit /sitemap.xml constantly.
  const postsDir = path.join(process.cwd(), 'app', 'blog', 'posts')
  let blogSlugs: string[] = []
  try {
    blogSlugs = fs
      .readdirSync(postsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
  } catch (err) {
    console.error('[sitemap] could not read blog posts dir:', err)
  }

  const blogUrls: MetadataRoute.Sitemap = blogSlugs.map((slug) => ({
    url: `${APP_URL}/blog/posts/${slug}`,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  const autoPosts = await listAutoBlogPosts()
  const autoBlogUrls: MetadataRoute.Sitemap = autoPosts.map((post) => ({
    url: `${APP_URL}/blog/updates/${post.slug}`,
    changeFrequency: 'daily',
    priority: 0.6,
  }))

  return [
    {
      url: `${APP_URL}/`,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${APP_URL}/pricing`,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${APP_URL}/docs`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${APP_URL}/why`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${APP_URL}/blog`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${APP_URL}/login`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${APP_URL}/signup`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${APP_URL}/terms`,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${APP_URL}/privacy`,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${APP_URL}/trust`,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    ...blogUrls,
    ...autoBlogUrls,
  ]
}
