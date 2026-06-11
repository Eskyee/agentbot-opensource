'use client'

import { ArrowUpRight } from 'lucide-react'

export function TokenCard() {
  return (
    <section className="border-t border-zinc-900">
      <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-20">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 sm:p-10">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Protocol Liquidity</div>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">$AGENTBOT</h3>
              <p className="text-zinc-500 text-sm mt-1">/ WETH ON BASE</p>
            </div>
            <span className="text-4xl">🦞</span>
          </div>
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-3xl font-mono font-bold">$0.0000002</span>
          </div>
          <p className="text-zinc-500 text-sm mb-6">Market Cap: $20K</p>
          <div className="flex flex-wrap gap-3 mb-6">
            <a
              href="https://app.uniswap.org/swap?outputCurrency=0x986b41c76ab8b7350079613340ee692773b34ba3&chain=base"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-orange-500 hover:bg-orange-400 text-black px-5 py-2.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors"
            >
              Buy $AGENTBOT
            </a>
            <a
              href="https://dexscreener.com/base/0x986b41c76ab8b7350079613340ee692773b34ba3"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-zinc-700 hover:border-zinc-500 text-zinc-300 px-5 py-2.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors"
            >
              View Scanner
            </a>
          </div>
          <div className="flex items-center gap-2 text-zinc-600 text-xs font-mono">
            <span>0x986b41C76aB8B7350079613340ee692773B34bA3</span>
            <button
              onClick={() => navigator.clipboard?.writeText('0x986b41C76aB8B7350079613340ee692773B34bA3')}
              className="text-zinc-500 hover:text-white transition-colors"
              title="Copy address"
            >
              📋
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
