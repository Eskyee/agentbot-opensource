'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

interface InstanceData {
  userId: string
  status: string
  startedAt: string
  subdomain: string
  url: string
  plan: string
  openclawVersion?: string
  botUsername?: string
}

function DashboardContent() {
  const searchParams = useSearchParams()
  const [instance, setInstance] = useState<InstanceData | null>(null)
  const [stats, setStats] = useState<{ cpu: string; memory: string; uptime?: string; messages?: number; errors?: number; health?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState('')

  useEffect(() => {
    // Get userId from URL or localStorage
    const urlUserId = searchParams.get('id')
    const storedData = localStorage.getItem('agentbot_instance')
    
    let userId = urlUserId
    let botUsername = ''
    
    if (storedData) {
      const parsed = JSON.parse(storedData)
      if (!userId) userId = parsed.userId
      botUsername = parsed.botUsername || ''
    }
    
    if (!userId) {
      setError('No instance found. Please deploy first.')
      setLoading(false)
      return
    }
    
    // Fetch instance status
    fetchInstance(userId, botUsername)
  }, [searchParams])

  const fetchInstance = async (userId: string, botUsername: string) => {
    try {
      const res = await fetch(`/api/instance/${userId}`)
      const data = await res.json()
      
      if (data.error) {
        setError(data.error)
      } else {
        setInstance({ ...data, botUsername })
        // Also fetch stats
        fetchStats(userId)
      }
    } catch (e) {
      setError('Failed to fetch instance')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async (userId: string) => {
    try {
      const res = await fetch(`/api/instance/${userId}/stats`)
      const data = await res.json()
      if (!data.error) {
        setStats({
          cpu: data.cpu,
          memory: data.memory,
          uptime: data.uptime,
          messages: data.messages,
          errors: data.errors,
          health: data.health,
        })
      }
    } catch {}
  }

  const performAction = async (action: 'restart' | 'stop' | 'start' | 'update') => {
    if (!instance) return
    setActionLoading(action)
    
    try {
      const res = await fetch(`/api/instance/${instance.userId}/${action}`, {
        method: 'POST'
      })
      const data = await res.json()
      
      if (data.success) {
        // Refresh instance data
        setTimeout(() => fetchInstance(instance.userId, instance.botUsername || ''), 1000)
      } else {
        alert(data.error || 'Action failed')
      }
    } catch (e) {
      alert('Action failed')
    } finally {
      setActionLoading('')
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl text-center py-20">
        <div className="text-5xl mb-4 animate-pulse">🦞</div>
        <p className="text-gray-400">Loading your instance...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl text-center py-20">
        <div className="text-5xl mb-4">😕</div>
        <h1 className="text-2xl font-bold mb-4">Oops!</h1>
        <p className="text-gray-400 mb-8">{error}</p>
        <a
          href="/onboard"
          className="inline-block bg-lobster-500 px-8 py-3 rounded-lg font-semibold hover:bg-lobster-400 transition-colors"
        >
          Deploy New Instance →
        </a>
      </div>
    )
  }

  if (!instance) return null

  const isRunning = instance?.status === 'running'

  // Advanced stats panel
  return (
    <main className="min-h-screen py-12 px-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Manage Your OpenClaw Instance</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold mb-4">Agent Details</h2>
            <div className="space-y-2 text-gray-300">
              <div><strong>Status:</strong> {instance?.status}</div>
              <div><strong>Bot Username:</strong> {instance?.botUsername || 'N/A'}</div>
              <div><strong>Plan:</strong> {instance?.plan || 'N/A'}</div>
              <div><strong>OpenClaw Version:</strong> {instance?.openclawVersion || 'N/A'}</div>
            </div>
          </div>
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold mb-4">Stats & Health</h2>
            <div className="space-y-2 text-gray-300">
              <div><strong>CPU:</strong> {stats?.cpu || 'N/A'}</div>
              <div><strong>Memory:</strong> {stats?.memory || 'N/A'}</div>
              <div><strong>Uptime:</strong> {stats?.uptime || 'N/A'}</div>
              <div><strong>Messages:</strong> {stats?.messages ?? 'N/A'}</div>
              <div><strong>Errors:</strong> {stats?.errors ?? 'N/A'}</div>
              <div><strong>Health:</strong> {stats?.health || 'N/A'}</div>
            </div>
            {/* Simple visual bar for CPU/memory */}
            <div className="mt-4">
              <div className="mb-2 text-sm text-gray-400">CPU Usage</div>
              <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gray-700 rounded-full" style={{ width: stats?.cpu ? stats.cpu : '0%' }} />
              </div>
              <div className="mt-2 text-sm text-gray-400">Memory Usage</div>
              <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gray-700 rounded-full" style={{ width: stats?.memory ? stats.memory : '0%' }} />
              </div>
            </div>
          </div>
        </div>
        {/* Actions */}
        <div className="flex gap-4 mb-8">
          <button className="rounded-lg bg-gray-900 px-4 py-2 text-white hover:bg-gray-700 transition-colors" disabled={actionLoading === 'restart'} onClick={() => performAction('restart')}>Restart</button>
          <button className="rounded-lg bg-gray-900 px-4 py-2 text-white hover:bg-gray-700 transition-colors" disabled={actionLoading === 'stop'} onClick={() => performAction('stop')}>Stop</button>
          <button className="rounded-lg bg-gray-900 px-4 py-2 text-white hover:bg-gray-700 transition-colors" disabled={actionLoading === 'start'} onClick={() => performAction('start')}>Start</button>
          <button className="rounded-lg bg-gray-900 px-4 py-2 text-white hover:bg-gray-700 transition-colors" disabled={actionLoading === 'update'} onClick={() => performAction('update')}>Update</button>
        </div>
        {/* Logs and notifications placeholder */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Recent Activity & Logs</h2>
          <div className="text-gray-400">Coming soon: Display agent logs, errors, and notifications here.</div>
        </div>
      </div>
    </main>
  )
  // ...existing code...

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-400">Manage your OpenClaw instance</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
          isRunning ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-400' : 'bg-red-400'}`} />
{instance?.status}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Instance Info */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Instance Info</h2>
          <dl className="space-y-4">
            {instance?.botUsername && (
              <div>
                <dt className="text-sm text-gray-400">Telegram Bot</dt>
                <dd className="font-mono">
                  <a 
                    href={`https://t.me/${instance?.botUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    @{instance?.botUsername}
                  </a>
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm text-gray-400">Instance ID</dt>
              <dd className="font-mono text-sm">{instance?.userId}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-400">URL</dt>
              <dd className="font-mono text-sm break-all">
                <a href={instance?.url} target="_blank" rel="noopener noreferrer" className="text-lobster-400 hover:underline">
                  {instance?.subdomain}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-400">Plan</dt>
              <dd className="capitalize">{instance?.plan || 'Free Trial'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-400">OpenClaw Version</dt>
              <dd className="font-mono">{instance?.openclawVersion || '2026.2.17'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-400">Started</dt>
              <dd>{instance?.startedAt ? new Date(instance.startedAt).toLocaleString() : 'N/A'}</dd>
            </div>
          </dl>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {instance?.botUsername && (
              <a
                href={`https://t.me/${instance?.botUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between w-full bg-blue-500 hover:bg-blue-400 px-4 py-3 rounded-lg transition-colors"
              >
                <span className="font-semibold">Open Telegram</span>
                <span>→</span>
              </a>
            )}
            <button
              onClick={() => performAction('update')}
              disabled={!!actionLoading}
              className="flex items-center justify-between w-full bg-purple-600 hover:bg-purple-500 px-4 py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              <span>Update OpenClaw</span>
              {actionLoading === 'update' ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <span>⬆️</span>
              )}
            </button>
            <button
              onClick={() => performAction('restart')}
              disabled={!!actionLoading}
              className="flex items-center justify-between w-full bg-gray-800 hover:bg-gray-700 px-4 py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              <span>Restart Instance</span>
              {actionLoading === 'restart' ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <span>🔄</span>
              )}
            </button>
            {isRunning ? (
              <button
                onClick={() => performAction('stop')}
                disabled={!!actionLoading}
                className="flex items-center justify-between w-full bg-gray-800 hover:bg-gray-700 px-4 py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                <span>Stop Instance</span>
                {actionLoading === 'stop' ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <span>⏹</span>
                )}
              </button>
            ) : (
              <button
                onClick={() => performAction('start')}
                disabled={!!actionLoading}
                className="flex items-center justify-between w-full bg-green-600 hover:bg-green-500 px-4 py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                <span>Start Instance</span>
                {actionLoading === 'start' ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <span>▶️</span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Resource Usage */}
        {stats && (
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold mb-4">Resource Usage</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">CPU</span>
                  <span>{stats.cpu}</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-lobster-500 rounded-full" 
                    style={{ width: stats.cpu }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Memory</span>
                  <span>{stats.memory}</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gray-700 rounded-full" 
                    style={{ width: '40%' }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Help */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4">Need Help?</h2>
          <div className="space-y-3 text-sm">
            <a href="https://docs.openclaw.ai" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors">
              <span>📚</span> Documentation
            </a>
            <a href="https://discord.com/invite/clawd" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors">
              <span>💬</span> Discord Community
            </a>
            <a href="https://github.com/openclaw/openclaw" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors">
              <span>🐙</span> GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <main className="min-h-screen py-12 px-6">
      <Suspense fallback={
        <div className="mx-auto max-w-4xl text-center py-20">
          <div className="text-5xl mb-4 animate-pulse">🦞</div>
          <p className="text-gray-400">Loading...</p>
        </div>
      }>
        <DashboardContent />
      </Suspense>
    </main>
  )
}
