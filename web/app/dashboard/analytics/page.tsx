'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

interface AnalyticsData {
  overview: { totalRevenue: string; totalBookings: number; totalFans: number; totalStreams: number }
  monthly: { month: string; revenue: number; bookings: number; fans: number; streams: number }[]
  topSkills: { name: string; usage: number; success: number }[]
  channels: { name: string; messages: number; engagement: string }[]
}

const mockAnalytics: AnalyticsData = {
  overview: { totalRevenue: '$0.00', totalBookings: 0, totalFans: 0, totalStreams: 0 },
  monthly: [
    { month: 'Oct', revenue: 0, bookings: 0, fans: 0, streams: 0 },
    { month: 'Nov', revenue: 0, bookings: 0, fans: 0, streams: 0 },
    { month: 'Dec', revenue: 0, bookings: 0, fans: 0, streams: 0 },
    { month: 'Jan', revenue: 0, bookings: 0, fans: 0, streams: 0 },
    { month: 'Feb', revenue: 0, bookings: 0, fans: 0, streams: 0 },
    { month: 'Mar', revenue: 0, bookings: 0, fans: 0, streams: 0 },
  ],
  topSkills: [
    { name: 'Web Search', usage: 0, success: 0 },
    { name: 'Setlist Oracle', usage: 0, success: 0 },
    { name: 'Visual Synthesizer', usage: 0, success: 0 },
    { name: 'Groupie Manager', usage: 0, success: 0 },
  ],
  channels: [
    { name: 'Telegram', messages: 0, engagement: '0%' },
    { name: 'WhatsApp', messages: 0, engagement: '0%' },
    { name: 'Discord', messages: 0, engagement: '0%' },
    { name: 'Email', messages: 0, engagement: '0%' },
  ]
}

export default function AnalyticsPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<AnalyticsData>(mockAnalytics)
  const [timeRange, setTimeRange] = useState('6m')

  useEffect(() => {
    const storedData = localStorage.getItem('agentbot_instance')
    if (!storedData) return
    const { userId } = JSON.parse(storedData)
    
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/metrics/${userId}/summary`)
        if (res.ok) {
          const summary = await res.json()
          setData(prev => ({
            ...prev,
            overview: {
              totalRevenue: summary.revenue?.total || '$0.00',
              totalBookings: summary.bookings?.completed || 0,
              totalFans: summary.fans?.total || 0,
              totalStreams: summary.streams?.monthlyStreams || 0,
            }
          }))
        }
      } catch (e) {
        console.error('Failed to fetch analytics:', e)
      }
    }
    fetchData()
  }, [])

  const maxMonthlyValue = Math.max(...data.monthly.map(m => m.revenue), 1)

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Analytics</h1>
              <p className="text-zinc-400 text-sm mt-1">Performance insights across all your agents</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-zinc-900 rounded-lg border border-zinc-700">
                {['1m', '3m', '6m', '1y'].map(range => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1.5 text-xs font-medium ${timeRange === range ? 'bg-white text-black rounded-lg' : 'text-zinc-400'}`}
                  >
                    {range}
                  </button>
                ))}
              </div>
              <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white">Dashboard</Link>
            </div>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
              <div className="text-xs text-zinc-500 mb-1">Total Revenue</div>
              <div className="text-2xl font-bold text-green-400">{data.overview.totalRevenue}</div>
            </div>
            <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
              <div className="text-xs text-zinc-500 mb-1">Total Bookings</div>
              <div className="text-2xl font-bold text-blue-400">{data.overview.totalBookings}</div>
            </div>
            <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
              <div className="text-xs text-zinc-500 mb-1">Total Fans</div>
              <div className="text-2xl font-bold text-pink-400">{data.overview.totalFans.toLocaleString()}</div>
            </div>
            <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
              <div className="text-xs text-zinc-500 mb-1">Total Streams</div>
              <div className="text-2xl font-bold text-orange-400">{data.overview.totalStreams.toLocaleString()}</div>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 mb-8">
            <h2 className="text-lg font-semibold mb-4">Revenue Trend</h2>
            <div className="h-48 flex items-end gap-2">
              {data.monthly.map((m, i) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-xs text-zinc-500 font-mono">${m.revenue}</div>
                  <div
                    className="w-full bg-green-500 rounded-t-sm min-h-[4px]"
                    style={{ height: `${Math.max(2, (m.revenue / maxMonthlyValue) * 100)}%` }}
                  />
                  <div className="text-xs text-zinc-500">{m.month}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Top Skills */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h2 className="text-lg font-semibold mb-4">Top Skills</h2>
              <div className="space-y-3">
                {data.topSkills.map(skill => (
                  <div key={skill.name} className="flex items-center justify-between">
                    <span className="text-sm text-zinc-300">{skill.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-zinc-500">{skill.usage} uses</span>
                      <div className="w-20 h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${skill.success}%` }} />
                      </div>
                      <span className="text-xs text-zinc-400 w-8">{skill.success}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Channel Performance */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h2 className="text-lg font-semibold mb-4">Channel Performance</h2>
              <div className="space-y-3">
                {data.channels.map(ch => (
                  <div key={ch.name} className="flex items-center justify-between bg-zinc-800 rounded-lg px-4 py-3">
                    <span className="text-sm font-medium">{ch.name}</span>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-zinc-400">{ch.messages} msgs</span>
                      <span className="text-green-400">{ch.engagement}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
