'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCustomSession } from '@/app/lib/useCustomSession'

const STEPS = ['welcome', 'choose-template', 'configure', 'launch'] as const
type Step = (typeof STEPS)[number]

const TEMPLATES = [
  { key: 'music-promoter', name: 'Music Promoter', icon: '🎵', desc: 'Promote tracks across social channels', time: '2 min' },
  { key: 'community-manager', name: 'Community Manager', icon: '👥', desc: 'Monitor and engage your community', time: '3 min' },
  { key: 'content-creator', name: 'Content Creator', icon: '✍️', desc: 'Generate blog posts and social content', time: '2 min' },
  { key: 'crypto-analyst', name: 'Crypto Analyst', icon: '📊', desc: 'Track prices and market movements', time: '3 min' },
  { key: 'dj-radio', name: 'DJ Radio Host', icon: '📻', desc: 'AI-powered radio on baseFM', time: '5 min' },
  { key: 'event-scout', name: 'Event Scout', icon: '🎪', desc: 'Find and curate music events', time: '2 min' },
]

export default function StartPage() {
  const router = useRouter()
  const { data: session } = useCustomSession()
  const [step, setStep] = useState<Step>('welcome')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [agentName, setAgentName] = useState('')
  const [launching, setLaunching] = useState(false)
  const [error, setError] = useState('')

  async function handleLaunch() {
    if (!selectedTemplate) return
    setLaunching(true)
    setError('')

    try {
      const res = await fetch(`/api/operator/templates/${selectedTemplate}/launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentName: agentName || undefined }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Launch failed')
        setLaunching(false)
        return
      }

      // Mark onboarding complete (fire-and-forget — non-critical side-effect)
      fetch('/api/operator/complete-onboarding', { method: 'POST' }).catch(() => {})

      // Redirect to dashboard
      router.push('/dashboard')
    } catch {
      setError('Something went wrong. Please try again.')
      setLaunching(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-zinc-900 z-50">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
          style={{ width: `${((STEPS.indexOf(step) + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      <div className="max-w-3xl mx-auto px-6 py-20">
        {/* Step: Welcome */}
        {step === 'welcome' && (
          <div className="text-center space-y-8 animate-in fade-in duration-500">
            <div className="text-6xl">◈</div>
            <h1 className="text-4xl font-bold tracking-tight">
              Welcome to Agentbot
            </h1>
            <p className="text-lg text-zinc-400 max-w-lg mx-auto">
              Deploy an AI agent in minutes. Pick a template, configure it, and launch.
              No code required.
            </p>
            {session?.user?.name && (
              <p className="text-zinc-500">
                Signed in as <span className="text-white">{session.user.name}</span>
              </p>
            )}
            <div className="flex gap-4 justify-center pt-4">
              <button
                onClick={() => setStep('choose-template')}
                className="px-8 py-3 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors"
              >
                Get Started
              </button>
              <Link
                href="/app/advanced"
                className="px-8 py-3 border border-zinc-700 text-zinc-400 rounded-lg hover:text-white hover:border-zinc-500 transition-colors"
              >
                Skip to Advanced
              </Link>
            </div>
          </div>
        )}

        {/* Step: Choose Template */}
        {step === 'choose-template' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div>
              <h2 className="text-2xl font-bold">Choose a Template</h2>
              <p className="text-zinc-400 mt-2">
                Pick a starter template. You can customise everything later.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {TEMPLATES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setSelectedTemplate(t.key)}
                  className={`text-left p-5 rounded-xl border transition-all ${
                    selectedTemplate === t.key
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-zinc-800 hover:border-zinc-600 bg-zinc-900/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{t.icon}</span>
                    <div>
                      <div className="font-medium">{t.name}</div>
                      <div className="text-sm text-zinc-400 mt-1">{t.desc}</div>
                      <div className="text-xs text-zinc-500 mt-2">~{t.time} setup</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-4 pt-4">
              <button
                onClick={() => setStep('welcome')}
                className="px-6 py-2 text-zinc-400 hover:text-white transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => selectedTemplate && setStep('configure')}
                disabled={!selectedTemplate}
                className="px-8 py-3 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step: Configure */}
        {step === 'configure' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div>
              <h2 className="text-2xl font-bold">Configure Your Agent</h2>
              <p className="text-zinc-400 mt-2">
                Give your agent a name. Everything else is pre-configured — you can change it later.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Agent Name</label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder={`My ${TEMPLATES.find(t => t.key === selectedTemplate)?.name ?? 'Agent'}`}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                <h3 className="text-sm font-medium text-zinc-300 mb-3">What will be created:</h3>
                <ul className="space-y-2 text-sm text-zinc-400">
                  <li className="flex items-center gap-2">
                    <span className="text-purple-400">◈</span> An AI agent powered by MiMo-V2-Pro
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-400">⊞</span> An automated workflow with pre-configured triggers
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✳</span> Skills: web search, social posting, and more
                  </li>
                </ul>
                <p className="text-xs text-zinc-500 mt-3">
                  All fully editable from Advanced Mode after launch.
                </p>
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button
                onClick={() => setStep('choose-template')}
                className="px-6 py-2 text-zinc-400 hover:text-white transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep('launch')}
                className="px-8 py-3 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors"
              >
                Review & Launch
              </button>
            </div>
          </div>
        )}

        {/* Step: Launch */}
        {step === 'launch' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="text-center">
              <div className="text-5xl mb-4">
                {TEMPLATES.find(t => t.key === selectedTemplate)?.icon ?? '◈'}
              </div>
              <h2 className="text-2xl font-bold">
                Ready to launch {agentName || TEMPLATES.find(t => t.key === selectedTemplate)?.name}
              </h2>
              <p className="text-zinc-400 mt-2">
                Your agent will be created and start running immediately.
              </p>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-800 text-red-300 rounded-lg px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-4 justify-center pt-4">
              <button
                onClick={() => setStep('configure')}
                disabled={launching}
                className="px-6 py-2 text-zinc-400 hover:text-white transition-colors disabled:opacity-30"
              >
                Back
              </button>
              <button
                onClick={handleLaunch}
                disabled={launching}
                className="px-10 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:from-purple-500 hover:to-blue-500 transition-all disabled:opacity-50"
              >
                {launching ? 'Launching...' : 'Launch Agent'}
              </button>
            </div>

            <p className="text-center text-xs text-zinc-600">
              Powered by OpenClaw runtime
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
