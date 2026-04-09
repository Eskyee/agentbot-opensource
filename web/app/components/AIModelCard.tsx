'use client'

import { useMemo, memo } from 'react'

const PLAN_CONFIG: Record<string, { credits: number; reasoning: number; model: string }> = {
  solo:       { credits: 20000000,  reasoning: 0,   model: 'llama3.3:latest' },
  collective: { credits: 50000000,  reasoning: 100, model: 'deepseek-r1:32b' },
  label:      { credits: 100000000, reasoning: 100, model: 'deepseek-r1:32b' },
  network:    { credits: 100000000, reasoning: 100, model: 'deepseek-r1:32b' },
}
const DEFAULT_CONFIG = { credits: 5000000, reasoning: 0, model: 'llama3.3:latest' }

export default memo(function AIModelCard({ plan }: { plan: string }) {
  const config = useMemo(() => PLAN_CONFIG[plan] ?? DEFAULT_CONFIG, [plan])

  const usedCredits = 1250000
  const usedReasoning = 12
  const creditPercent = (usedCredits / config.credits) * 100
  const reasoningPercent = config.reasoning > 0 ? (usedReasoning / config.reasoning) * 100 : 0

  return (
    <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span>🧠</span> AI Intelligence
        </h2>
        <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full uppercase font-bold">
          OpenRouter
        </span>
      </div>

      <div className="space-y-6">
        {/* Token Credits */}
        <div>
          <div className="flex justify-between text-xs text-zinc-500 mb-2">
            <span>Managed Tokens</span>
            <span>{usedCredits.toLocaleString()} / {config.credits.toLocaleString()}</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${creditPercent}%` }}
            />
          </div>
          <p className="text-[10px] text-zinc-500 mt-2 italic">
            Powered by OpenRouter. Pay-per-token, no markup.
          </p>
        </div>

        {/* Reasoning Quota (Gated) */}
        <div>
          <div className="flex justify-between text-xs text-zinc-500 mb-2">
            <span>DeepSeek R1 Reasoning</span>
            {config.reasoning === 0 ? (
              <span className="text-yellow-500">Upgrade Required</span>
            ) : (
              <span>{usedReasoning} / {config.reasoning} tasks</span>
            )}
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${config.reasoning === 0 ? 'bg-zinc-700' : 'bg-blue-500'} rounded-full transition-all duration-500`}
              style={{ width: `${reasoningPercent}%` }}
            />
          </div>
          {config.reasoning === 0 && (
            <button className="w-full mt-3 py-2 text-xs font-bold bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-600/30 transition-colors">
              Unlock Reasoning Engine →
            </button>
          )}
        </div>

        {/* Current Active Model */}
        <div className="pt-4 border-t border-zinc-800">
          <div className="text-xs text-zinc-500 mb-1 uppercase tracking-wider">Active Brain</div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <div className="text-sm font-mono text-white">
              {config.model}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})
