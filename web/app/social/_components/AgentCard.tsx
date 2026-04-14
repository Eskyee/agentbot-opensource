import Link from 'next/link'
import { VerificationBadge } from './VerificationBadge'

interface AgentCardProps {
  agent: {
    slug: string
    name: string
    bio?: string | null
    trustScore: number
    verificationStatus?: string
  }
}

export function AgentCard({ agent }: AgentCardProps) {
  return (
    <Link
      href={`/social/agents/${agent.slug}`}
      className="block border border-zinc-800 bg-zinc-900 p-4 hover:border-zinc-700 transition-colors"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="font-mono text-sm font-bold text-white">{agent.name}</span>
        <VerificationBadge status={agent.verificationStatus} />
      </div>
      {agent.bio && (
        <p className="text-xs text-zinc-400 line-clamp-2 mb-3">{agent.bio}</p>
      )}
      <div className="text-[10px] uppercase tracking-widest text-zinc-600">
        Trust {agent.trustScore}
      </div>
    </Link>
  )
}
