'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { BlogPostSummary } from './blogPosts'

const trackPalette: Record<BlogPostSummary['track'], string> = {
  Shipping: 'text-orange-500 border-red-900/60 bg-red-950/30',
  Release: 'text-green-400 border-green-900/60 bg-green-950/30',
  'Field Notes': 'text-amber-300 border-amber-900/60 bg-amber-950/20',
  'Build Log': 'text-fuchsia-300 border-fuchsia-900/60 bg-fuchsia-950/20',
}

export function BlogIndexClient({ posts }: { posts: BlogPostSummary[] }) {
  const [activeTag, setActiveTag] = useState('All')

  const allTags = useMemo(
    () => ['All', ...Array.from(new Set(posts.flatMap((post) => [post.track, ...post.tags])))],
    [posts],
  )

  const filtered = useMemo(() => {
    if (activeTag === 'All') return posts
    return posts.filter((post) => post.track === activeTag || post.tags.includes(activeTag))
  }, [activeTag, posts])

  const featured = filtered[0]
  const releases = filtered.filter((post) => post.track === 'Release').slice(0, 4)
  const fieldNotes = filtered.filter((post) => post.track === 'Field Notes').slice(0, 3)
  const gridPosts = filtered.slice(1)
  const hrefFor = (post: BlogPostSummary) => post.href || `/blog/posts/${post.slug}`

  return (
    <main className="min-h-screen bg-black text-white font-mono overflow-x-hidden pt-14">

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-5 sm:px-6 py-24 sm:py-36">
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <div className="inline-block px-3 py-1 border border-orange-500/30 text-orange-500 text-[10px] uppercase tracking-widest">
              Shipping Log
            </div>
            <div className="inline-block px-3 py-1 border border-zinc-800 text-zinc-500 text-[10px] uppercase tracking-widest">
              Open Source
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-[0.9]">
            Agent <span className="text-orange-500">Blog</span>
          </h1>

          <p className="text-zinc-400 text-sm sm:text-base max-w-lg leading-relaxed">
            Product updates, release notes, launch logs, and operator field reports from Agentbot.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/documentation"
              className="border border-white bg-white px-5 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-black transition-colors hover:bg-zinc-200"
            >
              Read Docs
            </Link>
            <Link
              href="https://github.com/Eskyee/agentbot-opensource"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-zinc-700 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-400 transition-colors hover:text-white hover:border-zinc-500"
            >
              View Source
            </Link>
          </div>
        </div>
      </section>

      {/* Tags */}
      <section className="border-t border-zinc-900">
        <div className="mx-auto max-w-4xl px-5 sm:px-6 py-6">
          <div className="flex flex-wrap gap-2">

            <div className="grid gap-px bg-zinc-900">
              {[
                { label: 'Stories live', value: String(posts.length).padStart(2, '0') },
                { label: 'Release notes', value: String(posts.filter((post) => post.track === 'Release').length).padStart(2, '0') },
                { label: 'Build logs', value: String(posts.filter((post) => post.track === 'Build Log').length).padStart(2, '0') },
              ].map((stat) => (
                <div key={stat.label} className="bg-black p-5">
                  <div className="text-[10px] uppercase tracking-[0.24em] text-zinc-600">{stat.label}</div>
                  <div className="mt-2 text-3xl font-bold uppercase tracking-[-0.06em]">{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-900">
        <div className="mx-auto max-w-7xl px-5 py-4 sm:px-6">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`border px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] transition-colors ${
                  activeTag === tag
                    ? 'border-white text-white'
                    : 'border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {featured ? (
        <section className="border-b border-zinc-900">
          <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-16">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="text-[10px] uppercase tracking-[0.24em] text-zinc-600">{featured.dateLabel}</span>
              <span className={`border px-2 py-1 text-[10px] uppercase tracking-[0.22em] ${trackPalette[featured.track]}`}>
                {featured.track}
              </span>
              {featured.tags.map((tag) => (
                <span key={tag} className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                  {tag}
                </span>
              ))}
            </div>
            <Link href={hrefFor(featured)} className="group block">
              <h2 className="max-w-5xl text-3xl font-bold uppercase tracking-[-0.06em] leading-tight transition-colors group-hover:text-zinc-300 sm:text-5xl">
                {featured.title}
              </h2>
              <p className="mt-5 max-w-3xl text-sm leading-7 text-zinc-400 sm:text-base">
                {featured.excerpt}
              </p>
              <span className="mt-6 inline-block text-[10px] uppercase tracking-[0.24em] text-zinc-500 transition-colors group-hover:text-white">
                Read post
              </span>
            </Link>
          </div>
        </section>
      ) : null}

      <section>
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-16">
          <div className="grid gap-10 xl:grid-cols-[1.35fr_0.65fr]">
            <div>
              <div className="mb-6 flex items-center justify-between gap-4">
                <h3 className="text-2xl font-bold uppercase tracking-[-0.06em]">Latest posts</h3>
                <span className="text-[10px] uppercase tracking-[0.24em] text-zinc-600">
                  {gridPosts.length} entries
                </span>
              </div>
              <div className="grid grid-cols-1 gap-px bg-zinc-900 md:grid-cols-2">
                {gridPosts.map((post) => (
                  <Link
                    key={post.slug}
                    href={hrefFor(post)}
                    className="group bg-black p-6 transition-colors hover:bg-zinc-950"
                  >
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                      <span className="text-[10px] uppercase tracking-[0.22em] text-zinc-600">{post.dateLabel}</span>
                      <span className={`border px-2 py-1 text-[10px] uppercase tracking-[0.22em] ${trackPalette[post.track]}`}>
                        {post.track}
                      </span>
                    </div>
                    <h4 className="text-base font-bold uppercase tracking-[-0.05em] leading-snug transition-colors group-hover:text-zinc-200">
                      {post.title}
                    </h4>
                    <p className="mt-3 text-xs leading-6 text-zinc-500">{post.excerpt}</p>
                  </Link>
                ))}
              </div>
            </div>

            <aside className="space-y-8">
              <div className="border border-zinc-800 p-6">
                <p className="text-[10px] uppercase tracking-[0.24em] text-zinc-600">Release track</p>
                <div className="mt-5 space-y-4">
                  {releases.map((post) => (
                    <Link key={post.slug} href={hrefFor(post)} className="block border-b border-zinc-900 pb-4 last:border-b-0 last:pb-0">
                      <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-600">{post.dateLabel}</div>
                      <div className="mt-1 text-sm font-bold uppercase tracking-[-0.04em]">{post.title}</div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="border border-zinc-800 p-6">
                <p className="text-[10px] uppercase tracking-[0.24em] text-zinc-600">Field notes</p>
                <div className="mt-5 space-y-4">
                  {fieldNotes.map((post) => (
                    <Link key={post.slug} href={hrefFor(post)} className="block">
                      <div className="text-sm font-bold uppercase tracking-[-0.04em]">{post.title}</div>
                      <div className="mt-2 text-xs leading-6 text-zinc-500">{post.excerpt}</div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="border border-zinc-800 p-6">
                <p className="text-[10px] uppercase tracking-[0.24em] text-zinc-600">Follow the shipping log</p>
                <p className="mt-4 text-sm leading-7 text-zinc-400">
                  Use the blog as the public changelog, then jump into docs and showcase when you want the operator view.
                </p>
                <div className="mt-6 flex flex-col gap-3">
                  <Link href="/documentation" className="text-[10px] uppercase tracking-[0.24em] text-zinc-300 hover:text-white">
                    Open docs
                  </Link>
                  <Link href="/showcase" className="text-[10px] uppercase tracking-[0.24em] text-zinc-300 hover:text-white">
                    See live agents
                  </Link>
                  <Link href="/register" className="text-[10px] uppercase tracking-[0.24em] text-zinc-300 hover:text-white">
                    Start a free trial
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  )
}
