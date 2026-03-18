'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams, usePathname } from 'next/navigation'
import { Suspense } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import WalletCard from '@/app/components/WalletCard'
import AIModelCard from '@/app/components/AIModelCard'
import { AgentVerifiedBadge, AgentVerificationPanel } from '@/app/components/VerificationBadge'
import HelpChat from '@/app/components/HelpChat'

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

interface InstanceData {
  userId: string
  status: string
  startedAt: string
  subdomain: string
  url: string
  plan: string
  openclawVersion?: string
  botUsername?: string
  gatewayToken?: string
  verified?: boolean
  verificationType?: string | null
  attestationUid?: string | null
  verifiedAt?: string | null
}

const navItems = [
  { icon: '📊', label: 'Dashboard', href: '/dashboard' },
  // Mission Control
  { icon: '🛸', label: 'Agent Fleet', href: '/dashboard/fleet' },
  { icon: '💰', label: 'Cost Tracking', href: '/dashboard/cost' },
  { icon: '📡', label: 'System Pulse', href: '/dashboard/system-pulse' },
  { icon: '🧠', label: 'Memory Log', href: '/dashboard/memory' },
  { icon: '🌅', label: 'Daily Brief', href: '/dashboard/daily-brief' },
  { icon: '🔭', label: 'Tech Updates', href: '/dashboard/tech-updates' },
  { icon: '📈', label: 'Market Intel', href: '/dashboard/market-intel' },
  { icon: '🔊', label: 'Signals', href: '/dashboard/signals' },
  // Agent Management
  { icon: '📋', label: 'Tasks', href: '/dashboard/tasks' },
  { icon: '🎨', label: 'Personality', href: '/dashboard/personality' },
  { icon: '🔧', label: 'Skills', href: '/dashboard/skills' },
  { icon: '🤖', label: 'Swarms', href: '/dashboard/swarms' },
  { icon: '⚡', label: 'Workflows', href: '/dashboard/workflows' },
  // Tools & Account
  { icon: '📁', label: 'Files', href: '/dashboard/files' },
  { icon: '📆', label: 'Calendar', href: '/dashboard/calendar' },
  { icon: '💓', label: 'Heartbeat', href: '/dashboard/heartbeat' },
  { icon: '✅', label: 'Verify', href: '/dashboard/verify' },
  { icon: '🎛️', label: 'DJ Stream', href: '/dashboard/dj-stream' },
  { icon: '💹', label: 'Trading', href: '/dashboard/trading' },
  { icon: '🛒', label: 'Marketplace', href: '/marketplace' },
  { icon: '💳', label: 'Billing', href: '/billing' },
  { icon: '🔑', label: 'API Keys', href: '/dashboard/keys' },
  { icon: '⚙️', label: 'Settings', href: '/settings' },
]

function DashboardContent() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const router = useRouter()
  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'Sign in'
  const searchParams = useSearchParams()
  const [instance, setInstance] = useState<InstanceData | null>(null)
  const [stats, setStats] = useState<{ cpu: string; memory: string; uptime?: string; messages?: number; errors?: number; health?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState('')
  const [credits, setCredits] = useState(0)
  const [heartbeatCredits, setHeartbeatCredits] = useState(200)
  const [heartbeatFreq, setHeartbeatFreq] = useState('3h')
  const [lastSeen, setLastSeen] = useState<string | null>(null)
  const [taskInput, setTaskInput] = useState('')
  const [activeTaskTab, setActiveTaskTab] = useState('all')
  const [tasks, setTasks] = useState<{id: string; title: string; status: string; type: string}[]>([])
  const [signingOut, setSigningOut] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activities, setActivities] = useState<{id: string; action: string; agent: string; time: string; icon: string}[]>([
    { id: '1', action: 'Agent online', agent: 'Atlas', time: '2 min ago', icon: '🟢' },
    { id: '2', action: 'Calendar sync completed', agent: 'Atlas', time: '8 min ago', icon: '⏱️' },
    { id: '3', action: 'WhatsApp session started', agent: 'Atlas', time: '22 min ago', icon: '💬' },
    { id: '4', action: 'Skill installed', agent: 'Atlas', time: '1 hour ago', icon: '🔌' },
    { id: '5', action: 'Uptime check passed', agent: 'Watchtower', time: '1 hour ago', icon: '⚡' },
  ])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?callbackUrl=/dashboard')
    }
  }, [status, router])

    useEffect(() => {
      // Clear localStorage instance data when no session (user logged out)
      if (!session) {
        localStorage.removeItem('agentbot_instance')
        setInstance(null)
        setError('')
        setLoading(false)
        return
      }

      const urlUserId = searchParams.get('id')
      const storedData = localStorage.getItem('agentbot_instance')
      
      // If no session, don't proceed with fetching instance data
      if (!session) {
        setInstance(null)
        setError('')
        setLoading(false)
        return
      }
      
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
      fetchCredits()
    }, [searchParams, session])

  const fetchCredits = async () => {
    try {
      const res = await fetch('/api/credits')
      const data = await res.json()
      setCredits(data.credits || 0)
    } catch (e) {
      console.error('Failed to fetch credits:', e)
    }
  }

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

  const performAction = async (action: 'restart' | 'stop' | 'start' | 'update' | 'repair' | 'reset-memory') => {
    if (!instance) return
    setActionLoading(action)
    
    try {
      const res = await fetch(`/api/instance/${instance.userId}/${action}`, {
        method: 'POST'
      })
      const data = await res.json()
      
      if (data.success) {
        if (action === 'reset-memory') {
          alert('Memory reset successfully!')
        } else if (action === 'repair') {
          alert('Agent repaired successfully!')
        }
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

  const fetchToken = async () => {
    if (!instance) return ''
    try {
      const res = await fetch(`/api/instance/${instance.userId}/token`)
      const data = await res.json()
      if (data.token) {
        setInstance(prev => prev ? { ...prev, gatewayToken: data.token } : null)
        return data.token
      }
    } catch (e) {
      console.error('Failed to fetch token:', e)
    }
    return ''
  }

  const handleCopyToken = async () => {
    let token = instance?.gatewayToken
    if (!token) {
      token = await fetchToken()
    }
    if (token) {
      try {
        await navigator.clipboard.writeText(token)
        alert('Token copied to clipboard!')
      } catch {
        const textArea = document.createElement('textarea')
        textArea.value = token
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        document.body.appendChild(textArea)
        textArea.select()
        try {
          document.execCommand('copy')
          alert('Token copied to clipboard!')
        } catch {
          alert('Failed to copy. Please copy manually.')
        }
        document.body.removeChild(textArea)
      }
    }
  }

   if (loading) {
     return (
       <div className="flex items-center justify-center mt-[4rem] h-[calc(100vh-4rem)] bg-black">
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
        <DashboardSidebar
          userName={userName}
          plan={instance?.plan}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">🚀</div>
            <h1 className="text-2xl font-bold mb-4">Deploy your first agent</h1>
            <p className="text-gray-400 mb-8">{error}</p>
            <Link
              href="/onboard"
              className="inline-block bg-white text-black px-8 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Deploy New Agent →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!instance) return null

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">🦞</div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  const isRunning = instance.status === 'running'
  const startedAt = instance.startedAt

  return (
    <div className="flex h-screen bg-black">
      <DashboardSidebar
        userName={userName}
        credits={credits}
        plan={instance?.plan}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="p-4 lg:p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors z-50"
                aria-label="Open menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold">Mission Control</h1>
                <p className="text-gray-400 text-sm lg:text-base">Agent monitoring & control center</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm text-green-400">System Online</span>
              </div>
              <a
                href="/agents"
                className="bg-white text-black hover:bg-gray-200 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <span>+</span> New Agent
              </a>
              {instance?.verified && (
                <AgentVerifiedBadge verified={instance.verified} verificationType={instance.verificationType} />
              )}
            </div>
          </div>

          {/* Mission Control Header */}
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Active Agents</span>
                <span className="text-2xl">🤖</span>
              </div>
              <div className="text-3xl font-bold">1<span className="text-lg text-gray-500 font-normal">/6</span></div>
              <div className="text-xs text-green-400 mt-1">+2 today</div>
            </div>
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Token Spend</span>
                <span className="text-2xl">💰</span>
              </div>
              <div className="text-3xl font-bold">£12.40</div>
              <div className="text-xs text-green-400 mt-1">+8.2% this month</div>
            </div>
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Sessions</span>
                <span className="text-2xl">💬</span>
              </div>
              <div className="text-3xl font-bold">11</div>
              <div className="text-xs text-gray-500 mt-1">active now</div>
            </div>
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Skills</span>
                <span className="text-2xl">🛠️</span>
              </div>
              <div className="text-3xl font-bold">8<span className="text-lg text-gray-500 font-normal">/14</span></div>
              <div className="text-xs text-blue-400 mt-1">+2 this week</div>
            </div>
          </div>

          {/* System Vitals */}
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">CPU</span>
                <span className="text-gray-500 text-sm">{stats?.cpu || '34%'}</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full" style={{ width: stats?.cpu || '34%' }} />
              </div>
            </div>
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Memory</span>
                <span className="text-gray-500 text-sm">{stats?.memory || '62%'}</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full" style={{ width: stats?.memory || '62%' }} />
              </div>
            </div>
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Disk</span>
                <span className="text-gray-500 text-sm">45%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full" style={{ width: '45%' }} />
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 mb-8">
            <div className="p-4 border-b border-gray-800">
              <h2 className="font-semibold">Recent Activity</h2>
            </div>
            <div className="divide-y divide-gray-800">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4 p-4 hover:bg-gray-800/50 transition-colors">
                  <span className="text-xl">{activity.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm">{activity.action}</div>
                    <div className="text-xs text-gray-500">{activity.agent}</div>
                  </div>
                  <div className="text-xs text-gray-500">{activity.time}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                  <dd className="text-gray-300 capitalize">{instance?.plan || 'free'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 uppercase">Version</dt>
                  <dd className="font-mono text-gray-300">{instance?.openclawVersion || '2026.2.26'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 uppercase">Started</dt>
                  <dd className="text-gray-300">{startedAt ? new Date(startedAt).toLocaleString() : 'N/A'}</dd>
                </div>
              </dl>
            </div>

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
                    <div className={`h-full bg-white rounded-full ${getBarWidthClass(stats?.cpu)}`} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Memory</span>
                    <span>{stats?.memory || '0%'}</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full bg-purple-500 rounded-full ${getBarWidthClass(stats?.memory)}`} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>⚡</span> Quick Actions
              </h2>
              <div className="space-y-3">
                <a
                  href={instance?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between w-full bg-green-600 hover:bg-green-500 px-4 py-3 rounded-lg transition-colors"
                >
                  <span className="font-semibold">🎮 Open OpenClaw UI</span>
                  <span>→</span>
                </a>
                {instance?.botUsername && (
                  <a
                    href={`https://t.me/${instance?.botUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between w-full bg-blue-600 hover:bg-blue-500 px-4 py-3 rounded-lg transition-colors"
                  >
                    <span className="font-semibold">📱 Open Telegram</span>
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

            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>🎛️</span> Control Panel
              </h2>
              <div className="space-y-3">
                <button
                  onClick={() => performAction('repair')}
                  disabled={!!actionLoading}
                  className="flex items-center justify-between w-full bg-orange-600 hover:bg-orange-500 px-4 py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  <div className="text-left">
                    <div className="font-semibold">🔧 Repair Agent</div>
                    <div className="text-xs opacity-70">Full reconfigure — fixes broken proxy, tokens, config</div>
                  </div>
                  {actionLoading === 'repair' ? <span className="animate-spin">⏳</span> : <span>→</span>}
                </button>
                
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-2">Gateway Token</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      readOnly
                      value={instance?.gatewayToken ? '••••••••••••' : ''}
                      placeholder="Click to load token"
                      className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm font-mono"
                    />
                    <button
                      onClick={handleCopyToken}
                      className="bg-white text-black hover:bg-gray-200 px-3 py-2 rounded text-sm font-semibold"
                    >
                      📋
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Paste this token in the Control UI settings to connect.
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    if (confirm('⚠️ Wipe memory, identity & conversation history? This cannot be undone.')) {
                      performAction('reset-memory')
                    }
                  }}
                  disabled={!!actionLoading}
                  className="flex items-center justify-between w-full bg-red-700 hover:bg-red-600 px-4 py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  <div className="text-left">
                    <div className="font-semibold">⚠️ Reset Agent Memory</div>
                    <div className="text-xs opacity-70">Wipe memory, identity & conversation history</div>
                  </div>
                  {actionLoading === 'reset-memory' ? <span className="animate-spin">⏳</span> : <span>→</span>}
                </button>
              </div>
            </div>

            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>📋</span> Tasks
              </h2>
              <div className="flex gap-2 mb-4 overflow-x-auto">
                {['all', 'recurring', 'chat', 'scheduled', 'completed'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTaskTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${
                      activeTaskTab === tab ? 'bg-white text-black' : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
              <div className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={taskInput}
                    onChange={(e) => setTaskInput(e.target.value)}
                    placeholder="Tell your agent what to do..."
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-white"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && taskInput.trim()) {
                        setTasks([...tasks, { id: Date.now().toString(), title: taskInput, status: 'pending', type: 'chat' }])
                        setTaskInput('')
                      }
                    }}
                  />
                  <button className="bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200">
                    Send
                  </button>
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <button className="bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg text-xs">🔍 Research</button>
                  <button className="bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg text-xs">📧 Draft email</button>
                  <button className="bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg text-xs">📈 Market update</button>
                  <button className="bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg text-xs">✍️ Write a post</button>
                </div>
              </div>
              <div className="space-y-2">
                {tasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    <div className="text-4xl mb-2">📋</div>
                    No tasks yet
                  </div>
                ) : (
                  tasks.filter(t => activeTaskTab === 'all' || t.status === activeTaskTab).map((task) => (
                    <div key={task.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
                      <span className="text-sm">{task.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        task.status === 'completed' ? 'bg-green-900 text-green-400' : 'bg-yellow-900 text-yellow-400'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>💓</span> Heartbeat
              </h2>
              <p className="text-sm text-gray-400 mb-4">Your agent's pulse. See when it last checked in and control how often it does.</p>
              
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                <span className="text-sm">On schedule</span>
              </div>
              
              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-2">Frequency</div>
                <div className="flex gap-2 flex-wrap">
                  {['1h', '3h', '6h', '12h', 'Off'].map((freq) => (
                    <button
                      key={freq}
                      onClick={() => setHeartbeatFreq(freq)}
                      className={`px-3 py-1.5 rounded-lg text-xs ${
                        heartbeatFreq === freq ? 'bg-white text-black' : 'bg-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-xs text-gray-500">Last seen</div>
                  <div className="text-sm">{lastSeen || 'Just now'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Next in</div>
                  <div className="text-sm">
                    {heartbeatFreq === 'Off' ? '—' : heartbeatFreq}
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Daily heartbeat pool</span>
                  <span>{heartbeatCredits} of 200 remaining</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${(200 - heartbeatCredits) / 2}%` }} />
                </div>
                <div className="text-xs text-gray-500 mt-2">Separate from your daily credits - heartbeats never eat into your quota.</div>
              </div>
            </div>

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

            <WalletCard />
            <AIModelCard plan={instance?.plan || 'starter'} />

            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>❓</span> Help & Support
              </h2>
              <div className="space-y-3 text-sm">
                <a href="https://raveculture.mintlify.app" className="flex items-center gap-2 text-gray-400 hover:text-gray-200">
                  <span>📚</span> Documentation
                </a>
                <a href="https://discord.com/invite/clawd" target="_blank" rel="noopener" className="flex items-center gap-2 text-gray-400 hover:text-gray-200">
                  <span>💬</span> Discord
                </a>
                <a href="mailto:rbasefm@icloud.com" className="flex items-center gap-2 text-gray-400 hover:text-gray-200">
                  <span>📧</span> Contact
                </a>
              </div>
            </div>
          </div>

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

          <div className="mt-6 bg-gradient-to-r from-white/20 to-gray-200/20 rounded-2xl p-6 border border-white/30">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold mb-1">🎁 Invite Friends, Get Free Months</h2>
                <p className="text-gray-400 text-sm mb-4">Share your link — get £10 credit per referral</p>
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
                    className="bg-white text-black hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-semibold"
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

function DashboardSidebar({ userName, credits = 0, plan, isOpen, onToggle }: { userName: string; credits?: number; plan?: string; isOpen: boolean; onToggle: () => void }) {
  const pathname = usePathname()
  return (
    <>
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}
      
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-gray-900 border-r border-gray-800 flex flex-col
        transform transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <button
          onClick={onToggle}
          className="md:hidden absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          aria-label="Close sidebar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <nav className="flex-1 p-4 overflow-y-auto pt-16 md:pt-4">
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={onToggle}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  pathname === item.href || pathname.startsWith(item.href + '/')
                    ? 'bg-white/20 text-white' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </div>

          <Link href="/billing" onClick={onToggle} className="block mt-8 p-4 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors">
            <div className="text-sm text-gray-400 mb-1">Your Plan</div>
            <div className="text-xl font-bold capitalize">{plan || 'Underground'}</div>
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-black">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{userName}</div>
              <div className="text-sm text-blue-400">Sign up</div>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>
      <HelpChat />
    </>
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
