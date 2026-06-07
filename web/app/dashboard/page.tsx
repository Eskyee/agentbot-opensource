'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { useCustomSession } from '@/app/lib/useCustomSession'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { toast } from 'sonner'

const DashboardSidebar = dynamic(() => import('@/app/components/DashboardSidebar').then(m => m.DashboardSidebar))
const InstanceControlPanel = dynamic(() => import('@/app/components/dashboard/InstanceControlPanel').then(m => m.InstanceControlPanel))
const ConfirmDialog = dynamic(() => import('@/app/components/shared/ConfirmDialog').then(m => m.ConfirmDialog))
const PermissionGate = dynamic(() => import('@/app/components/shared/PermissionGate').then(m => m.PermissionGate))
const BaseActivity = dynamic(() => import('@/app/components/BaseActivity'), { ssr: false })
import { DEFAULT_OPENCLAW_GATEWAY_URL } from '@/app/lib/openclaw-config'
import { buildOpenClawControlUrl, OPENCLAW_CONTROLS_ENABLED } from '@/app/lib/openclaw-control'

interface InstanceData {
  userId: string
  status: string
  statusReason?: string | null
  probeChecks?: Array<{ path: string; ok: boolean; status: number | null; reason: string | null }>
  subdomain?: string
  url: string
  plan: string
  openclawVersion?: string
  ffmpegAvailable?: boolean
  ffmpegVersion?: string | null
  botUsername?: string
  gatewayToken?: string
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
    description: 'Your agent will go offline and stop responding until you start it again.',
    confirmLabel: 'Stop Agent',
    pendingLabel: 'Stopping...',
    variant: 'danger',
  },
  'reset-memory': {
    action: 'reset-memory',
    title: 'Reset Memory',
    description: 'This permanently wipes all memory, identity, and conversation history.',
    confirmLabel: 'Reset Memory',
    pendingLabel: 'Resetting...',
    variant: 'danger',
  },
}

function DashboardLoadingShell() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center font-mono">
      <div className="relative">
        <div className="w-12 h-12 border-2 border-zinc-800 border-t-orange-500 rounded-full animate-spin" />
      </div>
      <p className="mt-6 text-[10px] uppercase tracking-[0.3em] text-zinc-600">Initializing</p>
    </div>
  )
}

function MetricCard({ label, value, sub, trend }: { label: string; value: string; sub?: string; trend?: 'up' | 'down' | 'neutral' }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-zinc-800/50 bg-zinc-950 p-5 transition-all hover:border-zinc-700/50 hover:bg-zinc-900/50">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 mb-2">{label}</p>
      <p className="text-2xl font-bold tracking-tight text-white">{value}</p>
      {sub && <p className="text-[11px] text-zinc-500 mt-1">{sub}</p>}
      {trend && (
        <span className={`inline-flex items-center gap-1 mt-2 text-[10px] font-bold uppercase tracking-widest ${
          trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-zinc-500'
        }`}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trend}
        </span>
      )}
    </div>
  )
}

function StatusDot({ status }: { status: 'ok' | 'degraded' | 'down' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] font-bold ${
      status === 'ok' ? 'text-emerald-500' : status === 'degraded' ? 'text-yellow-500' : 'text-red-500'
    }`}>
      <span className={`h-1.5 w-1.5 rounded-full ${
        status === 'ok' ? 'bg-emerald-500' : status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
      }`} />
      {status === 'ok' ? 'Online' : status === 'degraded' ? 'Degraded' : 'Down'}
    </span>
  )
}

function QuickAction({ icon, label, href, onClick, variant = 'default' }: {
  icon: string; label: string; href?: string; onClick?: () => void; variant?: 'default' | 'primary' | 'danger'
}) {
  const classes = `flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-xs font-bold uppercase tracking-widest ${
    variant === 'primary'
      ? 'bg-white text-black border-white hover:bg-zinc-200'
      : variant === 'danger'
      ? 'border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/40'
      : 'border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 hover:bg-zinc-900'
  }`

  const content = <><span className="text-sm">{icon}</span> {label}</>

  if (href) {
    return href.startsWith('http') ? (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>{content}</a>
    ) : (
      <Link href={href} className={classes}>{content}</Link>
    )
  }
  return <button onClick={onClick} className={classes}>{content}</button>
}

function DashboardContent() {
  const { data: session, status } = useCustomSession()
  const router = useRouter()
  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'User'
  const searchParams = useSearchParams()
  const [instance, setInstance] = useState<InstanceData | null>(null)
  const [stats, setStats] = useState<{
    cpu: string; memory: string; uptime?: string | null; messages?: number | null; errors?: number | null; health?: string | null
    telemetry?: { resourceMetricsAvailable?: boolean; lifecycleMetricsAvailable?: boolean; messageMetricsAvailable?: boolean }
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
    if (status === 'unauthenticated') router.replace('/login?callbackUrl=/dashboard')
  }, [status, router])

  const fetchEverything = useCallback(async () => {
    const urlUserId = searchParams.get('id')
    const storedData = localStorage.getItem('agentbot_instance')
    try {
      const dataRes = await fetch('/api/dashboard/data')
      if (!dataRes.ok) {
        if (dataRes.status === 401) { setError('Please sign in to view your dashboard'); setLoading(false); return }
        throw new Error('Failed to fetch dashboard data')
      }
      const data = await dataRes.json()
      setCredits(data.credits || 0)
      setStatusChecks(data.health?.checks || [])
      setBootstrap(data)
      if (data.instance) {
        const url = data.instance.url
        const gatewayToken = data.gatewayToken
        const controlUiUrl = buildOpenClawControlUrl({ view: 'chat', gatewayUrl: url, gatewayToken, session: 'main' })
        setInstance({ ...data.instance, gatewayToken, controlUiUrl })
        localStorage.setItem('agentbot_instance', JSON.stringify({ userId: data.openclawInstanceId, url: data.openclawUrl }))
      }
      if (data.stats) setStats(data.stats)
      setAutoPairHealth(data.gatewayToken ? 'ready' : 'missing')
      setLoading(false)
    } catch (err) {
      console.error('[Dashboard] Fetch failed:', err)
      setError('Failed to initialize dashboard')
      setLoading(false)
    }
  }, [searchParams])

  const healAutoPair = useCallback(async () => {
    if (healingAttempted) return
    setHealingAttempted(true)
    try {
      const compatibility = await fetch('/api/openclaw/ensure-compatibility', { method: 'POST' })
      if (compatibility.ok) {
        const compatData = await compatibility.json()
        if (compatData.fixes?.length > 0) console.log('Applied compatibility fixes:', compatData.fixes)
      }
      const res = await fetch('/api/support/heal-token', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        if (data.healed) { setAutoPairHealth('ready'); fetchEverything() }
      }
    } catch (error) { console.error('Auto Pair heal failed', error) }
  }, [fetchEverything, healingAttempted])

  useEffect(() => {
    if (autoPairHealth === 'missing' && !healingAttempted && !loading) healAutoPair()
  }, [autoPairHealth, healingAttempted, loading, healAutoPair])

  useEffect(() => {
    if (!session) { localStorage.removeItem('agentbot_instance'); setInstance(null); setError(''); setLoading(false); return }
    setLoading(true)
    fetchEverything()
  }, [session, fetchEverything])

  const handleRuntimeProbeAction = async (action: 'probe' | 'resync') => {
    if (!instance) return
    setProbeActionLoading(action)
    try {
      const res = await fetch(`/api/instance/${instance.userId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || `Failed to ${action} runtime`)
      await fetchEverything()
      toast.success(action === 'probe' ? 'Runtime probe refreshed' : 'Runtime resync triggered')
    } catch (error) { toast.error(error instanceof Error ? error.message : `Failed to ${action} runtime`) }
    finally { setProbeActionLoading(null) }
  }

  const performAction = async (action: 'restart' | 'stop' | 'start' | 'update' | 'repair' | 'reset-memory') => {
    if (!instance) return
    if (!controlsEnabled) { toast.warning('Managed runtime controls are temporarily disabled.'); return }
    if (CONFIRM_ACTIONS[action] && !confirmDialog) { setConfirmDialog(CONFIRM_ACTIONS[action]); return }
    setActionLoading(action)
    const labels: Record<string, string> = { restart: 'Restarting agent', stop: 'Stopping agent', start: 'Starting agent', update: 'Updating agent', repair: 'Repairing agent', 'reset-memory': 'Resetting memory' }
    const toastId = toast.loading(labels[action] || 'Processing...')
    try {
      const res = await fetch(`/api/instance/${instance.userId}/${action}`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        const successMsg: Record<string, string> = { restart: 'Agent restarted', stop: 'Agent stopped', start: 'Agent started', update: 'Agent updated', repair: 'Agent repaired', 'reset-memory': 'Memory wiped — agent is fresh' }
        toast.success(successMsg[action] || 'Done', { id: toastId })
        setTimeout(() => fetchEverything(), 1000)
      } else { toast.error(data.error || 'Action failed', { id: toastId }) }
    } catch { toast.error('Action failed — check your connection', { id: toastId }) }
    finally { setActionLoading('') }
  }

  if (status !== 'authenticated' || loading) return <DashboardLoadingShell />

  const fadeIn = { animation: 'fadeIn 0.4s ease-out' }

  if (error) {
    const isAuthError = error.includes('sign in') || error.includes('Unauthorized')
    return (
      <div className="flex h-screen bg-black font-mono" style={fadeIn}>
        <DashboardSidebar userName={userName} plan={instance?.plan} isAdmin={session?.user?.isAdmin === true} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-6">⚙️</div>
            <h1 className="text-xl font-bold uppercase tracking-tighter mb-3">{isAuthError ? 'Sign in required' : 'Deploy your first agent'}</h1>
            <p className="text-zinc-500 text-sm mb-8">{error}</p>
            <Link href={isAuthError ? '/login?callbackUrl=/dashboard' : '/onboard?mode=deploy'} className="inline-flex items-center justify-center bg-white text-black px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors">
              {isAuthError ? 'Sign In' : 'Deploy Agent'}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!instance) {
    return (
      <div className="flex min-h-screen bg-black font-mono" style={fadeIn}>
        <DashboardSidebar userName={userName} credits={credits} plan={undefined} runtimeUrl={undefined} runtimeGatewayToken={undefined} runtimeInstanceId={undefined} isAdmin={session?.user?.isAdmin === true} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md text-center space-y-6">
            <div className="text-4xl">🤖</div>
            <h2 className="text-xl font-bold uppercase tracking-tight">No Agent Deployed</h2>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Deploy your first agent. It takes about 2 minutes.
            </p>
            <Link
              href="/signup"
              className="inline-block bg-white text-black px-8 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
            >
              Deploy Agent →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const instanceName = instance.userId ? `Agent ${instance.userId.slice(0, 8)}` : 'Agent'
  const runtimeHealth = instance.status === 'running' ? 'healthy' : instance.status
  const isUnreachable = instance.status !== 'running'
  const skillsManagerUrl = buildOpenClawControlUrl({ view: 'skills', gatewayUrl: instance.url, gatewayToken: instance.gatewayToken })
  const configManagerUrl = buildOpenClawControlUrl({ view: 'config', gatewayUrl: instance.url, gatewayToken: instance.gatewayToken })

  // When Railway is down, show a clean view with local OpenClaw link
  if (isUnreachable) {
    return (
      <div className="flex min-h-screen bg-black font-mono" style={fadeIn}>
        <DashboardSidebar userName={userName} credits={credits} plan={instance?.plan} runtimeUrl={instance?.url || bootstrap?.openclawUrl} runtimeGatewayToken={instance?.gatewayToken || bootstrap?.gatewayToken} runtimeInstanceId={instance?.userId || bootstrap?.openclawInstanceId} isAdmin={session?.user?.isAdmin === true} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-14 z-30 bg-black/80 backdrop-blur-xl border-b border-zinc-900 px-4 sm:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors" aria-label="Open menu">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Dashboard</span>
            </div>
            <Link href="/onboard?mode=deploy" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors">
              + New Agent
            </Link>
          </header>
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
              <div className="text-6xl mb-6">🦞</div>
              <h1 className="text-2xl font-bold tracking-tighter uppercase mb-3">Agent Offline</h1>
              <p className="text-zinc-500 text-sm mb-8">
                Your agent is currently offline. Start it to resume.
              </p>
              <div className="space-y-4">
                {instance.controlUiUrl && (
                  <a href={instance.controlUiUrl} target="_blank" rel="noopener noreferrer" className="block w-full bg-white text-black py-3 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-zinc-200 transition-colors">
                    Open Chat
                  </a>
                )}
                <button onClick={() => performAction('start')} className="block w-full border border-zinc-800 py-3 rounded-lg font-bold uppercase tracking-widest text-xs text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors">
                  Start Agent
                </button>
              </div>
              <div className="mt-12 pt-8 border-t border-zinc-900">
                <div className="grid grid-cols-2 gap-2">
                  <QuickAction icon="💰" label="Billing" href="/billing" />
                  <QuickAction icon="⚙️" label="Settings" href="/settings" />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <>
    <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    <div className="flex min-h-screen bg-black font-mono" style={fadeIn}>
      <DashboardSidebar userName={userName} credits={credits} plan={instance?.plan} runtimeUrl={instance?.url || bootstrap?.openclawUrl} runtimeGatewayToken={instance?.gatewayToken || bootstrap?.gatewayToken} runtimeInstanceId={instance?.userId || bootstrap?.openclawInstanceId} isAdmin={session?.user?.isAdmin === true} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-14 z-30 bg-black/80 backdrop-blur-xl border-b border-zinc-900 px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors" aria-label="Open menu">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Dashboard</span>
              <span className="text-zinc-700">·</span>
              <StatusDot status={instance.status === 'running' ? 'ok' : instance.status === 'stopped' ? 'down' : 'degraded'} />
            </div>
          </div>
          <Link href="/onboard?mode=deploy" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors">
            + New Agent
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <PermissionGate agentId={instance?.userId} />

            {/* Hero */}
            <section className="mb-8">
              <div className="relative overflow-hidden rounded-2xl border border-zinc-800/50 bg-gradient-to-br from-zinc-950 via-zinc-950 to-zinc-900 p-6 sm:p-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter text-white mb-2">{instanceName}</h1>
                      <p className="text-zinc-500 text-sm max-w-md">{instance.status === 'running' ? 'Your agent is live. Working while you sleep.' : `Agent is ${instance.status}. Start it to resume.`}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {instance.controlUiUrl && (
                        <a href={instance.controlUiUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors">
                          Open Chat ↗
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-5">
                    <span className="px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950 text-[10px] font-bold uppercase tracking-widest text-zinc-400">{instance.plan || 'Solo'}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Metrics */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
              <MetricCard label="Status" value={instance.status === 'running' ? 'Live' : instance.status} />
              <MetricCard label="Messages" value={stats?.messages?.toLocaleString() || '—'} />
              <MetricCard label="Uptime" value={stats?.uptime || '—'} />
              <MetricCard label="Plan" value={instance.plan || 'Solo'} />
            </section>



            {/* Health checks */}
            {statusChecks.length > 0 && (
              <section className="mb-8">
                <h2 className="text-[10px] uppercase tracking-[0.3em] text-zinc-600 mb-3">System Health</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {statusChecks.map((check) => (
                    <div key={check.name} className="flex items-center justify-between px-4 py-3 rounded-xl border border-zinc-800/50 bg-zinc-950">
                      <span className="text-xs text-zinc-400">{check.name}</span>
                      <StatusDot status={check.status} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Actions */}
            <section className="mb-8">
              <h2 className="text-[10px] uppercase tracking-[0.3em] text-zinc-600 mb-3">Actions</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {instance.controlUiUrl && <QuickAction icon="💬" label="Chat" href={instance.controlUiUrl} variant="primary" />}
                <QuickAction icon="🔧" label="Skills" href={skillsManagerUrl} />
                <QuickAction icon="⚙️" label="Settings" href="/settings" />
                <QuickAction icon="🔄" label="Restart" onClick={() => performAction('restart')} />
                <QuickAction icon="⏹" label="Stop" onClick={() => performAction('stop')} variant="danger" />
                <QuickAction icon="💰" label="Billing" href="/billing" />
              </div>
            </section>

            {/* Control panel */}
            <InstanceControlPanel instance={instance} stats={stats} controlsEnabled={controlsEnabled} autoPairHealth={autoPairHealth} probeActionLoading={probeActionLoading} actionLoading={actionLoading} communityRewards={{ connected: false, walletAddress: null, claimed: false, currentTier: null, balanceUi: null, creditsClaimed: 0 }} onCopyToken={() => { const token = instance?.gatewayToken || bootstrap?.gatewayToken; if (token) { navigator.clipboard.writeText(token); toast.success('Token copied!') } else { toast.error('Token not available') } }} onRefreshPairing={() => { setAutoPairHealth('loading'); fetchEverything() }} onProbeAction={handleRuntimeProbeAction} onAction={performAction} skillsManagerUrl={skillsManagerUrl} configManagerUrl={configManagerUrl} />
          </div>
        </main>
      </div>

      {confirmDialog && (
        <ConfirmDialog open={!!confirmDialog} onOpenChange={(open: boolean) => { if (!open) setConfirmDialog(null) }} title={confirmDialog.title} description={confirmDialog.description} confirmLabel={confirmDialog.confirmLabel} pendingLabel={confirmDialog.pendingLabel} variant={confirmDialog.variant} onConfirm={async () => { setConfirmDialog(null); await performAction(confirmDialog.action) }} />
      )}
    </div>
    </>
  )
}

export default function Dashboard() {
  return <DashboardContent />
}
