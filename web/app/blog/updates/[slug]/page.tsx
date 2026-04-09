import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { buildAppUrl } from '@/app/lib/app-url'
import { getAutoBlogPost, listAutoBlogPosts } from '@/app/lib/auto-blog'

type Params = Promise<{ slug: string }>

export async function generateStaticParams() {
  const posts = await listAutoBlogPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const post = await getAutoBlogPost(slug)
  if (!post) return {}

  return {
    title: `${post.title} - Agentbot`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: buildAppUrl(`/blog/updates/${slug}`),
    },
  }
}

export default async function AutoBlogPostPage({ params }: { params: Params }) {
  const { slug } = await params
  const post = await getAutoBlogPost(slug)
  if (!post) notFound()

  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <article className="max-w-3xl mx-auto px-6 py-16">
        <header className="mb-12">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">{post.isoDate}</div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tighter uppercase mb-6">
            {post.title}
          </h1>
          <div className="flex gap-2 flex-wrap">
            {post.tags.map((tag) => (
              <span key={tag} className="bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded">
                {tag}
              </span>
            ))}
          </div>
        </header>

        <div className="prose prose-invert prose-zinc max-w-none">
          {post.body.map((paragraph) => (
            <p key={paragraph} className="text-zinc-300 leading-7">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-800">
          <Link href="/blog" className="text-zinc-500 hover:text-white text-sm">
            ← Back to Blog
          </Link>
        </div>
      </article>
    </main>
  )
}
