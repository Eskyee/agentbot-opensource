import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { blogPosts } from '../blogPosts'

type Params = Promise<{ slug: string }>

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const post = blogPosts.find((p) => p.slug === slug)
  if (!post) return {}

  return {
    title: `${post.title} | Agentbot Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
    },
  }
}

export default async function BlogPostPage({ params }: { params: Params }) {
  const { slug } = await params

  // Try to import the post content from the posts directory
  try {
    const mod = await import(`../posts/${slug}/page`)
    const PostComponent = mod.default
    return <PostComponent />
  } catch {
    notFound()
  }
}
