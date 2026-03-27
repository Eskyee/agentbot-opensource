'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams, usePathname } from 'next/navigation'
import { Suspense } from 'react'
import { useCustomSession, customSignOut } from '@/app/lib/useCustomSession'
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

const navSections = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: '◈' },
      { label: 'Wallet', href: '/dashboard/wallet', icon: '◎' },
    ]
  },
  {
    label: 'Agents',
    items: [
      { label: 'Fleet', href: '/dashboard/fleet', icon: '⬡' },
      { label: 'Colony', href: '/dashboard/colony', icon: '◆' },
      { label: 'Swarms', href: '/dashboard/swarms', icon: '◇' },
      { label: 'Workflows', href: '/dashboard/workflows', icon: '▹' },
    ]
  },
  {
    label: 'Intelligence',
    items: [
      { label: 'Daily Brief', href: '/dashboard/daily-brief', icon: '☉' },
      { label: 'Market Intel', href: '/dashboard/market-intel', icon: '◉' },
      { label: 'Signals', href: '/dashboard/signals', icon: '⚡' },
      { label: 'Memory', href: '/dashboard/memory', icon: '◐' },
      { label: 'Tasks', href: '/dashboard/tasks', icon: '☑' },
    ]
  },
  {
    label: 'Tools',
    items: [
      { label: 'Calendar', href: '/dashboard/calendar', icon: '◌' },
      { label: 'Files', href: '/dashboard/files', icon: '▣' },
      { label: 'Skills', href: '/dashboard/skills', icon: '✦' },
      { label: 'Personality', href: '/dashboard/personality', icon: '◐' },
      { label: 'Tech Updates', href: '/dashboard/tech-updates', icon: '↻' },
    ]
  },
  {
    label: 'Platform',
    items: [
      { label: 'Cost Tracking', href: '/dashboard/cost', icon: '$' },
      { label: 'System Pulse', href: '/dashboard/system-pulse', icon: '♥' },
      { label: 'Heartbeat', href: '/dashboard/heartbeat', icon: '♡' },
      { label: 'API Keys', href: '/dashboard/keys', icon: '⚿' },
    ]
  },
  {
    label: 'Media',
    items: [
      { label: 'DJ Stream', href: '/dashboard/dj-stream', icon: '♫' },
      { label: 'Trading', href: '/dashboard/trading', icon: '↕' },
      { label: 'Verify', href: '/dashboard/verify', icon: '✓' },
    ]
  },
  {
    label: 'Account',
    items: [
      { label: 'Billing', href: '/billing', icon: '☆' },
      { label: 'Settings', href: '/settings', icon: '⚙' },
      { label: 'Marketplace', href: '/marketplace', icon: '⬡' },
    ]
  },
]

function DashboardContent() {
  const pathname = usePathname()
  const { data: session, status } = useCustomSession()
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
  const [activities, setActivities] = useState<{id: string; action: string; agent: string; time: string; status: string}[]>([
    { id: '1', action: 'Agent online', agent: 'Atlas', time: '2 min ago', status: 'green' },
    { id: '2', action: 'Calendar sync completed', agent: 'Atlas', time: '8 min ago', status: 'blue' },
    { id: '3', action: 'WhatsApp session started', agent: 'Atlas', time: '22 min ago', status: 'blue' },
    { id: '4', action: 'Skill installed', agent: 'Atlas', time: '1 hour ago', status: 'zinc' },
    { id: '5', action: 'Uptime check passed', agent: 'Watchtower', time: '1 hour ago', status: 'green' },
  ])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?callbackUrl=/dashboard')
    }
  }, [status, router])

    useEffect(() => { (async () => {
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
      
      // If no session, show login prompt
      if (!session) {
        setError('Please sign in to view your dashboard')
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
      
      // Fallback: fetch from API if no localStorage data
      if (!userId) {
        try {
          const agentsRes = await fetch('/api/agents')
          const agentsData = await agentsRes.json()
          if (agentsData.agents && agentsData.agents.length > 0) {
            userId = agentsData.agents[0].userId
            botUsername = agentsData.agents[0].botUsername || ''
          }
        } catch {}
      }

      // Fallback: check DB for OpenClaw instance
      if (!userId) {
        try {
          const openclawRes = await fetch('/api/user/openclaw')
          const openclawData = await openclawRes.json()
          if (openclawData.openclawInstanceId) {
            userId = openclawData.openclawInstanceId
            // Also restore localStorage for future visits
            if (openclawData.openclawUrl) {
              localStorage.setItem('agentbot_instance', JSON.stringify({
                userId: openclawData.openclawInstanceId,
                url: openclawData.openclawUrl,
              }))
            }
          }
        } catch {}
      }

      if (!userId) {
        setError('No instance found. Please deploy first.')
        setLoading(false)
        return
      }
      
      fetchInstance(userId, botUsername)
      fetchCredits()
    })(); // eslint-disable-next-line react-hooks/exhaustive-deps
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
       <div className="flex items-center justify-center mt-[4rem] h-[calc(100vh-4rem)] bg-black font-mono">
         <div className="text-left">
           <div className="w-2 h-2 rounded-full bg-white animate-pulse mx-auto mb-4" />
           <p className="text-zinc-400 text-sm">Loading your instance...</p>
         </div>
       </div>
     )
   }

  if (error) {
    const isAuthError = error.includes('sign in') || error.includes('Unauthorized')
    const isNoInstance = error.includes('deploy first') || error.includes('No instance')
    const isInstanceError = !isAuthError && !isNoInstance // backend returned error for existing instance

    let title = 'Deploy your first agent'
    let cta = { label: 'Deploy Now', href: '/onboard' }

    if (isAuthError) {
      title = 'Sign in required'
      cta = { label: 'Sign In', href: '/login?callbackUrl=/dashboard' }
    } else if (isInstanceError) {
      title = 'Instance unavailable'
      cta = { label: 'View Status', href: '/dashboard/system-pulse' }
    }

    return (
      <div className="flex h-screen bg-black font-mono">
        <DashboardSidebar
          userName={userName}
          plan={instance?.plan}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-left max-w-md">
            <h1 className="text-2xl font-bold uppercase tracking-tighter mb-4">{title}</h1>
            <p className="text-zinc-400 text-sm mb-8">{error}</p>
            <Link
              href={cta.href}
              className="inline-block bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
            >
              {cta.label}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!instance) return null

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center h-screen bg-black font-mono">
        <div className="text-left">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse mx-auto mb-4" />
          <p className="text-zinc-400 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  const isRunning = instance.status === 'running'
  const startedAt = instance.startedAt

  const activityDotColor = (s: string) => {
    if (s === 'green') return 'bg-green-400'
    if (s === 'blue') return 'bg-blue-500'
    return 'bg-zinc-500'
  }

  return (
    <div className="flex min-h-screen bg-black font-mono pt-14">
      <DashboardSidebar
        userName={userName}
        credits={credits}
        plan={instance?.plan}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <header className="sticky top-14 z-30 bg-zinc-950 border-b border-zinc-900 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors z-50"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="text-sm font-bold uppercase tracking-tighter">◈ Mission Control</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/dashboard/wallet"
              className="hidden sm:inline-block border border-zinc-800 px-4 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
            >
              ◎ Wallet
            </a>
            <a
              href="/agents"
              className="bg-white text-black px-4 sm:px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
            >
              + New Agent
            </a>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-8">
          {/* Stats Cards */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="bg-zinc-900 border border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-widest text-zinc-600">Active Agents</span>
              </div>
              <div className="text-3xl font-bold">1<span className="text-lg text-zinc-500 font-normal">/6</span></div>
              <div className="text-xs text-green-400 mt-1">+2 today</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-widest text-zinc-600">Token Spend</span>
              </div>
              <div className="text-3xl font-bold">£12.40</div>
              <div className="text-xs text-green-400 mt-1">+8.2% this month</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-widest text-zinc-600">Sessions</span>
              </div>
              <div className="text-3xl font-bold">11</div>
              <div className="text-xs text-zinc-500 mt-1">active now</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-widest text-zinc-600">Skills</span>
              </div>
              <div className="text-3xl font-bold">8<span className="text-lg text-zinc-500 font-normal">/14</span></div>
              <div className="text-xs text-blue-500 mt-1">+2 this week</div>
            </div>
          </div>

          {/* System Vitals */}
          <div className="grid gap-4 md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            <div className="bg-zinc-900 border border-zinc-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-widest text-zinc-600">CPU</span>
                <span className="text-zinc-500 text-sm">{stats?.cpu || '34%'}</span>
              </div>
              <div className="h-1.5 bg-zinc-800 overflow-hidden">
                <div className="h-full bg-white" style={{ width: stats?.cpu || '34%' }} />
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-widest text-zinc-600">Memory</span>
                <span className="text-zinc-500 text-sm">{stats?.memory || '62%'}</span>
              </div>
              <div className="h-1.5 bg-zinc-800 overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: stats?.memory || '62%' }} />
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-widest text-zinc-600">Disk</span>
                <span className="text-zinc-500 text-sm">45%</span>
              </div>
              <div className="h-1.5 bg-zinc-800 overflow-hidden">
                <div className="h-full bg-white" style={{ width: '45%' }} />
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-zinc-900 border border-zinc-800 mb-8">
            <div className="p-4 border-b border-zinc-800">
              <h2 className="text-xs font-bold uppercase tracking-widest">Recent Activity</h2>
            </div>
            <div>
              {activities.map((activity, i) => (
                <div key={activity.id} className={`flex items-center gap-4 p-4 hover:bg-zinc-800/50 transition-colors ${i > 0 ? 'border-t border-zinc-900' : ''}`}>
                  <span className={`w-2 h-2 rounded-full ${activityDotColor(activity.status)}`} />
                  <div className="flex-1">
                    <div className="text-sm text-zinc-400">{activity.action}</div>
                    <div className="text-[10px] uppercase tracking-widest text-zinc-600">{activity.agent}</div>
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-zinc-600">{activity.time}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-zinc-900 border border-zinc-800 p-6">
              <h2 className="text-xs font-bold uppercase tracking-widest mb-4">
                Agent Details
              </h2>
              <dl className="space-y-3">
                {instance?.botUsername && (
                  <div>
                    <dt className="text-[10px] uppercase tracking-widest text-zinc-600">Telegram</dt>
                    <dd className="font-mono">
                      <a 
                        href={`https://t.me/${instance?.botUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        @{instance?.botUsername}
                      </a>
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-[10px] uppercase tracking-widest text-zinc-600">Instance ID</dt>
                  <dd className="font-mono text-sm text-zinc-400">{instance?.userId}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-widest text-zinc-600">URL</dt>
                  <dd className="font-mono text-sm text-zinc-400 break-all">
                    <a href={instance?.url} target="_blank" rel="noopener noreferrer" className="text-white hover:underline">
                      {instance?.subdomain}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-widest text-zinc-600">Plan</dt>
                  <dd className="text-zinc-400 capitalize">{instance?.plan || 'free'}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-widest text-zinc-600">Version</dt>
                  <dd className="font-mono text-zinc-400">{instance?.openclawVersion || '2026.2.26'}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-widest text-zinc-600">Started</dt>
                  <dd className="text-zinc-400">{startedAt ? new Date(startedAt).toLocaleString() : 'N/A'}</dd>
                </div>
              </dl>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-6">
              <h2 className="text-xs font-bold uppercase tracking-widest mb-4">
                Stats & Health
              </h2>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-zinc-500">CPU</dt>
                  <dd className="text-zinc-400 font-mono">{stats?.cpu || 'N/A'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Memory</dt>
                  <dd className="text-zinc-400 font-mono">{stats?.memory || 'N/A'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Uptime</dt>
                  <dd className="text-zinc-400 font-mono">{stats?.uptime || 'N/A'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Messages</dt>
                  <dd className="text-zinc-400 font-mono">{stats?.messages ?? 'N/A'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Errors</dt>
                  <dd className="text-zinc-400 font-mono">{stats?.errors ?? 'N/A'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Health</dt>
                  <dd className={`font-mono ${stats?.health === 'healthy' ? 'text-green-400' : 'text-yellow-400'}`}>
                    {stats?.health || 'N/A'}
                  </dd>
                </div>
              </dl>
              
              <div className="mt-4 space-y-3">
                <div>
                  <div className="flex justify-between text-[10px] uppercase tracking-widest text-zinc-600 mb-1">
                    <span>CPU</span>
                    <span>{stats?.cpu || '0%'}</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 overflow-hidden">
                    <div className={`h-full bg-white ${getBarWidthClass(stats?.cpu)}`} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] uppercase tracking-widest text-zinc-600 mb-1">
                    <span>Memory</span>
                    <span>{stats?.memory || '0%'}</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 overflow-hidden">
                    <div className={`h-full bg-blue-500 ${getBarWidthClass(stats?.memory)}`} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-6">
              <h2 className="text-xs font-bold uppercase tracking-widest mb-4">
                Quick Actions
              </h2>
              <div className="space-y-3">
                <a
                  href={instance?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between w-full bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
                >
                  <span>Open OpenClaw UI</span>
                  <span>→</span>
                </a>
                {instance?.botUsername && (
                  <a
                    href={`https://t.me/${instance?.botUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between w-full border border-zinc-800 px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
                  >
                    <span>Open Telegram</span>
                    <span>→</span>
                  </a>
                )}
                <button
                  onClick={() => performAction('update')}
                  disabled={!!actionLoading}
                  className="flex items-center justify-between w-full border border-zinc-800 px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors disabled:opacity-50"
                >
                  <span>Update</span>
                  {actionLoading === 'update' ? <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> : <span>↑</span>}
                </button>
                <button
                  onClick={() => performAction('restart')}
                  disabled={!!actionLoading}
                  className="flex items-center justify-between w-full border border-zinc-800 px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors disabled:opacity-50"
                >
                  <span>Restart</span>
                  {actionLoading === 'restart' ? <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> : <span>↻</span>}
                </button>
                {isRunning ? (
                  <button
                    onClick={() => performAction('stop')}
                    disabled={!!actionLoading}
                    className="flex items-center justify-between w-full border border-red-500/30 px-6 py-3 text-xs font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  >
                    <span>Stop</span>
                    {actionLoading === 'stop' ? <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" /> : <span>■</span>}
                  </button>
                ) : (
                  <button
                    onClick={() => performAction('start')}
                    disabled={!!actionLoading}
                    className="flex items-center justify-between w-full bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors disabled:opacity-50"
                  >
                    <span>Start</span>
                    {actionLoading === 'start' ? <span className="w-2 h-2 rounded-full bg-black animate-pulse" /> : <span>▶</span>}
                  </button>
                )}
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-6">
              <h2 className="text-xs font-bold uppercase tracking-widest mb-4">
                Control Panel
              </h2>
              <div className="space-y-3">
                <button
                  onClick={() => performAction('repair')}
                  disabled={!!actionLoading}
                  className="flex items-center justify-between w-full border border-zinc-800 px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors disabled:opacity-50"
                >
                  <div className="text-left">
                    <div>Repair Agent</div>
                    <div className="text-[10px] font-normal normal-case tracking-normal text-zinc-600 mt-1">Full reconfigure — fixes broken proxy, tokens, config</div>
                  </div>
                  {actionLoading === 'repair' ? <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> : <span>→</span>}
                </button>
                
                <div className="border border-zinc-800 p-4">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Gateway Token</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      readOnly
                      value={instance?.gatewayToken ? '••••••••••••' : ''}
                      placeholder="Click to load token"
                      className="flex-1 bg-zinc-900 border border-zinc-800 px-4 py-2 text-sm font-mono focus:outline-none focus:border-zinc-600"
                    />
                    <button
                      onClick={handleCopyToken}
                      className="bg-white text-black px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="text-[10px] text-zinc-600 mt-2">
                    Paste this token in the Control UI settings to connect.
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    if (confirm('Wipe memory, identity & conversation history? This cannot be undone.')) {
                      performAction('reset-memory')
                    }
                  }}
                  disabled={!!actionLoading}
                  className="flex items-center justify-between w-full border border-red-500/30 px-6 py-3 text-xs font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                >
                  <div className="text-left">
                    <div>Reset Agent Memory</div>
                    <div className="text-[10px] font-normal normal-case tracking-normal text-red-400/60 mt-1">Wipe memory, identity & conversation history</div>
                  </div>
                  {actionLoading === 'reset-memory' ? <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" /> : <span>→</span>}
                </button>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-6">
              <h2 className="text-xs font-bold uppercase tracking-widest mb-4">
                Tasks
              </h2>
              <div className="flex gap-2 mb-4 overflow-x-auto">
                {['all', 'recurring', 'chat', 'scheduled', 'completed'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTaskTab(tab)}
                    className={`border px-3 py-1.5 text-[10px] uppercase tracking-widest whitespace-nowrap transition-colors ${
                      activeTaskTab === tab
                        ? 'bg-white text-black border-white'
                        : 'border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
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
                    className="flex-1 bg-zinc-900 border border-zinc-800 px-4 py-2 text-sm focus:outline-none focus:border-zinc-600"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && taskInput.trim()) {
                        setTasks([...tasks, { id: Date.now().toString(), title: taskInput, status: 'pending', type: 'chat' }])
                        setTaskInput('')
                      }
                    }}
                  />
                  <button className="bg-white text-black px-6 py-2 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors">
                    Send
                  </button>
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <button className="border border-zinc-800 px-3 py-1.5 text-[10px] uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors">Research</button>
                  <button className="border border-zinc-800 px-3 py-1.5 text-[10px] uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors">Draft email</button>
                  <button className="border border-zinc-800 px-3 py-1.5 text-[10px] uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors">Market update</button>
                  <button className="border border-zinc-800 px-3 py-1.5 text-[10px] uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors">Write a post</button>
                </div>
              </div>
              <div className="space-y-2">
                {tasks.length === 0 ? (
                  <div className="py-8 text-zinc-500 text-sm">
                    No tasks yet
                  </div>
                ) : (
                  tasks.filter(t => activeTaskTab === 'all' || t.status === activeTaskTab).map((task) => (
                    <div key={task.id} className="flex items-center justify-between border border-zinc-800 px-4 py-2">
                      <span className="text-sm text-zinc-400">{task.title}</span>
                      <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 ${
                        task.status === 'completed' ? 'text-green-400' : 'text-yellow-400'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-6">
              <h2 className="text-xs font-bold uppercase tracking-widest mb-4">
                Heartbeat
              </h2>
              <p className="text-sm text-zinc-400 mb-4">Your agent&apos;s pulse. See when it last checked in and control how often it does.</p>
              
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                <span className="text-sm text-zinc-400">On schedule</span>
              </div>
              
              <div className="mb-4">
                <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Frequency</div>
                <div className="flex gap-2 flex-wrap">
                  {['1h', '3h', '6h', '12h', 'Off'].map((freq) => (
                    <button
                      key={freq}
                      onClick={() => setHeartbeatFreq(freq)}
                      className={`border px-3 py-1.5 text-[10px] uppercase tracking-widest transition-colors ${
                        heartbeatFreq === freq
                          ? 'bg-white text-black border-white'
                          : 'border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
                      }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-zinc-600">Last seen</div>
                  <div className="text-sm text-zinc-400">{lastSeen || 'Just now'}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-zinc-600">Next in</div>
                  <div className="text-sm text-zinc-400">
                    {heartbeatFreq === 'Off' ? '—' : heartbeatFreq}
                  </div>
                </div>
              </div>
              
              <div className="border border-zinc-800 p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-zinc-400">Daily heartbeat pool</span>
                  <span className="text-zinc-400">{heartbeatCredits} of 200 remaining</span>
                </div>
                <div className="h-1.5 bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-white" style={{ width: `${(200 - heartbeatCredits) / 2}%` }} />
                </div>
                <div className="text-[10px] text-zinc-600 mt-2">Separate from your daily credits — heartbeats never eat into your quota.</div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-6">
              <h2 className="text-xs font-bold uppercase tracking-widest mb-4">
                Active Skills
              </h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between border border-zinc-800 px-4 py-2 text-sm">
                  <span className="text-zinc-400">Web Scraping</span>
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                </div>
                <div className="flex items-center justify-between border border-zinc-800 px-4 py-2 text-sm">
                  <span className="text-zinc-400">Email</span>
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                </div>
                <div className="flex items-center justify-between border border-zinc-800 px-4 py-2 text-sm">
                  <span className="text-zinc-400">Calendar</span>
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                </div>
                <a href="/marketplace" className="block text-sm text-zinc-400 hover:text-white mt-3 transition-colors">
                  + Add more skills
                </a>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-6">
              <h2 className="text-xs font-bold uppercase tracking-widest mb-4">
                Channels
              </h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between border border-zinc-800 px-4 py-2 text-sm">
                  <span className="text-zinc-400">Telegram</span>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-[10px] uppercase tracking-widest text-zinc-500">Connected</span>
                  </div>
                </div>
                <div className="flex items-center justify-between border border-zinc-800 px-4 py-2 text-sm">
                  <span className="text-zinc-400">Discord</span>
                  <span className="text-[10px] uppercase tracking-widest text-zinc-600">Not connected</span>
                </div>
                <div className="flex items-center justify-between border border-zinc-800 px-4 py-2 text-sm">
                  <span className="text-zinc-400">WhatsApp</span>
                  <span className="text-[10px] uppercase tracking-widest text-zinc-600">Not connected</span>
                </div>
              </div>
            </div>

            <WalletCard />
            <AIModelCard plan={instance?.plan || 'free'} />

            <div className="bg-zinc-900 border border-zinc-800 p-6">
              <h2 className="text-xs font-bold uppercase tracking-widest mb-4">
                Help & Support
              </h2>
              <div className="space-y-3 text-sm">
                <a href="/docs" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                  Documentation
                </a>
                <a href="https://discord.com/invite/clawd" target="_blank" rel="noopener" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                  Discord
                </a>
                <a href="mailto:YOUR_ADMIN_EMAIL_2" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                  Contact
                </a>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-zinc-900 border border-zinc-800 p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest mb-4">Recent Activity</h2>
            <div className="text-zinc-400 text-sm space-y-2">
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                <span>Instance started</span>
                <span className="ml-auto text-zinc-600 text-[10px] uppercase tracking-widest">{startedAt ? new Date(startedAt).toLocaleTimeString() : 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                <span>Connected to Telegram</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                <span>Skills loaded</span>
              </div>
            </div>
          </div>

          <div className="mt-6 border border-zinc-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest mb-1">Invite Friends, Get Free Months</h2>
                <p className="text-zinc-400 text-sm mb-4">Share your link — get £10 credit per referral</p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <input
                    type="text"
                    readOnly
                    value={`https://agentbot.raveculture.xyz/ref/${instance?.userId}`}
                    className="bg-zinc-900 border border-zinc-800 px-4 py-2 text-sm text-zinc-400 w-full sm:w-64 font-mono focus:outline-none"
                    placeholder="Referral link"
                    title="Referral link"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(`https://agentbot.raveculture.xyz/ref/${instance?.userId}`)}
                    className="bg-white text-black px-6 py-2 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors whitespace-nowrap"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        </main>
      </div>
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
        w-64 bg-zinc-950 border-r border-zinc-900 flex flex-col font-mono
        transform transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <button
          onClick={onToggle}
          className="md:hidden absolute top-4 right-4 p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          aria-label="Close sidebar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <nav className="flex-1 p-4 overflow-y-auto pt-16 md:pt-4">
          {navSections.map((section, i) => (
            <div key={section.label} className={i > 0 ? 'mt-4' : ''}>
              <div className="text-[9px] uppercase tracking-[0.15em] text-zinc-700 px-4 mb-1.5">
                {section.label}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={onToggle}
                    className={`flex items-center gap-2.5 px-4 py-2 text-xs transition-colors ${
                      pathname === item.href || pathname.startsWith(item.href + '/')
                        ? 'bg-zinc-900 text-white'
                        : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'
                    }`}
                  >
                    <span className="text-[10px] w-4 text-left opacity-60">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          <Link href="/billing" onClick={onToggle} className="block mt-8 border border-zinc-800 p-4 hover:border-zinc-700 transition-colors">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Your Plan</div>
            <div className="text-xl font-bold capitalize">{plan || 'Solo'}</div>
          </Link>
        </nav>

        <div className="p-4 border-t border-zinc-900">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-white">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate text-sm">{userName}</div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-600">Sign up</div>
            </div>
          </div>
          <button
            onClick={() => customSignOut()}
            className="w-full flex items-center justify-center gap-2 border border-zinc-800 px-4 py-2 text-sm text-zinc-500 hover:text-white hover:border-zinc-600 transition-colors"
          >
            Sign Out
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
      <div className="flex items-center justify-center h-screen bg-black font-mono">
        <div className="text-left">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse mx-auto mb-4" />
          <p className="text-zinc-400 text-sm">Loading...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
