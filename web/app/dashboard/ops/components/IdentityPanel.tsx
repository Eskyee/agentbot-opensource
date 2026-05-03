'use client'

import { useState, useCallback } from 'react'

interface IdentityData {
  did: string
  algo: string
  issued: string
  lastSig: string
  guard: string
  rotation: { inDays: number; auto: boolean }
  facts: {
    count: number
    leaf: string
    lag: number
    lastCommit: string
  }
}

interface IdentityPanelProps {
  identity: IdentityData | null
  agentId?: string
}

export function IdentityPanel({ identity, agentId }: IdentityPanelProps) {
  const [copied, setCopied] = useState(false)

  const copyDID = useCallback(() => {
    if (identity?.did) {
      navigator.clipboard.writeText(identity.did).catch(() => {})
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [identity?.did])

  if (!agentId || !identity) {
    return (
      <div className="bg-zinc-950 border border-zinc-800 p-3">
        <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Identity</div>
        <div className="text-xs text-zinc-600 text-center py-4">Select an agent</div>
      </div>
    )
  }

  const truncateDID = (did: string) => {
    if (did.length <= 30) return did
    return `${did.slice(0, 16)}…${did.slice(-4)}`
  }

  return (
    <div className="bg-zinc-950 border border-zinc-800 p-3">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-3">
        Identity · {agentId}
      </div>

      {/* DID */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] text-zinc-600 shrink-0">DID</span>
        <code className="text-[10px] font-mono text-zinc-400 truncate flex-1">{truncateDID(identity.did)}</code>
        <button
          onClick={copyDID}
          className="px-1.5 py-0.5 text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {copied ? '✓' : 'copy'}
        </button>
      </div>

      {/* Crypto State */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-600 shrink-0">algo</span>
          <span className="text-[10px] font-mono text-zinc-300">{identity.algo}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-600 shrink-0">issued</span>
          <span className="text-[10px] font-mono text-zinc-300">
            {new Date(identity.issued).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-600 shrink-0">last sig</span>
          <span className="text-[10px] font-mono text-zinc-300">{identity.lastSig}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-600 shrink-0">guard</span>
          <span className="text-[10px] font-mono text-green-400">{identity.guard} ✓</span>
        </div>
      </div>

      {/* Key Rotation */}
      <div className="flex items-center gap-2 mb-3 px-2 py-1.5 bg-zinc-900/50">
        <span className="text-[10px] text-zinc-600">rotation</span>
        <span className="text-[10px] font-mono text-zinc-300">
          in {identity.rotation.inDays}d · {identity.rotation.auto ? 'auto' : 'manual'}
        </span>
      </div>

      {/* State Mirror (GitLawb) */}
      <div className="border-t border-zinc-800 pt-2">
        <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">
          State Mirror (GitLawb)
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-600 shrink-0">facts</span>
            <span className="text-[10px] font-mono text-zinc-300">{identity.facts.count.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-600 shrink-0">lag</span>
            <span className={`text-[10px] font-mono ${identity.facts.lag < 100 ? 'text-green-400' : 'text-yellow-400'}`}>
              {identity.facts.lag}ms
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-600 shrink-0">leaf</span>
            <span className="text-[10px] font-mono text-zinc-400">{identity.facts.leaf}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-600 shrink-0">commit</span>
            <span className="text-[10px] font-mono text-zinc-400">{identity.facts.lastCommit}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
