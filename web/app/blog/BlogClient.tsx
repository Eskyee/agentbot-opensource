'use client'

import { useState, useMemo, useCallback, startTransition, memo } from 'react'
import Link from 'next/link'

interface BlogPost {
  slug: string
  date: string
  title: string
  excerpt: string
  tags: string[]
}

const PAGE_SIZE = 10

const BlogPostCard = memo(function BlogPostCard({ post }: { post: BlogPost }) {
  return (
    <article className="border-t border-zinc-900 py-8 group">
      <div className="flex items-center gap-4 mb-3">
        <p className="text-[10px] uppercase tracking-widest text-zinc-600">{post.date}</p>
        <div className="flex gap-3">
          {post.tags.map((tag) => (
            <span key={tag} className="text-[10px] uppercase tracking-widest text-zinc-600">
              {tag}
            </span>
          ))}
        </div>
      </div>
      <h2 className="text-xl font-bold tracking-tighter uppercase leading-tight mb-2 group-hover:text-zinc-400 transition-colors">{post.title}</h2>
      <p className="text-zinc-400 text-sm leading-relaxed mb-3 max-w-2xl">
        {post.excerpt}
      </p>
      <Link href={`/blog/posts/${post.slug}`} className="text-zinc-400 hover:text-white text-xs uppercase tracking-widest">
        Read more
      </Link>
    </article>
  )
})

export function BlogClient({ posts }: { posts: BlogPost[] }) {
  const [page, setPage] = useState(1)

  const totalPages = Math.ceil(posts.length / PAGE_SIZE)
  const visiblePosts = useMemo(
    () => posts.slice(0, page * PAGE_SIZE),
    [posts, page]
  )

  const loadMore = useCallback(() => {
    startTransition(() => setPage(p => p + 1))
  }, [])

  const remaining = posts.length - visiblePosts.length

  return (
    <>
      <div>
        {visiblePosts.map((post) => (
          <BlogPostCard key={post.slug} post={post} />
        ))}
      </div>
      {page < totalPages && (
        <div className="border-t border-zinc-900 pt-8">
          <button
            onClick={loadMore}
            className="border border-zinc-700 hover:border-white text-xs font-bold uppercase tracking-widest px-8 py-3 transition-colors"
          >
            Load More ({remaining} remaining)
          </button>
        </div>
      )}
    </>
  )
}
