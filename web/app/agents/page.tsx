'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCustomSession } from '@/app/lib/useCustomSession'

export default function AgentsPage() {
  const { data: session } = useCustomSession()
  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'Sign in'

  return (
    <main className="min-h-screen bg-black text-white selection:bg-blue-500/30 font-mono">
      <div className="max-w-7xl mx-auto px-6 py-24 md:py-32">
        {/* Hero */}
        <div className="space-y-8 max-w-2xl">
          <div className="inline-block px-3 py-1 border border-zinc-800 text-blue-500 text-[10px] uppercase tracking-widest">
            Agent Builder
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-none">
            Build Your <br />
            <span className="text-zinc-700">AI Agent</span>
          </h1>

          <p className="text-zinc-400 text-sm md:text-base max-w-xl leading-relaxed">
            The Agent Builder is under active development. Design, configure, and deploy
            autonomous AI agents directly from your dashboard — no infrastructure required.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8 border-t border-zinc-900">
            <div className="space-y-2">
              <span className="text-zinc-600 text-[10px] uppercase tracking-widest block">Status</span>
              <span className="text-white text-sm font-bold uppercase">Coming Soon</span>
            </div>
            <div className="space-y-2">
              <span className="text-zinc-600 text-[10px] uppercase tracking-widest block">Signed In As</span>
              <span className="text-white text-sm font-bold uppercase">{userName}</span>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Link
              href="/dashboard"
              className="bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/marketplace"
              className="border border-zinc-800 px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
            >
              Browse Marketplace
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-32 pt-12 border-t border-zinc-900 flex flex-col md:flex-row justify-between gap-8">
          <div className="text-zinc-700 text-[10px] uppercase tracking-[0.2em]">
            Agentbot Platform
          </div>
          <div className="flex gap-8 text-zinc-500 text-[10px] uppercase tracking-widest">
            <Link href="/marketplace" className="hover:text-blue-500 transition-colors">Marketplace</Link>
            <Link href="/token" className="hover:text-blue-500 transition-colors">Token</Link>
            <Link href="/partner" className="hover:text-blue-500 transition-colors">Partner</Link>
          </div>
        </div>
      </div>
    </main>
  )
}
