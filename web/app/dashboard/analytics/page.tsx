'use client'

import { useState, useEffect } from 'react'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'
import { SectionHeader } from '@/app/components/shared/SectionHeader'
import StatusPill from '@/app/components/shared/StatusPill'

interface AnalyticsData {
  overview: {
    deployedAgents: number
    liveAgents: number
    installedSkills: number
    scheduledTasks: number
    connectedChannels: number
    channelMessages: number
  }
  trend: { label: string; deployments: number; skills: number; tasks: number }[]
  topSkills: { name: string; installs: number }[]
  channels: { name: string; messages: number; lastActive: string | null; status: string }[]
  source: { gateway: string; sessions: string }
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [timeRange, setTimeRange] = useState('180')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/dashboard/analytics?range=${timeRange}`)
        if (res.ok) {
          setData(await res.json())
        }
      } catch (e) {
        console.error('Failed to fetch analytics:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [timeRange])

  const maxTrendValue = Math.max(
    ...(data?.trend.flatMap((item) => [item.deployments, item.skills, item.tasks]) || [1]),
    1
  )

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
              {[
                { label: '30d', value: '30' },
                { label: '90d', value: '90' },
                { label: '180d', value: '180' },
                { label: '1y', value: '365' },
              ].map(range => (
                <button
                  key={range.value}
                  onClick={() => setTimeRange(range.value)}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest ${timeRange === range.value ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        }
      />

      <DashboardContent className="max-w-6xl space-y-8">
        <SectionHeader
          label="Overview"
          title="Real Account And Runtime Metrics"
          description="Live platform data from your deployed agents, installed skills, task schedule, and gateway sessions"
        />

        {loading && !data && (
          <div className="border border-zinc-800 bg-zinc-950 p-5 text-xs text-zinc-500">
            Loading analytics…
          </div>
        )}

        {!loading && !data && (
          <div className="border border-zinc-800 bg-zinc-950 p-5 text-xs text-zinc-500">
            Analytics data is unavailable right now.
          </div>
        )}

        {data && (
          <>
        <div className="flex items-center gap-3">
          <StatusPill
            status={data.source.gateway === 'live' ? 'active' : 'offline'}
            label={`Gateway ${data.source.gateway}`}
            size="sm"
          />
          <StatusPill
            status={data.source.sessions === 'live' ? 'active' : 'idle'}
            label={`Sessions ${data.source.sessions}`}
            size="sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-800">
          {[
            { label: 'Deployed Agents', value: data.overview.deployedAgents.toLocaleString() },
            { label: 'Live Agents', value: data.overview.liveAgents.toLocaleString() },
            { label: 'Installed Skills', value: data.overview.installedSkills.toLocaleString() },
            { label: 'Scheduled Tasks', value: data.overview.scheduledTasks.toLocaleString() },
          ].map((item) => (
            <div key={item.label} className="bg-zinc-950 p-5">
              <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">{item.label}</div>
              <div className="text-2xl font-bold tracking-tight">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-zinc-800">
          <div className="bg-zinc-950 p-5">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Connected Channels</div>
            <div className="text-2xl font-bold tracking-tight">{data.overview.connectedChannels}</div>
          </div>
          <div className="bg-zinc-950 p-5">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Channel Messages</div>
            <div className="text-2xl font-bold tracking-tight">{data.overview.channelMessages.toLocaleString()}</div>
          </div>
        </div>

          <div className="border border-zinc-800 bg-zinc-950 p-6">
          <h2 className="text-sm font-bold tracking-tight uppercase mb-6">Deployment Trend</h2>
          <div className="h-48 flex items-end gap-px bg-zinc-800">
            {data.trend.map((m) => (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-1 bg-zinc-950 py-2">
                <div className="flex w-full h-full items-end gap-1 px-1">
                  <div
                    className="w-full bg-blue-500 min-h-[4px]"
                    style={{ height: `${Math.max(2, (m.deployments / maxTrendValue) * 100)}%` }}
                    title={`${m.deployments} deployments`}
                  />
                  <div
                    className="w-full bg-green-500 min-h-[4px]"
                    style={{ height: `${Math.max(2, (m.skills / maxTrendValue) * 100)}%` }}
                    title={`${m.skills} skill installs`}
                  />
                  <div
                    className="w-full bg-yellow-500 min-h-[4px]"
                    style={{ height: `${Math.max(2, (m.tasks / maxTrendValue) * 100)}%` }}
                    title={`${m.tasks} tasks`}
                  />
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">
                  {m.deployments}/{m.skills}/{m.tasks}
                </div>
                <div className="text-[10px] text-zinc-500 uppercase">{m.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-4 text-[10px] uppercase tracking-widest text-zinc-500">
            <span className="flex items-center gap-1"><span className="h-2 w-2 bg-blue-500" /> Deployments</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 bg-green-500" /> Skills</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 bg-yellow-500" /> Tasks</span>
          </div>
        </div>

        <div className="grid gap-px bg-zinc-800 md:grid-cols-2">
          <div className="bg-zinc-950 p-6">
            <h2 className="text-sm font-bold tracking-tight uppercase mb-6">Top Installed Skills</h2>
            <div className="space-y-4">
              {data.topSkills.length === 0 && (
                <div className="text-xs text-zinc-500">No installed skills yet.</div>
              )}
              {data.topSkills.map(skill => (
                <div key={skill.name} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-zinc-300 min-w-0 truncate">{skill.name}</span>
                  <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                    <span>{skill.installs} installs</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-zinc-950 p-6">
            <h2 className="text-sm font-bold tracking-tight uppercase mb-6">Channel Performance</h2>
            <div className="space-y-px bg-zinc-800">
              {data.channels.map(ch => (
                <div key={ch.name} className="flex items-center justify-between bg-zinc-950 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider">{ch.name}</span>
                    <StatusPill
                      status={ch.status === 'connected' ? 'active' : ch.status === 'unreachable' ? 'error' : 'offline'}
                      label={ch.status}
                      size="sm"
                    />
                  </div>
                  <div className="flex items-center gap-4 text-[10px]">
                    <span className="text-zinc-500">{ch.messages} msgs</span>
                    <span className="text-zinc-400">{ch.lastActive ? new Date(ch.lastActive).toLocaleDateString('en-GB') : 'No activity'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </>
        )}
      </DashboardContent>
    </DashboardShell>
  )
}
