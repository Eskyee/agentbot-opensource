'use client'

import { useState, useEffect } from 'react'

interface StatsData {
  revenue: { month: string; total: string; change: string }
  bookings: { completed: number; pending: number; conversion: string }
  fans: { total: number; active: number; growth: string; segmentation: { superfans: number; casual: number; new: number } }
  streams: { monthlyListeners: number; monthlyStreams: number; growth: string }
  skills: { active: number; total: number; growth: string }
}

export function MetricsCard({ userId }: { userId?: string }) {
  const [metrics, setMetrics] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTab, setCurrentTab] = useState<'revenue' | 'bookings' | 'fans' | 'streams' | 'skills' | 'health'>('revenue')

  useEffect(() => {
    if (!userId) return
    const fetchMetrics = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/metrics/${userId}/summary`)
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setMetrics(data)
      } catch (err) {
        setError('Failed to load metrics')
      } finally {
        setLoading(false)
      }
    }
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 30000)
    return () => clearInterval(interval)
  }, [userId])

  if (!userId) {
    return (
      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 text-center text-zinc-500">
        Deploy agent first to see metrics
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 text-center">
        <div className="animate-pulse text-zinc-500">Loading metrics...</div>
      </div>
    )
  }

  if (error || !metrics) {
    return (
      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 text-center text-red-400">
        {error || 'No data available'}
      </div>
    )
  }

  const calculateHealthScore = () => {
    let score = 0
    const revenueVal = parseFloat(metrics.revenue.month.replace(/[$,]/g, ''))
    score += revenueVal > 0 ? 30 : 0
    const conv = parseFloat(metrics.bookings.conversion.replace('%', ''))
    score += conv >= 70 ? 25 : conv >= 50 ? 15 : 0
    const fanRate = metrics.fans.total > 0 ? metrics.fans.active / metrics.fans.total : 0
    score += fanRate > 0.5 ? 20 : fanRate > 0.3 ? 10 : 0
    const streamGrowth = parseFloat(metrics.streams.growth.replace(/[+%]/g, ''))
    score += streamGrowth > 0 ? 15 : 0
    score += metrics.skills.active > 0 ? 10 : 0
    return Math.min(100, score)
  }

  const healthScore = calculateHealthScore()
  const healthColor = healthScore >= 80 ? 'text-green-400' : healthScore >= 50 ? 'text-yellow-400' : 'text-red-400'
  const healthLabel = healthScore >= 80 ? 'Excellent' : healthScore >= 50 ? 'Good' : 'Needs Attention'

  const tabs = [
    { id: 'revenue', label: 'Revenue' },
    { id: 'bookings', label: 'Bookings' },
    { id: 'fans', label: 'Fans' },
    { id: 'streams', label: 'Streams' },
    { id: 'skills', label: 'Skills' },
    { id: 'health', label: 'Health' },
  ] as const

  return (
    <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
      <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2 border-b border-zinc-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
              currentTab === tab.id ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[120px]">
        {currentTab === 'revenue' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-zinc-800 rounded-xl p-4">
              <div className="text-xs text-zinc-500 mb-1">This Month</div>
              <div className="text-2xl font-bold text-green-400">{metrics.revenue.month}</div>
            </div>
            <div className="bg-zinc-800 rounded-xl p-4">
              <div className="text-xs text-zinc-500 mb-1">All Time</div>
              <div className="text-2xl font-bold text-white">{metrics.revenue.total}</div>
            </div>
            <div className="bg-zinc-800 rounded-xl p-4">
              <div className="text-xs text-zinc-500 mb-1">Growth</div>
              <div className={`text-2xl font-bold ${metrics.revenue.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                {metrics.revenue.change}
              </div>
            </div>
          </div>
        )}

        {currentTab === 'bookings' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-zinc-800 rounded-xl p-4">
              <div className="text-xs text-zinc-500 mb-1">Completed</div>
              <div className="text-2xl font-bold text-blue-400">{metrics.bookings.completed}</div>
            </div>
            <div className="bg-zinc-800 rounded-xl p-4">
              <div className="text-xs text-zinc-500 mb-1">Pending</div>
              <div className="text-2xl font-bold text-yellow-400">{metrics.bookings.pending}</div>
            </div>
            <div className="bg-zinc-800 rounded-xl p-4">
              <div className="text-xs text-zinc-500 mb-1">Conversion</div>
              <div className="text-2xl font-bold text-white">{metrics.bookings.conversion}</div>
            </div>
          </div>
        )}

        {currentTab === 'fans' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-800 rounded-xl p-4">
                <div className="text-xs text-zinc-500 mb-1">Total Fans</div>
                <div className="text-3xl font-bold text-pink-400">{metrics.fans.total.toLocaleString()}</div>
                <div className="text-xs text-zinc-500 mt-1">{metrics.fans.growth} growth</div>
              </div>
              <div className="bg-zinc-800 rounded-xl p-4">
                <div className="text-xs text-zinc-500 mb-1">Active</div>
                <div className="text-3xl font-bold text-blue-400">{metrics.fans.active.toLocaleString()}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-zinc-800 rounded-xl p-3 text-center">
                <div className="text-xs text-zinc-500">Superfans</div>
                <div className="text-lg font-bold text-blue-300">{metrics.fans.segmentation.superfans}</div>
              </div>
              <div className="bg-zinc-800 rounded-xl p-3 text-center">
                <div className="text-xs text-zinc-500">Casual</div>
                <div className="text-lg font-bold text-blue-300">{metrics.fans.segmentation.casual}</div>
              </div>
              <div className="bg-zinc-800 rounded-xl p-3 text-center">
                <div className="text-xs text-zinc-500">New</div>
                <div className="text-lg font-bold text-green-300">{metrics.fans.segmentation.new}</div>
              </div>
            </div>
          </div>
        )}

        {currentTab === 'streams' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-zinc-800 rounded-xl p-4">
              <div className="text-xs text-zinc-500 mb-1">Monthly Streams</div>
              <div className="text-2xl font-bold text-orange-400">{metrics.streams.monthlyStreams.toLocaleString()}</div>
            </div>
            <div className="bg-zinc-800 rounded-xl p-4">
              <div className="text-xs text-zinc-500 mb-1">Listeners</div>
              <div className="text-2xl font-bold text-blue-400">{metrics.streams.monthlyListeners.toLocaleString()}</div>
            </div>
            <div className="bg-zinc-800 rounded-xl p-4">
              <div className="text-xs text-zinc-500 mb-1">Growth</div>
              <div className={`text-2xl font-bold ${metrics.streams.growth.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                {metrics.streams.growth}
              </div>
            </div>
          </div>
        )}

        {currentTab === 'skills' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-800 rounded-xl p-4">
                <div className="text-xs text-zinc-500 mb-1">Active Skills</div>
                <div className="text-3xl font-bold text-blue-400">{metrics.skills.active}</div>
              </div>
              <div className="bg-zinc-800 rounded-xl p-4">
                <div className="text-xs text-zinc-500 mb-1">Total Available</div>
                <div className="text-3xl font-bold text-white">{metrics.skills.total}</div>
                <div className="text-xs text-green-400 mt-1">{metrics.skills.growth} this week</div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['Web Search', 'Setlist Oracle', 'Track Finder', 'Visual Synth'].map(skill => (
                <div key={skill} className="bg-zinc-800 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm text-zinc-300">{skill}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentTab === 'health' && (
          <div className="space-y-4">
            <div className="text-center">
              <div className={`text-6xl font-bold font-mono ${healthColor}`}>{healthScore}</div>
              <div className="text-sm text-zinc-400 mt-1">{healthLabel}</div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {[
                { label: 'Revenue', weight: '30%', active: parseFloat(metrics.revenue.month.replace(/[$,]/g, '')) > 0 },
                { label: 'Bookings', weight: '25%', active: parseFloat(metrics.bookings.conversion.replace('%', '')) >= 50 },
                { label: 'Fans', weight: '20%', active: metrics.fans.total > 0 && (metrics.fans.active / metrics.fans.total) > 0.3 },
                { label: 'Streams', weight: '15%', active: parseFloat(metrics.streams.growth.replace(/[+%]/g, '')) > 0 },
                { label: 'Skills', weight: '10%', active: metrics.skills.active > 0 },
              ].map(item => (
                <div key={item.label} className="bg-zinc-800 rounded-lg p-3 text-center">
                  <div className={`text-lg font-bold ${item.active ? 'text-green-400' : 'text-zinc-600'}`}>
                    {item.active ? '✓' : '✗'}
                  </div>
                  <div className="text-xs text-zinc-400">{item.label}</div>
                  <div className="text-xs text-zinc-600">{item.weight}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
