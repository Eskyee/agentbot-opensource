
'use client'

// Helper to convert percent string to Tailwind width class
function getBarWidthClass(percent?: string) {
  if (!percent) return 'w-0';
  const num = parseInt(percent.replace('%', ''));
    if (num >= 100) { return 'w-full'; }
    if (num >= 90) { return 'w-11/12'; }
    if (num >= 80) { return 'w-10/12'; }
    if (num >= 70) { return 'w-9/12'; }
    if (num >= 60) { return 'w-8/12'; }
    if (num >= 50) { return 'w-7/12'; }
    if (num >= 40) { return 'w-6/12'; }
    if (num >= 30) { return 'w-5/12'; }
    if (num >= 20) { return 'w-4/12'; }
    if (num >= 10) { return 'w-3/12'; }
    if (num > 0) { return 'w-2/12'; }
  return 'w-0';
}

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { useSession } from 'next-auth/react'

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

const navItems = [
  { icon: '🤖', label: 'Agents', href: '/agents', active: false },
  { icon: '🛒', label: 'Marketplace', href: '/marketplace', active: false },
  { icon: '💳', label: 'Billing', href: '/billing', active: false },
  { icon: '⚙️', label: 'Account', href: '/settings', active: false },
]

function DashboardContent() {
  const { data: session } = useSession()
  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'Guest'
  const searchParams = useSearchParams()
  const [instance, setInstance] = useState<InstanceData | null>(null)
  const [stats, setStats] = useState<{ cpu: string; memory: string; uptime?: string; messages?: number; errors?: number; health?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState('')

  useEffect(() => {
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
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">🦞</div>
          <p className="text-gray-400">Loading your instance...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen bg-black">
        {/* Sidebar */}
        <DashboardSidebar userName={userName} />
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">🚀</div>
            <h1 className="text-2xl font-bold mb-4">Deploy your first agent</h1>
            <p className="text-gray-400 mb-8">{error}</p>
            <Link
              href="/onboard"
              className="inline-block bg-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Deploy New Agent →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!instance) return null

  const isRunning = instance.status === 'running'
  const startedAt = instance.startedAt

  return (
    <div className="flex h-screen bg-black">
      {/* Sidebar */}
      <DashboardSidebar userName={userName} credits={0.01} />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-gray-400">Manage your OpenClaw agent</p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/agents"
                className="bg-white hover:bg-gray-200 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <span>+</span> New Agent
              </a>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                isRunning ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-400' : 'bg-red-400'}`} />
                {instance?.status}
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Instance Info */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>🤖</span> Agent Details
              </h2>
              <dl className="space-y-3">
                {instance?.botUsername && (
                  <div>
                    <dt className="text-xs text-gray-500 uppercase">Telegram</dt>
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
                  <dt className="text-xs text-gray-500 uppercase">Instance ID</dt>
                  <dd className="font-mono text-sm text-gray-300">{instance?.userId}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 uppercase">URL</dt>
                  <dd className="font-mono text-sm text-gray-300 break-all">
                    <a href={instance?.url} target="_blank" rel="noopener noreferrer" className="text-white hover:underline">
                      {instance?.subdomain}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 uppercase">Plan</dt>
                  <dd className="text-gray-300 capitalize flex items-center gap-2">
                    {instance?.plan || 'Free Trial'}
                    {(instance?.plan === 'trial' || !instance?.plan) && (
                      <Link href="/#pricing" className="ml-2 text-xs bg-white hover:bg-gray-200 text-white px-2 py-1 rounded-full">
                        Upgrade
                      </Link>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 uppercase">Version</dt>
                  <dd className="font-mono text-gray-300">{instance?.openclawVersion || '2026.2.21'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 uppercase">Started</dt>
                  <dd className="text-gray-300">{startedAt ? new Date(startedAt).toLocaleString() : 'N/A'}</dd>
                </div>
              </dl>
            </div>

            {/* Stats & Health */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>📊</span> Stats & Health
              </h2>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-gray-500">CPU</dt>
                  <dd className="text-gray-300 font-mono">{stats?.cpu || 'N/A'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Memory</dt>
                  <dd className="text-gray-300 font-mono">{stats?.memory || 'N/A'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Uptime</dt>
                  <dd className="text-gray-300 font-mono">{stats?.uptime || 'N/A'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Messages</dt>
                  <dd className="text-gray-300 font-mono">{stats?.messages ?? 'N/A'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Errors</dt>
                  <dd className="text-gray-300 font-mono">{stats?.errors ?? 'N/A'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Health</dt>
                  <dd className={`font-mono ${stats?.health === 'healthy' ? 'text-green-400' : 'text-yellow-400'}`}>
                    {stats?.health || 'N/A'}
                  </dd>
                </div>
              </dl>
              
              <div className="mt-4 space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>CPU</span>
                    <span>{stats?.cpu || '0%'}</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    {/* Progress bar: set width via Tailwind or style prop, but avoid custom CSS variables for compatibility */}
                    <div
                      className={`h-full bg-white rounded-full ${getBarWidthClass(stats?.cpu)}`}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Memory</span>
                    <span>{stats?.memory || '0%'}</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-purple-500 rounded-full ${getBarWidthClass(stats?.memory)}`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>⚡</span> Quick Actions
              </h2>
              <div className="space-y-3">
                {instance?.botUsername && (
                  <a
                    href={`https://t.me/${instance?.botUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between w-full bg-blue-600 hover:bg-blue-500 px-4 py-3 rounded-lg transition-colors"
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
                  {actionLoading === 'update' ? <span className="animate-spin">⏳</span> : <span>⬆️</span>}
                </button>
                <button
                  onClick={() => performAction('restart')}
                  disabled={!!actionLoading}
                  className="flex items-center justify-between w-full bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  <span>Restart</span>
                  {actionLoading === 'restart' ? <span className="animate-spin">⏳</span> : <span>🔄</span>}
                </button>
                {isRunning ? (
                  <button
                    onClick={() => performAction('stop')}
                    disabled={!!actionLoading}
                    className="flex items-center justify-between w-full bg-red-600 hover:bg-red-500 px-4 py-3 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <span>Stop</span>
                    {actionLoading === 'stop' ? <span className="animate-spin">⏳</span> : <span>⏹</span>}
                  </button>
                ) : (
                  <button
                    onClick={() => performAction('start')}
                    disabled={!!actionLoading}
                    className="flex items-center justify-between w-full bg-green-600 hover:bg-green-500 px-4 py-3 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <span>Start</span>
                    {actionLoading === 'start' ? <span className="animate-spin">⏳</span> : <span>▶️</span>}
                  </button>
                )}
              </div>
            </div>

            {/* Skills */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>🎯</span> Active Skills
              </h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2 text-sm">
                  <span>Web Scraping</span>
                  <span className="text-green-400">✓</span>
                </div>
                <div className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2 text-sm">
                  <span>Email</span>
                  <span className="text-green-400">✓</span>
                </div>
                <div className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2 text-sm">
                  <span>Calendar</span>
                  <span className="text-green-400">✓</span>
                </div>
                <a href="/marketplace" className="block text-center text-sm text-white hover:underline mt-3">
                  + Add more skills →
                </a>
              </div>
            </div>

            {/* Channels */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>💬</span> Channels
              </h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2 text-sm">
                  <span>Telegram</span>
                  <span className="text-green-400">✓ Connected</span>
                </div>
                <div className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2 text-sm">
                  <span>Discord</span>
                  <span className="text-gray-500">Not connected</span>
                </div>
                <div className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2 text-sm">
                  <span>WhatsApp</span>
                  <span className="text-gray-500">Not connected</span>
                </div>
              </div>
            </div>

            {/* Help */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>❓</span> Help & Support
              </h2>
              <div className="space-y-3 text-sm">
                <a href="/docs" className="flex items-center gap-2 text-gray-400 hover:text-gray-200">
                  <span>📚</span> Documentation
                </a>
                <a href="https://discord.com/invite/clawd" target="_blank" rel="noopener" className="flex items-center gap-2 text-gray-400 hover:text-gray-200">
                  <span>💬</span> Discord
                </a>
                <a href="mailto:info@agentbot.com" className="flex items-center gap-2 text-gray-400 hover:text-gray-200">
                  <span>📧</span> Contact
                </a>
              </div>
            </div>
          </div>

          {/* Activity Log */}
          <div className="mt-6 bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold mb-4">📝 Recent Activity</h2>
            <div className="text-gray-400 text-sm space-y-2">
              <div className="flex items-center gap-3">
                <span>•</span>
                <span>Instance started</span>
                <span className="ml-auto text-gray-600">{startedAt ? new Date(startedAt).toLocaleTimeString() : 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3">
                <span>•</span>
                <span>Connected to Telegram</span>
              </div>
              <div className="flex items-center gap-3">
                <span>•</span>
                <span>Skills loaded</span>
              </div>
            </div>
          </div>

          {/* Referral */}
          <div className="mt-6 bg-gradient-to-r from-white/20 to-gray-200/20 rounded-2xl p-6 border border-white/30">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold mb-1">🎁 Invite Friends, Get Free Months</h2>
                <p className="text-gray-400 text-sm mb-4">Share your link — get £30 off per referral</p>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    readOnly
                    value={`https://agentbot.raveculture.xyz/ref/${instance?.userId}`}
                    className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-300 w-64"
                    placeholder="Referral link"
                    title="Referral link"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(`https://agentbot.raveculture.xyz/ref/${instance?.userId}`)}
                    className="bg-white hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-semibold"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div className="hidden md:block text-5xl">🎁</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function DashboardSidebar({ userName, credits = 0 }: { userName: string; credits?: number }) {
  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🦞</span>
          <span className="text-xl font-bold">Agentbot</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                item.active 
                  ? 'bg-white/20 text-white' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Credits */}
        <div className="mt-8 p-4 bg-gray-800 rounded-xl">
          <div className="text-sm text-gray-400 mb-1">Credits</div>
          <div className="text-xl font-bold">${credits.toFixed(2)}</div>
        </div>
      </nav>

      {/* User */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-medium">{userName}</div>
            <div className="text-sm text-gray-400">Free Trial</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">🦞</div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
