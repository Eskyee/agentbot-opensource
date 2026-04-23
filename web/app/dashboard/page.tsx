'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { useCustomSession } from '@/app/lib/useCustomSession'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { toast } from 'sonner'

const DashboardSidebar = dynamic(() => import('@/app/components/DashboardSidebar').then(m => m.DashboardSidebar))
const InstanceControlPanel = dynamic(() => import('@/app/components/dashboard/InstanceControlPanel').then(m => m.InstanceControlPanel))
const ConfirmDialog = dynamic(() => import('@/app/components/shared/ConfirmDialog').then(m => m.ConfirmDialog))
const PermissionGate = dynamic(() => import('@/app/components/shared/PermissionGate').then(m => m.PermissionGate))
import { DEFAULT_OPENCLAW_GATEWAY_URL } from '@/app/lib/openclaw-config'
import { buildOpenClawControlUrl, OPENCLAW_CONTROLS_ENABLED } from '@/app/lib/openclaw-control'

interface InstanceData {
  userId: string
  status: string
  statusReason?: string | null
  probeChecks?: Array<{
    path: string
    ok: boolean
    status: number | null
    reason: string | null
  }>
  subdomain?: string
  url: string
  plan: string
  openclawVersion?: string
  ffmpegAvailable?: boolean
  ffmpegVersion?: string | null
  botUsername?: string
  gatewayToken?: string
  /** Auto-connect URL with token in #fragment */
  controlUiUrl?: string
  verified?: boolean
  verificationType?: string | null
  attestationUid?: string | null
  verifiedAt?: string | null
  provisionedAt?: string | null
  lastSeenAt?: string | null
  gatewayProcessStatus?: string | null
  subscriptionStatus?: string | null
}

interface DashboardBootstrapData {
  credits: number
  plan?: string | null
  openclawUrl?: string | null
  openclawInstanceId?: string | null
  gatewayToken?: string | null
  communityRewards?: {
    connected: boolean
    walletAddress: string | null
    claimed: boolean
    currentTier: {
      id: string
      label: string
      credits: number
      minBalance: number
    } | null
    balanceUi: number | null
    creditsClaimed: number
    claimedAt?: string | null
    availability?: 'live' | 'degraded'
    detail?: string | null
  }
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
  const { data: session, status } = useCustomSession()
  const router = useRouter()
  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'Sign in'
  const searchParams = useSearchParams()
  const [instance, setInstance] = useState<InstanceData | null>(null)
  const [stats, setStats] = useState<{
    cpu: string
    memory: string
    uptime?: string | null
    messages?: number | null
    errors?: number | null
    health?: string | null
    telemetry?: {
      resourceMetricsAvailable?: boolean
      lifecycleMetricsAvailable?: boolean
      messageMetricsAvailable?: boolean
    }
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState('')
  const [credits, setCredits] = useState(0)
  const [bootstrap, setBootstrap] = useState<DashboardBootstrapData | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [statusChecks, setStatusChecks] = useState<{ name: string; status: 'ok' | 'degraded' | 'down'; detail?: string }[]>([])
  const [autoPairHealth, setAutoPairHealth] = useState<'ready' | 'missing' | 'loading'>('loading')
  const [healingAttempted, setHealingAttempted] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmAction | null>(null)
  const [probeActionLoading, setProbeActionLoading] = useState<'probe' | 'resync' | null>(null)
  const controlsEnabled = OPENCLAW_CONTROLS_ENABLED

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?callbackUrl=/dashboard')
    }
  }, [status, router])

  const fetchEverything = useCallback(async () => {
    const urlUserId = searchParams.get('id')
    const storedData = localStorage.getItem('agentbot_instance')
    
    try {
      // FETCH EVERYTHING IN ONE CALL - 90% FASTER
      const dataRes = await fetch('/api/dashboard/data')
      if (!dataRes.ok) {
        if (dataRes.status === 401) {
          setError('Please sign in to view your dashboard')
          setLoading(false)
          return
        }
        throw new Error('Failed to fetch dashboard data')
      }
      
      const data = await dataRes.json()
      
      // Hydrate UI state from consolidated response
      setCredits(data.credits || 0)
      setStatusChecks(data.health?.checks || [])
      setBootstrap(data) // Use consolidated data as bootstrap
      
      if (data.instance) {
        const url = data.instance.url
        const gatewayToken = data.gatewayToken
        const controlUiUrl = buildOpenClawControlUrl({
          view: 'chat',
          gatewayUrl: url,
          gatewayToken,
          session: 'main',
        })
        
        setInstance({ ...data.instance, gatewayToken, controlUiUrl })
        
        // Cache for future visits
        localStorage.setItem('agentbot_instance', JSON.stringify({
          userId: data.openclawInstanceId,
          url: data.openclawUrl,
        }))
      }

      if (data.stats) {
        setStats(data.stats)
      }

      const health = data.gatewayToken ? 'ready' : 'missing'
      setAutoPairHealth(health)
      setLoading(false)
      
    } catch (err) {
      console.error('[Dashboard] Consolidated fetch failed:', err)
      setError('Failed to initialize dashboard')
      setLoading(false)
    }
  }, [searchParams])

  const healAutoPair = useCallback(async () => {
    if (healingAttempted) return
    setHealingAttempted(true)
    try {
      // First ensure OpenClaw 2026.4.2 compatibility
      const compatibility = await fetch('/api/openclaw/ensure-compatibility', { method: 'POST' })
      if (compatibility.ok) {
        const compatData = await compatibility.json()
        if (compatData.fixes?.length > 0) console.log('Applied compatibility fixes:', compatData.fixes)
      }

      // Now heal the token
      const res = await fetch('/api/support/heal-token', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        if (data.healed) {
          setAutoPairHealth('ready')
          // Refresh data after healing
          fetchEverything()
        }
      }
    } catch (error) {
      console.error('Auto Pair heal failed', error)
    }
  }, [fetchEverything, healingAttempted])

  // Trigger healing effect
  useEffect(() => {
    if (autoPairHealth === 'missing' && !healingAttempted && !loading) {
      healAutoPair()
    }
  }, [autoPairHealth, healingAttempted, loading, healAutoPair])

  useEffect(() => {
    // Clear localStorage instance data when no session (user logged out)
    if (!session) {
      localStorage.removeItem('agentbot_instance')
      setInstance(null)
      setError('')
      setLoading(false)
      return
    }

    setLoading(true)
    fetchEverything()
  }, [session, fetchEverything])

  const handleRuntimeProbeAction = async (action: 'probe' | 'resync') => {
    if (!instance) return

    setProbeActionLoading(action)
    try {
      const res = await fetch(`/api/instance/${instance.userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || `Failed to ${action} runtime`)
      }

      await fetchEverything()
      toast.success(action === 'probe' ? 'Runtime probe refreshed' : 'Runtime resync triggered')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to ${action} runtime`)
    } finally {
      setProbeActionLoading(null)
    }
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
        setTimeout(() => fetchEverything(), 1000)
      } else {
        toast.error(data.error || 'Action failed', { id: toastId })
      }
    } catch {
      toast.error('Action failed — check your connection', { id: toastId })
    } finally {
      setActionLoading('')
    }
  }

  // NextAuth status handling
  if (status === 'unauthenticated') {
    return null 
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center font-mono">
        <div className="w-12 h-12 border-2 border-orange-500 border-t-transparent animate-spin mb-4" />
        <p className="animate-pulse uppercase tracking-[0.2em] text-[10px] text-zinc-500">Initializing Dashboard...</p>
      </div>
    )
  }

  if (loading && status === 'authenticated') {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center font-mono">
        <div className="w-12 h-12 border-2 border-orange-500 border-t-transparent animate-spin mb-4" />
        <p className="animate-pulse uppercase tracking-[0.2em] text-[10px] text-zinc-500">Initializing Dashboard...</p>
      </div>
    )
  }

  if (error) {
    const isAuthError = error.includes('sign in') || error.includes('Unauthorized')
    const isNoInstance = error.includes('deploy first') || error.includes('No instance')
    const isInstanceError = !isAuthError && !isNoInstance // backend returned error for existing instance

    let title = 'Deploy your first agent'
    let cta = { label: 'Create New Runtime', href: '/onboard?mode=deploy' }

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

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-4 sm:p-6 lg:p-8">
          {/* Permission Gate — shows pending approval requests */}
          <PermissionGate agentId={instance?.userId} />

          {bootstrap?.communityRewards && (
            <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Community Rewards</div>
                  {bootstrap.communityRewards.connected ? (
                    <p className="mt-2 text-sm text-zinc-300">
                      {bootstrap.communityRewards.currentTier
                        ? `${bootstrap.communityRewards.currentTier.label} tier · ${bootstrap.communityRewards.balanceUi?.toLocaleString()} tokens`
                        : `${bootstrap.communityRewards.balanceUi?.toLocaleString()} tokens connected`}
                      {bootstrap.communityRewards.claimed
                        ? ` · ${bootstrap.communityRewards.creditsClaimed} credits claimed`
                        : ' · claim available if eligible'}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-zinc-300">
                      Connect your Solana holder wallet to unlock Agentbot community rewards.
                    </p>
                  )}
                </div>
                <Link
                  href="/claim"
                  className="inline-flex items-center justify-center rounded-full border border-zinc-700 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-200 hover:border-zinc-500 hover:text-white"
                >
                  {bootstrap.communityRewards.claimed ? 'View claim' : 'Claim credits'}
                </Link>
              </div>
            </div>
          )}

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

          <InstanceControlPanel
            instance={instance}
            stats={stats}
            controlsEnabled={controlsEnabled}
            autoPairHealth={autoPairHealth}
            probeActionLoading={probeActionLoading}
            actionLoading={actionLoading}
            onCopyToken={() => {
              const token = instance?.gatewayToken || bootstrap?.gatewayToken
              if (token) {
                navigator.clipboard.writeText(token)
                toast.success('Token copied!')
              }
            }}
            onRefreshPairing={() => {
              setAutoPairHealth('loading')
              fetchEverything()
            }}
            onProbeAction={handleRuntimeProbeAction}
            onAction={performAction}
            skillsManagerUrl={skillsManagerUrl}
            configManagerUrl={configManagerUrl}
            communityRewards={bootstrap?.communityRewards || null}
          />
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
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center font-mono">
        <div className="w-12 h-12 border-2 border-orange-500 border-t-transparent animate-spin mb-4" />
        <p className="animate-pulse uppercase tracking-[0.2em] text-[10px] text-zinc-500">Initializing Dashboard...</p>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
