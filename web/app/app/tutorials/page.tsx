'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface TutorialProgress {
  status: string
  stepIndex: number
}

const TUTORIALS = [
  { key: 'deploy-first-agent', name: 'Deploy Your First Agent', icon: '🚀', desc: 'Get an AI agent running in under 2 minutes.', stepCount: 4 },
  { key: 'connect-channels', name: 'Connect Your Channels', icon: '📡', desc: 'Link Telegram, Discord, or WhatsApp.', stepCount: 3 },
  { key: 'explore-skills', name: 'Explore Agent Skills', icon: '✳', desc: 'Discover what your agent can do.', stepCount: 3 },
  { key: 'set-up-wallet', name: 'Set Up Agent Wallet', icon: '💰', desc: 'Give your agent a crypto wallet on Base.', stepCount: 3 },
  { key: 'build-workflow', name: 'Build a Workflow', icon: '⊞', desc: 'Create automated workflows.', stepCount: 4 },
]

export default function TutorialsPage() {
  const [progress, setProgress] = useState<Record<string, TutorialProgress>>({})
  const [loading, setLoading] = useState(true)
  const [expandedKey, setExpandedKey] = useState<string | null>(null)

  const fetchProgress = useCallback(async () => {
    try {
      const results = await Promise.all(
        TUTORIALS.map(async (t) => {
          const res = await fetch(`/api/operator/tutorials/${t.key}`)
          if (!res.ok) return { key: t.key, progress: { status: 'not_started', stepIndex: 0 } }
          const data = await res.json()
          return { key: t.key, progress: data.progress }
        })
      )
      const map: Record<string, TutorialProgress> = {}
      for (const r of results) {
        map[r.key] = r.progress
      }
      setProgress(map)
    } catch {
      // Silent fail — show empty progress
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProgress()
  }, [fetchProgress])

  const completedCount = Object.values(progress).filter(p => p.status === 'completed').length

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Learn</h1>
            <p className="text-zinc-400 text-sm mt-1">
              Step-by-step tutorials to master Agentbot.
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{completedCount}/{TUTORIALS.length}</div>
            <div className="text-xs text-zinc-500">completed</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-zinc-900 rounded-full mb-8">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all"
            style={{ width: `${(completedCount / TUTORIALS.length) * 100}%` }}
          />
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-zinc-900/50 rounded-xl p-5 animate-pulse">
                <div className="h-5 bg-zinc-800 rounded w-1/3 mb-2" />
                <div className="h-3 bg-zinc-800 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {TUTORIALS.map((t) => {
              const p = progress[t.key] ?? { status: 'not_started', stepIndex: 0 }
              const isComplete = p.status === 'completed'
              const isExpanded = expandedKey === t.key

              return (
                <div
                  key={t.key}
                  className={`border rounded-xl transition-all ${
                    isComplete
                      ? 'bg-green-900/10 border-green-800/30'
                      : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-600'
                  }`}
                >
                  <button
                    onClick={() => setExpandedKey(isExpanded ? null : t.key)}
                    className="w-full p-5 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{t.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{t.name}</span>
                          {isComplete && <span className="text-green-400 text-xs">Complete</span>}
                        </div>
                        <div className="text-sm text-zinc-400 mt-0.5">{t.desc}</div>
                      </div>
                      <span className="text-zinc-500 text-sm">
                        {isExpanded ? '−' : '+'}
                      </span>
                    </div>
                    {!isComplete && (
                      <div className="mt-3 h-1 bg-zinc-800 rounded-full">
                        <div
                          className="h-full bg-orange-500 rounded-full transition-all"
                          style={{ width: `${(p.stepIndex / t.stepCount) * 100}%` }}
                        />
                      </div>
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 pt-0 border-t border-zinc-800/50">
                      <div className="text-sm text-zinc-400 mt-3">
                        Progress: step {Math.min(p.stepIndex + 1, t.stepCount)} of {t.stepCount}
                      </div>
                      <div className="mt-3 flex gap-3">
                        <Link
                          href={`/app/start`}
                          className="px-4 py-1.5 text-xs bg-white text-black rounded-lg font-medium hover:bg-zinc-200 transition-colors"
                        >
                          {p.status === 'not_started' ? 'Start' : 'Continue'}
                        </Link>
                        <Link
                          href="/app/advanced"
                          className="px-4 py-1.5 text-xs border border-zinc-700 text-zinc-400 rounded-lg hover:text-white hover:border-zinc-500 transition-colors"
                        >
                          Do in Advanced Mode
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Bottom nav */}
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 px-6 py-3">
          <div className="max-w-3xl mx-auto flex justify-around text-xs text-zinc-500">
            <Link href="/app/activity" className="hover:text-white transition-colors">Activity</Link>
            <Link href="/app/templates" className="hover:text-white transition-colors">Templates</Link>
            <Link href="/app/tutorials" className="text-white font-medium">Learn</Link>
            <Link href="/app/advanced" className="hover:text-white transition-colors">Advanced</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
