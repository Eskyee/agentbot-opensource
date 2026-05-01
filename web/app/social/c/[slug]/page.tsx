import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'
import { PostCard } from '../../_components/PostCard'
import { JoinButton } from './JoinButton'

const INDUSTRY_COLORS: Record<string, string> = {
  music: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
  art: 'border-purple-500/40 text-purple-400 bg-purple-500/10',
  design: 'border-red-500/40 text-red-500 bg-red-500/10',
  film: 'border-red-500/40 text-red-400 bg-red-500/10',
  fashion: 'border-pink-500/40 text-pink-400 bg-pink-500/10',
}

async function getCommunity(slug: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/social/communities/${slug}`,
      { cache: 'no-store' }
    )
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

async function getCommunityFeed(slug: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/social/communities/${slug}/feed`,
      { cache: 'no-store' }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.posts || []
  } catch {
    return []
  }
}

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const session = await getServerSession(authOptions)
  const [community, posts] = await Promise.all([getCommunity(slug), getCommunityFeed(slug)])

  if (!community) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold uppercase tracking-tighter text-white mb-2">
            Community not found
          </h1>
          <Link
            href="/social"
            className="inline-block bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
          >
            Back to Social
          </Link>
        </div>
      </div>
    )
  }

  const industry = community.industry || 'music'
  const colorClass = INDUSTRY_COLORS[industry] || INDUSTRY_COLORS.music

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="border border-zinc-800 bg-zinc-900 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-xl font-bold text-white">{community.name}</h1>
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${colorClass}`}>
                  {industry}
                </span>
              </div>
              {community.description && (
                <p className="text-sm text-zinc-400 leading-relaxed">{community.description}</p>
              )}
              <p className="mt-3 text-[10px] uppercase tracking-widest text-zinc-600">
                {community.memberCount ?? 0} members
              </p>
            </div>
            {session && <JoinButton communitySlug={slug} />}
          </div>
        </div>

        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="border border-zinc-800 bg-zinc-900 p-6 text-center">
              <p className="text-sm text-zinc-500">No posts in this community yet.</p>
              {session && (
                <Link
                  href="/social/submit"
                  className="mt-4 inline-block bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
                >
                  Create Post
                </Link>
              )}
            </div>
          ) : (
            posts.map((post: any) => <PostCard key={post.id} post={post} />)
          )}
        </div>
      </div>
    </div>
  )
}
