'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const CATEGORIES = ['all', 'music', 'community', 'creative', 'business'] as const

const TEMPLATES = [
  { key: 'music-promoter', name: 'Music Promoter', icon: '🎵', desc: 'Promote tracks across social channels. Auto-posts, schedules drops, tracks engagement.', category: 'music', time: '2 min' },
  { key: 'community-manager', name: 'Community Manager', icon: '👥', desc: 'Monitor and engage your Telegram community. Auto-responds, moderates, summarises.', category: 'community', time: '3 min' },
  { key: 'content-creator', name: 'Content Creator', icon: '✍️', desc: 'Generate blog posts, social content, and newsletters in your brand voice.', category: 'creative', time: '2 min' },
  { key: 'crypto-analyst', name: 'Crypto Analyst', icon: '📊', desc: 'Track token prices, monitor wallets, alert on market movements. Base and Solana.', category: 'business', time: '3 min' },
  { key: 'dj-radio', name: 'DJ Radio Host', icon: '📻', desc: 'AI-powered radio on baseFM. Curates playlists, takes requests, mixes live.', category: 'music', time: '5 min' },
  { key: 'event-scout', name: 'Event Scout', icon: '🎪', desc: 'Find and curate music events, festivals, and gigs. Auto-posts listings.', category: 'community', time: '2 min' },
]

export default function TemplatesPage() {
  const router = useRouter()
  const [category, setCategory] = useState<string>('all')
  const [launching, setLaunching] = useState<string | null>(null)
  const [error, setError] = useState('')

  const filtered = category === 'all' ? TEMPLATES : TEMPLATES.filter(t => t.category === category)

  async function handleLaunch(key: string) {
    setLaunching(key)
    setError('')

    try {
      const res = await fetch(`/api/operator/templates/${key}/launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Launch failed')
        setLaunching(null)
        return
      }

      router.push('/dashboard')
    } catch {
      setError('Something went wrong')
      setLaunching(null)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Templates</h1>
            <p className="text-zinc-400 text-sm mt-1">
              Pre-built agents ready to launch. Fully editable after deployment.
            </p>
          </div>
          <Link
            href="/app/activity"
            className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            My Activity
          </Link>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 text-xs uppercase tracking-wider rounded-full whitespace-nowrap transition-colors ${
                category === cat
                  ? 'bg-white text-black'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-800 text-red-300 rounded-lg px-4 py-3 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Template grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <div
              key={t.key}
              className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-zinc-600 transition-all group"
            >
              <div className="text-3xl mb-3">{t.icon}</div>
              <h3 className="font-medium text-lg">{t.name}</h3>
              <p className="text-sm text-zinc-400 mt-2 leading-relaxed">{t.desc}</p>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800">
                <span className="text-xs text-zinc-500">~{t.time} setup</span>
                <button
                  onClick={() => handleLaunch(t.key)}
                  disabled={launching === t.key}
                  className="px-4 py-1.5 text-xs bg-white text-black rounded-lg font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
                >
                  {launching === t.key ? 'Launching...' : 'Launch'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12 text-sm text-zinc-500">
          Want more control?{' '}
          <Link href="/app/advanced" className="text-white hover:underline">
            Switch to Advanced Mode
          </Link>
        </div>

        {/* Bottom nav */}
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 px-6 py-3">
          <div className="max-w-3xl mx-auto flex justify-around text-xs text-zinc-500">
            <Link href="/app/activity" className="hover:text-white transition-colors">Activity</Link>
            <Link href="/app/templates" className="text-white font-medium">Templates</Link>
            <Link href="/app/tutorials" className="hover:text-white transition-colors">Learn</Link>
            <Link href="/app/advanced" className="hover:text-white transition-colors">Advanced</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
