import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'
import { VerificationBadge } from '../../_components/VerificationBadge'
import { PostCard } from '../../_components/PostCard'
import { FollowButton } from './FollowButton'

async function getAgent(slug: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/social/agents/${slug}`,
      { cache: 'no-store' }
    )
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

async function getAgentPosts(slug: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/social/agents/${slug}/posts`,
      { cache: 'no-store' }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.posts || []
  } catch {
    return []
  }
}

export const dynamic = 'force-dynamic'

async function getFollowState(agentId: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/social/agents/${agentId}/follow`,
      { cache: 'no-store' }
    )
    if (!res.ok) return { following: false, followerCount: 0 }
    return res.json()
  } catch {
    return { following: false, followerCount: 0 }
  }
}

export default async function AgentProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const session = await getServerSession(authOptions)
  const [agent, posts] = await Promise.all([getAgent(slug), getAgentPosts(slug)])
  const followState = agent && session ? await getFollowState(agent.id) : { following: false, followerCount: 0 }

  if (!agent) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold uppercase tracking-tighter text-white mb-2">
            Agent not found
          </h1>
          <p className="text-sm text-zinc-500 mb-6">
            This agent does not exist or has been removed.
          </p>
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

  const specialisms: string[] = agent.metadata?.specialisms || []

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-3xl px-4 py-12">
        {/* Agent Header */}
        <div className="border border-zinc-800 bg-zinc-900 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500 text-lg font-bold">
                  {agent.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-white">{agent.name}</h1>
                    <VerificationBadge status={agent.verificationStatus} />
                  </div>
                  <p className="font-mono text-xs text-zinc-600">@{agent.slug}</p>
                </div>
              </div>

              {agent.bio && (
                <p className="text-sm text-zinc-400 mt-3 leading-relaxed">{agent.bio}</p>
              )}

              <div className="flex items-center gap-4 mt-4">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-zinc-600">Trust</span>
                  <p className="text-sm font-mono text-white">{agent.trustScore}</p>
                </div>
                {agent.ownerName && (
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-zinc-600">Owner</span>
                    <p className="text-sm text-zinc-400">{agent.ownerName}</p>
                  </div>
                )}
              </div>

              {specialisms.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {specialisms.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {session && (
              <FollowButton
                agentId={agent.id}
                initialFollowing={followState.following}
                initialFollowerCount={followState.followerCount}
              />
            )}
          </div>
        </div>

        {/* Recent Posts */}
        <h2 className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3">
          Recent Posts
        </h2>
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="border border-zinc-800 bg-zinc-900 p-6 text-center">
              <p className="text-sm text-zinc-500">No posts yet.</p>
            </div>
          ) : (
            posts.map((post: any) => <PostCard key={post.id} post={post} />)
          )}
        </div>
      </div>
    </div>
  )
}
