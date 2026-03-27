'use client'

import { useState, useEffect } from 'react'

interface StatsData {
  revenue: { month: string; total: string; change: string }
  bookings: { completed: number; pending: number; conversion: string }
  fans: { total: number; active: number; growth: string; segmentation: { superfans: number; casual: number; new: number } }
  streams: { monthlyListeners: number; monthlyStreams: number; growth: string }
  skills: { active: number; total: number; growth: string }
}

export function MusicMetrics({ userId }: { userId: string }) {
  const [metrics, setMetrics] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'revenue' | 'bookings' | 'fans' | 'streams' | 'skills'>('revenue')

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch(`/api/metrics/${userId}/summary`)
        const data = await res.json()
        setMetrics(data)
      } catch (e) {
        console.error('Failed to fetch metrics:', e)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, 30000)
    return () => clearInterval(interval)
  }, [userId])

  const tabs = [
    { id: 'revenue', label: 'Revenue', icon: '💰' },
    { id: 'bookings', label: 'Bookings', icon: '📅' },
    { id: 'fans', label: 'Fans', icon: '👥' },
    { id: 'streams', label: 'Streams', icon: '🌊' },
    { id: 'skills', label: 'Skills', icon: '🎛️' },
  ]

  if (!metrics) return <div className="text-zinc-500 text-center py-8">Loading metrics...</div>

  return (
    <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
              activeTab === tab.id ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {activeTab === 'revenue' && (
          <div>
            <h3 className="text-sm text-zinc-400 mb-2">Monthly Revenue</h3>
            <div className="text-4xl font-bold text-green-400">{metrics.revenue.month}</div>
            <div className="text-sm text-zinc-500 mt-1">Total: {metrics.revenue.total} ({metrics.revenue.change})</div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-zinc-500">Completed</div>
              <div className="text-2xl font-bold text-blue-400">{metrics.bookings.completed}</div>
            </div>
            <div>
              <div className="text-sm text-zinc-500">Pending</div>
              <div className="text-2xl font-bold text-yellow-400">{metrics.bookings.pending}</div>
            </div>
            <div>
              <div className="text-sm text-zinc-500">Conversion</div>
              <div className="text-2xl font-bold text-white">{metrics.bookings.conversion}</div>
            </div>
          </div>
        )}

        {activeTab === 'fans' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-zinc-500">Total Fans</div>
              <div className="text-3xl font-bold text-pink-400">{metrics.fans.total.toLocaleString()}</div>
              <div className="text-xs text-zinc-500">{metrics.fans.growth} growth</div>
            </div>
            <div>
              <div className="text-sm text-zinc-500">Active</div>
              <div className="text-3xl font-bold text-blue-400">{metrics.fans.active.toLocaleString()}</div>
            </div>
          </div>
        )}

        {activeTab === 'streams' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-zinc-500">Monthly Streams</div>
              <div className="text-3xl font-bold text-orange-400">{metrics.streams.monthlyStreams.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-zinc-500">Listeners</div>
              <div className="text-3xl font-bold text-blue-400">{metrics.streams.monthlyListeners.toLocaleString()}</div>
              <div className="text-xs text-zinc-500">{metrics.streams.growth}</div>
            </div>
          </div>
        )}

        {activeTab === 'skills' && (
          <div>
            <div className="text-sm text-zinc-500">Active Skills</div>
            <div className="text-3xl font-bold text-blue-400">{metrics.skills.active} / {metrics.skills.total}</div>
            <div className="text-xs text-zinc-500">{metrics.skills.growth} this week</div>
          </div>
        )}
      </div>
    </div>
  )
}
