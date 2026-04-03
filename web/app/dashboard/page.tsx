'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams, usePathname } from 'next/navigation'
import { Suspense } from 'react'
import { useCustomSession } from '@/app/lib/useCustomSession'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { DashboardSidebar } from '@/app/components/DashboardSidebar'
import { PermissionGate } from '@/app/components/shared/PermissionGate'
import { TrialBanner } from '@/app/components/TrialBanner'
import { DEFAULT_OPENCLAW_GATEWAY_URL } from '@/app/lib/openclaw-config'


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
  /** Auto-connect URL with token in #fragment */
  controlUiUrl?: string
  verified?: boolean
  verificationType?: string | null
  attestationUid?: string | null
  verifiedAt?: string | null
}

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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [gatewayStatus, setGatewayStatus] = useState<{health: string; sessions: {total: number; active: number}; cron: {total: number; enabled: number}} | null>(null)
  const [statusChecks, setStatusChecks] = useState<{ name: string; status: 'ok' | 'degraded' | 'down'; detail?: string }[]>([])
  const [autoPairHealth, setAutoPairHealth] = useState<'ready' | 'missing' | 'loading'>('loading')
  const [healingAttempted, setHealingAttempted] = useState(false)

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
      fetchGatewayStatus()
      fetchStatusChecks()
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

  const fetchGatewayStatus = async () => {
    try {
      const res = await fetch('/api/gateway/status')
      if (res.ok) {
        const data = await res.json()
        setGatewayStatus(data)
      }
    } catch (e) {
      console.error('Failed to fetch gateway status:', e)
    }
  }

  const fetchStatusChecks = async () => {
    try {
      const res = await fetch('/api/dashboard/health')
      if (!res.ok) return
      const body = await res.json()
      setStatusChecks(body.services || [])
    } catch {
      setStatusChecks([{ name: 'Service layer', status: 'down', detail: 'unreachable' }])
    }
  }

  const healAutoPair = async () => {
    setHealingAttempted(true)
    try {
      const res = await fetch('/api/support/heal-token', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        if (data.healed) {
          setAutoPairHealth('ready')
        }
      }
    } catch (error) {
      console.error('Auto Pair heal failed', error)
    }
  }

  useEffect(() => {
    const interval = setInterval(fetchStatusChecks, 30_000)
    return () => clearInterval(interval)
  }, [])

  const fetchInstance = async (userId: string, botUsername: string) => {
    try {
      // Fetch instance data and gateway token in parallel
      const [res, tokenRes] = await Promise.all([
        fetch(`/api/instance/${userId}`),
        fetch('/api/user/openclaw'),
      ])
      const data = await res.json()
      const tokenData = await tokenRes.json().catch(() => ({}))

      if (data.error) {
        setError(data.error)
      } else {
        // Prefer the user's persisted OpenClaw instance URL. Only fall back to the
        // shared gateway when the user has no instance-specific URL yet.
        const preferredUrl = tokenData.openclawUrl || data.url
        const fallbackUrl = process.env.NEXT_PUBLIC_OPENCLAW_GATEWAY_URL || DEFAULT_OPENCLAW_GATEWAY_URL
        const url = String(preferredUrl || fallbackUrl).replace(/\/$/, '')
        const gatewayToken = tokenData.gatewayToken || undefined
        // Control UI auto-connects via hash fragment — token + gateway URL
        // Hash is never sent to server, so it's safe to embed the token
        const controlUiUrl = gatewayToken
          ? `${url}/chat?session=main#token=${encodeURIComponent(gatewayToken)}&gatewayUrl=${encodeURIComponent(`wss://${new URL(url).host}`)}`
          : `${url}/chat?session=main`
        const resolvedUserId = tokenData.openclawInstanceId || data.userId || userId
        localStorage.setItem('agentbot_instance', JSON.stringify({
          userId: resolvedUserId,
          url,
          botUsername,
        }))
        setInstance({ ...data, userId: resolvedUserId, url, botUsername, gatewayToken, controlUiUrl })
        fetchStats(resolvedUserId)
        const health = gatewayToken ? 'ready' : 'missing'
        setAutoPairHealth(health)
        if (health === 'missing' && !healingAttempted) {
          healAutoPair()
        }
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

  return (
    <div className="flex min-h-screen bg-black font-mono">
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
          <TrialBanner />
          <div className="p-4 lg:p-8">
          {/* Permission Gate — shows pending approval requests */}
          <PermissionGate agentId={instance?.userId} />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {statusChecks.map((check) => (
              <div key={check.name} className="border border-zinc-800 bg-zinc-950 p-4 flex items-center justify-between rounded-lg">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-600">{check.name}</p>
                  <p className="text-lg font-mono text-white">
                    {check.status === 'ok' ? 'Working' : check.status === 'degraded' ? 'Wired, degraded' : 'Down'}
                  </p>
                  {check.detail && <p className="text-[10px] text-zinc-500 mt-1">{check.detail}</p>}
                </div>
                <span className={`h-3 w-3 rounded-full ${check.status === 'ok' ? 'bg-green-400' : check.status === 'degraded' ? 'bg-yellow-400' : 'bg-red-500'}`} />
              </div>
            ))}
          </div>

          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
                  <dd className="font-mono text-zinc-400">{instance?.openclawVersion || '2026.3.24'}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-widest text-zinc-600">Started</dt>
                  <dd className="text-zinc-400">{startedAt ? new Date(startedAt).toLocaleString() : 'N/A'}</dd>
                </div>
              </dl>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-6">
              <h2 className="text-xs font-bold uppercase tracking-widest mb-4">
                Instance Status
              </h2>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-zinc-500">OpenClaw</dt>
                  <dd className={`font-mono ${gatewayStatus?.health === 'healthy' ? 'text-green-400' : 'text-yellow-400'}`}>
                    {gatewayStatus?.health || 'checking...'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-500">State</dt>
                  <dd className={`font-mono ${isRunning ? 'text-green-400' : 'text-zinc-400'}`}>
                    {instance?.status || 'unknown'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Gateway Sessions</dt>
                  <dd className="text-zinc-400 font-mono">{gatewayStatus?.sessions.active ?? 0} active / {gatewayStatus?.sessions.total ?? 0} total</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Cron</dt>
                  <dd className="text-zinc-400 font-mono">{gatewayStatus?.cron.enabled ?? 0} enabled / {gatewayStatus?.cron.total ?? 0} total</dd>
                </div>
              </dl>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-6">
              <h2 className="text-xs font-bold uppercase tracking-widest mb-4">
                Quick Actions
              </h2>
              <div className="space-y-3">
                <a
                  href={instance?.controlUiUrl || instance?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between w-full bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
                >
                  <span>Open OpenClaw</span>
                  <span>→</span>
                </a>
                <div className="border border-zinc-800 px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-600">Auto Pairing</p>
                    <span
                      className={`h-2 w-2 rounded-full ${
                        autoPairHealth === 'ready'
                          ? 'bg-green-400'
                          : autoPairHealth === 'missing'
                            ? 'bg-yellow-400'
                            : 'bg-zinc-600 animate-pulse'
                      }`}
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    {autoPairHealth === 'ready' && 'Control UI auto-connects with the stored gateway token.'}
                    {autoPairHealth === 'missing' && 'No valid gateway token detected — refresh the dashboard or reauthenticate to restore pairing.'}
                    {autoPairHealth === 'loading' && 'Checking gateway token…'}
                  </p>
                  <button
                    onClick={() => {
                      setAutoPairHealth('loading')
                      fetchInstance(instance.userId, instance.botUsername || '')
                    }}
                    className="mt-2 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-300 hover:text-white"
                  >
                    Refresh token
                    <span className="text-[10px] text-zinc-500">↺</span>
                  </button>
                </div>
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
                Maintenance
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
                Help & Support
              </h2>
              <div className="space-y-3 text-sm">
                <a href="/docs" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                  Documentation
                </a>
                <a href="https://discord.gg/vTPG4vdV6D" target="_blank" rel="noopener" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                  Discord
                </a>
                <a href="mailto:rbasefm@icloud.com" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                  Contact
                </a>
              </div>
            </div>
          </div>
        </div>
        </main>
      </div>
    </div>
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
