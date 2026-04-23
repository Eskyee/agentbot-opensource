'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ActivityItem {
  id: string
  type: 'notification' | 'agent' | 'template' | 'workflow'
  title: string
  description: string
  timestamp: string
  icon: string
  href?: string
}

export default function ActivityPage() {
  const [items, setItems] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchActivity() {
      try {
        const res = await fetch('/api/operator/activity')
        const data = await res.json()
        if (res.ok) {
          setItems(data.items)
        } else {
          setError(data.error || 'Failed to load activity')
        }
      } catch {
        setError('Failed to load activity')
      } finally {
        setLoading(false)
      }
    }
    fetchActivity()
  }, [])

  function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Activity</h1>
            <p className="text-zinc-400 text-sm mt-1">
              Everything happening with your agents and workflows.
            </p>
          </div>
          <Link
            href="/app/templates"
            className="px-4 py-2 bg-zinc-900 border border-zinc-700 text-sm rounded-lg hover:border-zinc-500 transition-colors"
          >
            New Agent
          </Link>
        </div>

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-zinc-900/50 rounded-xl p-5 animate-pulse">
                <div className="h-4 bg-zinc-800 rounded w-1/3 mb-2" />
                <div className="h-3 bg-zinc-800 rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-800 text-red-300 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">📭</div>
            <h2 className="text-lg font-medium">No activity yet</h2>
            <p className="text-zinc-400 text-sm mt-2">
              Launch your first agent to see activity here.
            </p>
            <Link
              href="/app/start"
              className="inline-block mt-6 px-6 py-2 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors"
            >
              Get Started
            </Link>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors"
              >
                {item.href ? (
                  <Link href={item.href} className="block">
                    <ActivityRow item={item} timeAgo={timeAgo} />
                  </Link>
                ) : (
                  <ActivityRow item={item} timeAgo={timeAgo} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Bottom nav */}
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 px-6 py-3">
          <div className="max-w-3xl mx-auto flex justify-around text-xs text-zinc-500">
            <Link href="/app/activity" className="text-white font-medium">Activity</Link>
            <Link href="/app/templates" className="hover:text-white transition-colors">Templates</Link>
            <Link href="/app/tutorials" className="hover:text-white transition-colors">Learn</Link>
            <Link href="/app/advanced" className="hover:text-white transition-colors">Advanced</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function ActivityRow({ item, timeAgo }: { item: ActivityItem; timeAgo: (iso: string) => string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-xl mt-0.5">{item.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{item.title}</div>
        <div className="text-xs text-zinc-400 mt-0.5">{item.description}</div>
      </div>
      <span className="text-xs text-zinc-600 whitespace-nowrap">
        {timeAgo(item.timestamp)}
      </span>
    </div>
  )
}
