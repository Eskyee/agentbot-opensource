'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCustomSession } from '@/app/lib/useCustomSession'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'
import { SectionHeader } from '@/app/components/shared/SectionHeader'
import StatusPill from '@/app/components/shared/StatusPill'

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
  const { data: session } = useCustomSession()
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

  const AnalyticsIcon = () => (
    <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="square" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )

  return (
    <DashboardShell>
      <DashboardHeader
        title="Analytics"
        icon={<AnalyticsIcon />}
        action={
          <div className="flex items-center gap-3">
            <div className="flex bg-zinc-900 border border-zinc-700">
              {['1m', '3m', '6m', '1y'].map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest ${timeRange === range ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        }
      />

      <DashboardContent className="max-w-6xl space-y-8">
        <SectionHeader
          label="Overview"
          title="Performance Insights"
          description="Across all your agents and channels"
        />

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-800">
          {[
            { label: 'Total Revenue', value: data.overview.totalRevenue },
            { label: 'Total Bookings', value: data.overview.totalBookings },
            { label: 'Total Fans', value: data.overview.totalFans.toLocaleString() },
            { label: 'Total Streams', value: data.overview.totalStreams.toLocaleString() },
          ].map((item) => (
            <div key={item.label} className="bg-zinc-950 p-5">
              <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">{item.label}</div>
              <div className="text-2xl font-bold tracking-tight">{item.value}</div>
            </div>
          ))}
        </div>

        {/* Revenue Chart */}
        <div className="border border-zinc-800 bg-zinc-950 p-6">
          <h2 className="text-sm font-bold tracking-tight uppercase mb-6">Revenue Trend</h2>
          <div className="h-48 flex items-end gap-px bg-zinc-800">
            {data.monthly.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1 bg-zinc-950 py-2">
                <div className="text-[10px] text-zinc-500 font-mono">${m.revenue}</div>
                <div
                  className="w-full bg-green-500 min-h-[4px]"
                  style={{ height: `${Math.max(2, (m.revenue / maxMonthlyValue) * 100)}%` }}
                />
                <div className="text-[10px] text-zinc-500 uppercase">{m.month}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Skills & Channels */}
        <div className="grid gap-px bg-zinc-800 md:grid-cols-2">
          {/* Top Skills */}
          <div className="bg-zinc-950 p-6">
            <h2 className="text-sm font-bold tracking-tight uppercase mb-6">Top Skills</h2>
            <div className="space-y-4">
              {data.topSkills.map(skill => (
                <div key={skill.name} className="flex items-center justify-between">
                  <span className="text-xs text-zinc-300">{skill.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-zinc-500">{skill.usage} uses</span>
                    <div className="w-20 h-1 bg-zinc-800">
                      <div className="h-full bg-blue-500" style={{ width: `${skill.success}%` }} />
                    </div>
                    <span className="text-[10px] text-zinc-400 w-8">{skill.success}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Channel Performance */}
          <div className="bg-zinc-950 p-6">
            <h2 className="text-sm font-bold tracking-tight uppercase mb-6">Channel Performance</h2>
            <div className="space-y-px bg-zinc-800">
              {data.channels.map(ch => (
                <div key={ch.name} className="flex items-center justify-between bg-zinc-950 px-4 py-3">
                  <span className="text-xs font-bold uppercase tracking-wider">{ch.name}</span>
                  <div className="flex items-center gap-4 text-[10px]">
                    <span className="text-zinc-500">{ch.messages} msgs</span>
                    <span className="text-zinc-400">{ch.engagement}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardContent>
    </DashboardShell>
  )
}
