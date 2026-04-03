import type { Metadata } from 'next'
import { buildAppUrl } from '@/app/lib/app-url'
import { BlogIndexClient } from './BlogIndexClient'
import { blogPosts } from './blogPosts'

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

export default function BlogPage() {
  return <BlogIndexClient posts={blogPosts} />
}
