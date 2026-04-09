import type { Metadata } from 'next'
import { buildAppUrl } from '@/app/lib/app-url'
import { BlogIndexClient } from './BlogIndexClient'
import { blogPosts } from './blogPosts'
import { listAutoBlogPosts } from '@/app/lib/auto-blog'

export const metadata: Metadata = {
  title: 'Blog - Agentbot Shipping Log',
  description:
    'Product updates, OpenClaw releases, launch notes, and operator field reports from Agentbot.',
  openGraph: {
    title: 'Blog - Agentbot Shipping Log',
    description:
      'Product updates, OpenClaw releases, launch notes, and operator field reports from Agentbot.',
    url: buildAppUrl('/blog'),
  },
  alternates: {
    canonical: buildAppUrl('/blog'),
  },
}

export default async function BlogPage() {
  const autoPosts = await listAutoBlogPosts()
  const merged = [...autoPosts.map((post) => ({
    slug: post.slug,
    dateLabel: post.dateLabel,
    isoDate: post.isoDate,
    title: post.title,
    excerpt: post.excerpt,
    tags: post.tags,
    track: post.track,
    href: `/blog/updates/${post.slug}`,
  })), ...blogPosts].sort((a, b) => new Date(b.isoDate).getTime() - new Date(a.isoDate).getTime())

  return <BlogIndexClient posts={merged} />
}
