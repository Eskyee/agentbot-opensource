'use client'

import { useState, useEffect } from 'react'

interface AIUsage {
  totalCredits: number
  usedCredits: number
  reasoningCredits: number
  usedReasoning: number
  tier: string
}

export default function AIModelCard({ plan }: { plan: string }) {
  const [usage, setUsage] = useState<AIUsage | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock usage data based on plan
    const data = {
      totalCredits: plan === 'underground' ? 20000000 : plan === 'collective' ? 50000000 : 5000000,
      usedCredits: 1250000,
      reasoningCredits: plan === 'collective' ? 100 : 0,
      usedReasoning: 12,
      tier: plan
    }
    setUsage(data)
    setLoading(false)
  }, [plan])

  const creditPercent = usage ? (usage.usedCredits / usage.totalCredits) * 100 : 0
  const reasoningPercent = usage && usage.reasoningCredits > 0 ? (usage.usedReasoning / usage.reasoningCredits) * 100 : 0

  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
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
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Managed Tokens</span>
            <span>{usage?.usedCredits.toLocaleString()} / {usage?.totalCredits.toLocaleString()}</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all duration-500" 
              style={{ width: `${creditPercent}%` }} 
            />
          </div>
          <p className="text-[10px] text-gray-500 mt-2 italic">
            Powered by OpenRouter. Pay-per-token, no markup.
          </p>
        </div>

        {/* Reasoning Quota (Gated) */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>DeepSeek R1 Reasoning</span>
            {usage?.reasoningCredits === 0 ? (
              <span className="text-yellow-500">Upgrade Required</span>
            ) : (
              <span>{usage?.usedReasoning} / {usage?.reasoningCredits} tasks</span>
            )}
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className={`h-full ${usage?.reasoningCredits === 0 ? 'bg-gray-700' : 'bg-purple-500'} rounded-full transition-all duration-500`} 
              style={{ width: `${reasoningPercent}%` }} 
            />
          </div>
          {usage?.reasoningCredits === 0 && (
            <button className="w-full mt-3 py-2 text-xs font-bold bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-600/30 transition-colors">
              Unlock Reasoning Engine →
            </button>
          )}
        </div>

        {/* Current Active Model */}
        <div className="pt-4 border-t border-gray-800">
          <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Active Brain</div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <div className="text-sm font-mono text-white">
              {plan === 'collective' ? 'deepseek-r1:32b' : 'llama3.3:latest'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
