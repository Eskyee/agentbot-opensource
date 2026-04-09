'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams, usePathname } from 'next/navigation'
import { Suspense } from 'react'
import { useCustomSession } from '@/app/lib/useCustomSession'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { toast } from 'sonner'
import { DashboardSidebar } from '@/app/components/DashboardSidebar'
import { StatusBadge } from '@/app/components/shared/StatusBadge'
import { ConfirmDialog } from '@/app/components/shared/ConfirmDialog'
import { PermissionGate } from '@/app/components/shared/PermissionGate'
import { TrialBanner } from '@/app/components/TrialBanner'
import { DEFAULT_OPENCLAW_GATEWAY_URL } from '@/app/lib/openclaw-config'
import { buildOpenClawControlUrl, OPENCLAW_CONTROLS_ENABLED } from '@/app/lib/openclaw-control'
import { ensureCompatibility } from '@/app/lib/openclaw-compatibility'


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

interface DashboardBootstrapData {
  credits: number
  plan?: string | null
  openclawUrl?: string | null
  openclawInstanceId?: string | null
  gatewayToken?: string | null
}

type ConfirmAction = {
  action: 'stop' | 'reset-memory'
  title: string
  description: string
  confirmLabel: string
  pendingLabel: string
  variant: 'danger' | 'warning' | 'default'
}

const CONFIRM_ACTIONS: Record<string, ConfirmAction> = {
  stop: {
    action: 'stop',
    title: 'Stop Agent',
    description: 'This will stop your agent container. It will go offline and stop responding to messages until you start it again.',
    confirmLabel: 'Stop Agent',
    pendingLabel: 'Stopping...',
    variant: 'danger',
  },
  'reset-memory': {
    action: 'reset-memory',
    title: 'Reset Agent Memory',
    description: 'This will permanently wipe all memory, identity, and conversation history. This cannot be undone.',
    confirmLabel: 'Reset Memory',
    pendingLabel: 'Resetting...',
    variant: 'danger',
  },
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
  const [bootstrap, setBootstrap] = useState<DashboardBootstrapData | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [gatewayStatus, setGatewayStatus] = useState<{
    health: string
    sessions: { total: number; active: number; available?: boolean; error?: string | null }
    cron: { total: number; enabled: number; available?: boolean; error?: string | null }
  } | null>(null)
  const [statusChecks, setStatusChecks] = useState<{ name: string; status: 'ok' | 'degraded' | 'down'; detail?: string }[]>([])
  const [autoPairHealth, setAutoPairHealth] = useState<'ready' | 'missing' | 'loading'>('loading')
  const [healingAttempted, setHealingAttempted] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmAction | null>(null)
  const controlsEnabled = OPENCLAW_CONTROLS_ENABLED

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

      fetchGatewayStatus()
      fetchStatusChecks()
      
      let userId = urlUserId
      let botUsername = ''
      
      if (storedData) {
        const parsed = JSON.parse(storedData)
        if (!userId) userId = parsed.userId
        botUsername = parsed.botUsername || ''
      }
      
      // Prefer the canonical OpenClaw record in the DB and hydrate credits at the same time.
      if (!userId) {
        try {
          const bootstrapRes = await fetch('/api/dashboard/bootstrap')
          const bootstrapData = await bootstrapRes.json()
          setBootstrap(bootstrapData)
          setCredits(bootstrapData.credits || 0)
          if (bootstrapData.openclawInstanceId) {
            userId = bootstrapData.openclawInstanceId
            // Also restore localStorage for future visits
            if (bootstrapData.openclawUrl) {
              localStorage.setItem('agentbot_instance', JSON.stringify({
                userId: bootstrapData.openclawInstanceId,
                url: bootstrapData.openclawUrl,
              }))
            }
          }
        } catch {}
      } else {
        fetchBootstrap()
      }

      // Legacy fallback for older accounts that still rely on the agents route.
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

      if (!userId) {
        setError('No instance found. Please deploy first.')
        setLoading(false)
        return
      }
      
      fetchInstance(userId, botUsername)
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

  const fetchBootstrap = async () => {
    try {
      const res = await fetch('/api/dashboard/bootstrap')
      if (!res.ok) return
      const data = await res.json()
      setBootstrap(data)
      setCredits(data.credits || 0)
    } catch (e) {
      console.error('Failed to fetch dashboard bootstrap:', e)
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
      // First ensure OpenClaw 2026.4.2 compatibility
      const compatibility = await fetch('/api/openclaw/ensure-compatibility', { method: 'POST' })
      if (compatibility.ok) {
        const compatData = await compatibility.json()
        if (compatData.fixes?.length > 0) {
          console.log('Applied compatibility fixes:', compatData.fixes)
        }
      }

      // Now heal the token
      const res = await fetch('/api/support/heal-token', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        if (data.healed) {
          setAutoPairHealth('ready')
          // Update instance with new token
          if (data.token && instance) {
            const newControlUiUrl = buildOpenClawControlUrl({
              view: 'chat',
              gatewayUrl: instance.url,
              gatewayToken: data.token,
              session: 'main',
            })
            setInstance({ ...instance, gatewayToken: data.token, controlUiUrl: newControlUiUrl })
          }
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
      const res = await fetch(`/api/instance/${userId}`)
      const data = await res.json()

      if (data.error) {
        setError(data.error)
      } else {
        // Prefer the user's persisted OpenClaw instance URL. Only fall back to the
        // shared gateway when the user has no instance-specific URL yet.
        const preferredUrl = bootstrap?.openclawUrl || data.url
        const fallbackUrl = process.env.NEXT_PUBLIC_OPENCLAW_GATEWAY_URL || DEFAULT_OPENCLAW_GATEWAY_URL
        const url = String(preferredUrl || fallbackUrl).replace(/\/$/, '')
        const gatewayToken = bootstrap?.gatewayToken || undefined
        // Control UI auto-connects via hash fragment — token + gateway URL
        // Hash is never sent to server, so it's safe to embed the token
        const controlUiUrl = buildOpenClawControlUrl({
          view: 'chat',
          gatewayUrl: url,
          gatewayToken,
          session: 'main',
        })
        const resolvedUserId = bootstrap?.openclawInstanceId || data.userId || userId
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
    if (!controlsEnabled) {
      toast.warning('Managed runtime controls are temporarily disabled while the Railway control path is hardened.')
      return
    }

    // Destructive actions need confirmation dialog
    if (CONFIRM_ACTIONS[action] && !confirmDialog) {
      setConfirmDialog(CONFIRM_ACTIONS[action])
      return
    }

    setActionLoading(action)
    const labels: Record<string, string> = {
      restart: 'Restarting agent',
      stop: 'Stopping agent',
      start: 'Starting agent',
      update: 'Updating agent',
      repair: 'Repairing agent',
      'reset-memory': 'Resetting memory',
    }
    const toastId = toast.loading(labels[action] || 'Processing...')

    try {
      const res = await fetch(`/api/instance/${instance.userId}/${action}`, {
        method: 'POST'
      })
      const data = await res.json()

      if (data.success) {
        const successMsg: Record<string, string> = {
          restart: 'Agent restarted successfully',
          stop: 'Agent stopped',
          start: 'Agent started',
          update: 'Agent updated to latest version',
          repair: 'Agent repaired successfully',
          'reset-memory': 'Memory wiped — agent is fresh',
        }
        toast.success(successMsg[action] || 'Done', { id: toastId })
        setTimeout(() => fetchInstance(instance.userId, instance.botUsername || ''), 1000)
      } else {
        toast.error(data.error || 'Action failed', { id: toastId })
      }
    } catch {
      toast.error('Action failed — check your connection', { id: toastId })
    } finally {
      setActionLoading('')
    }
  }

   if (loading && status === 'authenticated') {
     return (
       <div className="flex min-h-screen bg-black font-mono">
         <DashboardSidebar
           userName={userName}
           credits={credits}
           plan={bootstrap?.plan || instance?.plan}
           runtimeUrl={bootstrap?.openclawUrl}
           runtimeGatewayToken={bootstrap?.gatewayToken}
           runtimeInstanceId={bootstrap?.openclawInstanceId}
           isOpen={sidebarOpen}
           onToggle={() => setSidebarOpen(!sidebarOpen)}
         />
         <div className="flex-1 flex flex-col">
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
           </header>
           <main className="flex-1 overflow-y-auto">
             <div className="p-4 lg:p-8 space-y-6">
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                 {Array.from({ length: 3 }).map((_, i) => (
                   <div key={i} className="border border-zinc-800 bg-zinc-950 p-4 rounded-lg animate-pulse">
                     <div className="h-3 w-24 bg-zinc-800 rounded mb-3" />
                     <div className="h-7 w-32 bg-zinc-900 rounded" />
                   </div>
                 ))}
               </div>
               <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                 {Array.from({ length: 5 }).map((_, i) => (
                   <div key={i} className="bg-zinc-900 border border-zinc-800 p-6 animate-pulse">
                     <div className="h-3 w-28 bg-zinc-800 rounded mb-4" />
                     <div className="space-y-3">
                       <div className="h-3 bg-zinc-800 rounded" />
                       <div className="h-3 bg-zinc-800 rounded w-5/6" />
                       <div className="h-3 bg-zinc-800 rounded w-3/4" />
                     </div>
                   </div>
                 ))}
               </div>
             </div>
           </main>
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
  const statusTone = instance.status === 'running' ? 'text-green-400' : instance.status === 'starting' ? 'text-yellow-400' : 'text-zinc-400'
  const skillsManagerUrl = buildOpenClawControlUrl({
    view: 'skills',
    gatewayUrl: instance.url,
    gatewayToken: instance.gatewayToken,
  })
  const configManagerUrl = buildOpenClawControlUrl({
    view: 'config',
    gatewayUrl: instance.url,
    gatewayToken: instance.gatewayToken,
  })
  const sessionsLabel = gatewayStatus?.sessions?.available
    ? `${gatewayStatus?.sessions.active ?? 0} active / ${gatewayStatus?.sessions.total ?? 0} total`
    : 'unavailable'
  const cronLabel = gatewayStatus?.cron?.available
    ? `${gatewayStatus?.cron.enabled ?? 0} enabled / ${gatewayStatus?.cron.total ?? 0} total`
    : 'unavailable'

  return (
    <div className="flex min-h-screen bg-black font-mono">
      <DashboardSidebar
        userName={userName}
        credits={credits}
        plan={instance?.plan}
        runtimeUrl={instance?.url || bootstrap?.openclawUrl}
        runtimeGatewayToken={instance?.gatewayToken || bootstrap?.gatewayToken}
        runtimeInstanceId={instance?.userId || bootstrap?.openclawInstanceId}
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
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-widest">
                    Agent Runtime
                  </h2>
                  <p className="mt-1 text-[11px] text-zinc-500">Live OpenClaw controls and runtime identity</p>
                </div>
                <StatusBadge status={instance?.status || 'unknown'} />
              </div>
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
                  <dd className="font-mono text-zinc-400">{instance?.openclawVersion || 'unknown'}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-widest text-zinc-600">Started</dt>
                  <dd className="text-zinc-400">{startedAt ? new Date(startedAt).toLocaleString() : 'N/A'}</dd>
                </div>
              </dl>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-6">
              <div className="mb-4">
                <h2 className="text-xs font-bold uppercase tracking-widest">
                  Runtime Signals
                </h2>
                <p className="mt-1 text-[11px] text-zinc-500">Separate the agent runtime from gateway telemetry so failures are obvious</p>
              </div>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-zinc-500">OpenClaw</dt>
                  <dd className={`font-mono ${gatewayStatus?.health === 'healthy' ? 'text-green-400' : 'text-yellow-400'}`}>
                    {gatewayStatus?.health || 'checking...'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-500">State</dt>
                  <dd className={`font-mono ${statusTone}`}>
                    {instance?.status || 'unknown'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Gateway Sessions</dt>
                  <dd className="text-zinc-400 font-mono">{sessionsLabel}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Cron</dt>
                  <dd className="text-zinc-400 font-mono">{cronLabel}</dd>
                </div>
                {gatewayStatus?.sessions?.error && !gatewayStatus.sessions.available && (
                  <div>
                    <dt className="text-[10px] uppercase tracking-widest text-zinc-600">Sessions Detail</dt>
                    <dd className="text-[11px] text-zinc-500">{gatewayStatus.sessions.error}</dd>
                  </div>
                )}
                {gatewayStatus?.cron?.error && !gatewayStatus.cron.available && (
                  <div>
                    <dt className="text-[10px] uppercase tracking-widest text-zinc-600">Cron Detail</dt>
                    <dd className="text-[11px] text-zinc-500">{gatewayStatus.cron.error}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-6">
              <h2 className="text-xs font-bold uppercase tracking-widest mb-4">
                OpenClaw Controls
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
                <a
                  href={skillsManagerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between w-full border border-zinc-800 px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
                >
                  <span>Open Skills Manager</span>
                  <span>→</span>
                </a>
                <a
                  href={configManagerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between w-full border border-zinc-800 px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
                >
                  <span>Open Config</span>
                  <span>→</span>
                </a>
                <div className="border border-zinc-800 px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-600">Gateway Token</p>
                    <button
                      onClick={() => {
                        const token = instance?.gatewayToken || bootstrap?.gatewayToken
                        if (token) {
                          navigator.clipboard.writeText(token)
                          toast.success('Token copied!')
                        }
                      }}
                      className="text-[10px] text-blue-500 hover:text-blue-400 font-bold uppercase tracking-widest"
                    >
                      Copy
                    </button>
                  </div>
                  <code className="text-[10px] text-zinc-500 font-mono break-all block">
                    {instance?.gatewayToken || bootstrap?.gatewayToken || 'No token available'}
                  </code>
                </div>
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
                  {autoPairHealth === 'missing' && (
                    <div className="mt-3 pt-3 border-t border-zinc-800">
                      <p className="text-[10px] text-yellow-500 mb-2">Having connection issues?</p>
                      <p className="text-[10px] text-zinc-500 mb-2">
                        1. Copy your gateway token above<br/>
                        2. Open <a href={instance?.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">{instance?.subdomain}</a><br/>
                        3. Go to Settings → Paste token in "Gateway Token"
                      </p>
                    </div>
                  )}
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
                {controlsEnabled ? (
                  <>
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
                  </>
                ) : (
                  <div className="border border-zinc-800 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-600">Lifecycle Controls</p>
                    <p className="mt-2 text-[11px] text-zinc-500">
                      Managed restart, update, start, and stop actions are hidden until the Railway control path is fully verified. Runtime links above stay live.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-6">
              <h2 className="text-xs font-bold uppercase tracking-widest mb-4">
                Maintenance
              </h2>
              <div className="space-y-3">
                {controlsEnabled ? (
                  <>
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
                      onClick={() => performAction('reset-memory')}
                      disabled={!!actionLoading}
                      className="flex items-center justify-between w-full border border-red-500/30 px-6 py-3 text-xs font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    >
                      <div className="text-left">
                        <div>Reset Agent Memory</div>
                        <div className="text-[10px] font-normal normal-case tracking-normal text-red-400/60 mt-1">Wipe memory, identity & conversation history</div>
                      </div>
                      {actionLoading === 'reset-memory' ? <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" /> : <span>→</span>}
                    </button>
                  </>
                ) : (
                  <div className="border border-zinc-800 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-600">Managed Recovery</p>
                    <p className="mt-2 text-[11px] text-zinc-500">
                      Repair and memory-reset actions stay hidden until their managed Railway flow is verified end to end.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-6">
              <h2 className="text-xs font-bold uppercase tracking-widest mb-4">
                Help & Support
              </h2>
              <div className="space-y-3 text-sm">
                <a href="/documentation" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                  Documentation
                </a>
                <a
                  href="https://docs.agentbot.raveculture.xyz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                >
                  Developer Docs
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

      {confirmDialog && (
        <ConfirmDialog
          open={!!confirmDialog}
          onOpenChange={(open) => { if (!open) setConfirmDialog(null) }}
          title={confirmDialog.title}
          description={confirmDialog.description}
          confirmLabel={confirmDialog.confirmLabel}
          pendingLabel={confirmDialog.pendingLabel}
          variant={confirmDialog.variant}
          onConfirm={async () => {
            setConfirmDialog(null)
            await performAction(confirmDialog.action)
          }}
        />
      )}
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
