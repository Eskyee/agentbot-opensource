'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowUpRight,
  Bot,
  CalendarClock,
  Copy,
  ExternalLink,
  Loader2,
  Power,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  Wrench,
  LifeBuoy,
} from 'lucide-react'
import { StatusBadge, StatusDot } from '@/app/components/shared/StatusBadge'
import { cn } from '@/lib/utils'

type RuntimeAction = 'restart' | 'stop' | 'start' | 'update' | 'repair' | 'reset-memory'

interface InstanceControlPanelProps {
  instance: {
    userId: string
    status: string
    subdomain: string
    url: string
    plan: string
    botUsername?: string
    gatewayToken?: string
    controlUiUrl?: string
    openclawVersion?: string
    provisionedAt?: string | null
    lastSeenAt?: string | null
    gatewayProcessStatus?: string | null
    subscriptionStatus?: string | null
  }
  stats: {
    health?: string | null
    uptime?: string | null
    messages?: number | null
    telemetry?: {
      resourceMetricsAvailable?: boolean
      lifecycleMetricsAvailable?: boolean
      messageMetricsAvailable?: boolean
    }
  } | null
  controlsEnabled: boolean
  autoPairHealth: 'ready' | 'missing' | 'loading'
  actionLoading: string
  onCopyToken: () => void
  onRefreshPairing: () => void
  onAction: (action: RuntimeAction) => void
  skillsManagerUrl: string
  configManagerUrl: string
}

interface TrialStatus {
  trial: boolean
  expired?: boolean
  daysLeft?: number
  endsAt?: string
  plan?: string
}

function formatRelativeTime(value?: string | null) {
  if (!value) return 'Unavailable'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unavailable'
  const diffMs = Date.now() - date.getTime()
  const future = diffMs < 0
  const absMs = Math.abs(diffMs)
  const minutes = Math.floor(absMs / 60_000)
  const hours = Math.floor(absMs / 3_600_000)
  const days = Math.floor(absMs / 86_400_000)
  if (minutes < 1) return future ? 'in under a minute' : 'just now'
  if (minutes < 60) return future ? `in ${minutes}m` : `${minutes}m ago`
  if (hours < 48) return future ? `in ${hours}h` : `${hours}h ago`
  return future ? `in ${days}d` : `${days}d ago`
}

function formatDate(value?: string | null) {
  if (!value) return 'Date unavailable'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatInstanceName(instance: InstanceControlPanelProps['instance']) {
  if (instance.botUsername) return `@${instance.botUsername}`
  const label = instance.subdomain.split('.')[0] || 'Managed instance'
  return label.split('-').filter(Boolean).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
}

function formatPlanLabel(plan?: string | null) {
  if (!plan) return 'Managed plan'
  return plan.charAt(0).toUpperCase() + plan.slice(1)
}

function formatSubscriptionLabel(value?: string | null, fallbackPlan?: string) {
  if (!value || value === 'inactive') return `${formatPlanLabel(fallbackPlan)} plan`
  return value.replace(/_/g, ' ')
}

function getManagedSpecs(plan?: string | null, subscriptionStatus?: string | null) {
  if (!plan || plan === 'free' || subscriptionStatus === 'inactive') return { cpuRam: '2 vCPU, 3 GB RAM', storage: '10 GB SSD' }
  if (plan === 'network') return { cpuRam: '8 vCPU, 16 GB RAM', storage: '500 GB SSD' }
  if (plan === 'label') return { cpuRam: '4 vCPU, 8 GB RAM', storage: '100 GB SSD' }
  if (plan === 'collective') return { cpuRam: '2 vCPU, 4 GB RAM', storage: '50 GB SSD' }
  return { cpuRam: '1 vCPU, 2 GB RAM', storage: '10 GB SSD' }
}

function ActionButton({ label, detail, icon: Icon, accent, loading, disabled, onClick }: {
  label: string; detail: string; icon: typeof Power; accent?: 'light' | 'zinc' | 'warning' | 'danger'
  loading?: boolean; disabled?: boolean; onClick: () => void
}) {
  const accentClass = accent === 'light' ? 'border-white bg-white text-black hover:bg-zinc-200'
    : accent === 'warning' ? 'border-amber-400/30 bg-amber-400/10 text-amber-200 hover:border-amber-300/60 hover:text-white'
    : accent === 'danger' ? 'border-red-500/30 bg-red-500/10 text-red-300 hover:border-red-400/60 hover:text-white'
    : 'border-zinc-800 bg-zinc-950/70 text-zinc-300 hover:border-zinc-700 hover:text-white'
  return (
    <button onClick={onClick} disabled={disabled}
      className={cn('group flex w-full items-center justify-between gap-4 overflow-hidden rounded-2xl border px-4 py-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50', accentClass)>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-xl border border-current/20 p-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em]">{label}</p>
          <p className="mt-1 text-xs normal-case tracking-normal text-current/70">{detail}</p>
        </div>
      </div>
      <ArrowUpRight className="h-4 w-4 opacity-40 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </button>
  )
}

// Sidebar component — rendered in page.tsx right column
export function InstanceSidebar({ instance, stats, skillsManagerUrl, configManagerUrl }: {
  instance: InstanceControlPanelProps['instance']
  stats: InstanceControlPanelProps['stats']
  skillsManagerUrl: string
  configManagerUrl: string
}) {
  const lifecycleTelemetry = stats?.telemetry?.lifecycleMetricsAvailable ?? false
  const quickLinks = [
    { label: 'Gateway Process', href: instance.controlUiUrl || instance.url, external: true },
    { label: 'Subscription', href: '/billing', external: false },
    { label: "What's New", href: '/dashboard/tech-updates', external: false },
    { label: 'Skills Manager', href: skillsManagerUrl, external: true },
    { label: 'Open Config', href: configManagerUrl, external: true },
  ]

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Instance Snapshot</p>
        <dl className="mt-4 space-y-3">
          {[
            ['State', instance.status || 'unknown', true],
            ['Uptime', lifecycleTelemetry && stats?.uptime ? stats.uptime : 'Live checks only', true],
            ['Restarts', '—', false],
            ['Last Exit', '—', false],
            ['Provisioned', formatRelativeTime(instance.provisionedAt), true],
          ].map(([label, value, bright]) => (
            <div key={label as string} className="flex items-center justify-between gap-4">
              <dt className="text-xs text-zinc-500">{label}</dt>
              <dd className={cn('text-right text-xs font-bold uppercase tracking-[0.12em]', bright ? 'text-white' : 'text-zinc-400')}>
                {value as string}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Launch Pads</p>
        <div className="mt-3 space-y-2">
          {quickLinks.map((link) => {
            const Cmp = link.external ? 'a' : Link
            const extra = link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {}
            return (
              <Cmp key={link.label} href={link.href} {...extra}
                className="group flex items-center justify-between rounded-xl border border-zinc-800 px-3 py-2.5 text-xs text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-900/70 hover:text-white">
                <span>{link.label}</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-zinc-600" />
              </Cmp>
            )
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
        <div className="flex items-start gap-3 min-w-0">
          <div className="rounded-xl border border-zinc-700 p-2 text-zinc-300 flex-shrink-0">
            <LifeBuoy className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Telemetry Note</p>
            <p className="mt-1 text-xs leading-5 text-zinc-400">
              Restart counts and exit codes aren&apos;t exposed by the runtime API yet. This panel stays honest: live state, pairing, version, and recovery are real.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main control panel — single column, no internal sidebar
export function InstanceControlPanel({
  instance, stats, controlsEnabled, autoPairHealth, actionLoading,
  onCopyToken, onRefreshPairing, onAction, skillsManagerUrl, configManagerUrl,
}: InstanceControlPanelProps) {
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null)
  const isRunning = instance.status === 'running'
  const instanceName = formatInstanceName(instance)
  const runtimeHealth = stats?.health === 'healthy' ? 'healthy' : stats?.health || 'checking'
  const managedSpecs = getManagedSpecs(instance.plan, instance.subscriptionStatus)
  const maskedToken = instance.gatewayToken
    ? `${instance.gatewayToken.slice(0, 10)}...${instance.gatewayToken.slice(-6)}`
    : 'No token yet'

  useEffect(() => { fetch('/api/trial').then(r => r.json()).then(setTrialStatus).catch(() => {}) }, [])

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.18),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.14),_transparent_32%),linear-gradient(180deg,_rgba(24,24,27,0.92),_rgba(9,9,11,0.96))] px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-300/80">Instance Controls</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 min-w-0">
              <h2 className="text-lg font-bold uppercase tracking-tight text-white truncate max-w-full">{instanceName}</h2>
              <StatusBadge status={instance.status || 'unknown'} size="md" />
              <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-black/40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-300">
                <StatusDot status={runtimeHealth === 'healthy' ? 'running' : 'starting'} />
                {runtimeHealth}
              </span>
            </div>
          </div>
          <div className="min-w-0 overflow-hidden rounded-xl border border-zinc-800 bg-black/40 p-3 lg:w-64">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] uppercase tracking-[0.18em] text-zinc-600">Gateway Pairing</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-white">
                  {autoPairHealth === 'ready' ? 'Connected' : autoPairHealth === 'missing' ? 'Needs attention' : 'Checking'}
                </p>
                <p className="mt-0.5 text-[10px] text-zinc-500">{maskedToken}</p>
              </div>
              <span className={cn('h-2.5 w-2.5 rounded-full flex-shrink-0',
                autoPairHealth === 'ready' ? 'bg-emerald-400' : autoPairHealth === 'missing' ? 'bg-amber-400' : 'bg-zinc-600 animate-pulse')} />
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={onCopyToken} disabled={!instance.gatewayToken}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-zinc-300 hover:border-zinc-500 hover:text-white disabled:opacity-40">
                <Copy className="h-3 w-3" /> Copy
              </button>
              <button onClick={onRefreshPairing}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-zinc-300 hover:border-zinc-500 hover:text-white">
                <RefreshCw className={cn('h-3 w-3', autoPairHealth === 'loading' && 'animate-spin')} /> Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-5 p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 truncate">Managed - {instance.userId.slice(0, 8)}</p>
            <h3 className="mt-2 text-sm font-bold uppercase tracking-tight text-white truncate">{instanceName}</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-zinc-700 bg-black/40 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-100">{managedSpecs.cpuRam}</span>
              <span className="rounded-full border border-zinc-700 bg-black/40 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-100">{managedSpecs.storage}</span>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-1.5 text-amber-200 flex-shrink-0">
                <CalendarClock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200/70">Agentbot Setup</p>
                <p className="mt-1.5 text-sm font-bold tracking-tight text-white">Get configured in one hour.</p>
                <p className="mt-1 text-xs text-zinc-400">Email, calendar, and messaging — live on a call. Includes 2 months free hosting.</p>
              </div>
            </div>
            <Link href="/expert-setup"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white bg-white px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-black hover:bg-zinc-200">
              Book session <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-1.5 text-blue-300 flex-shrink-0">
                <Star className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                  {trialStatus?.trial && !trialStatus.expired ? `Trial — ${trialStatus.daysLeft ?? 0} days left` : 'Subscription'}
                </p>
                <p className="mt-1.5 text-xs text-white">
                  {trialStatus?.trial && !trialStatus.expired
                    ? `Expires ${formatDate(trialStatus.endsAt)}.`
                    : `${formatSubscriptionLabel(instance.subscriptionStatus, instance.plan)} active.`}
                </p>
              </div>
            </div>
            <Link href="/billing"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-zinc-700 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-200 hover:border-zinc-500 hover:text-white">
              {trialStatus?.trial && !trialStatus.expired ? 'Subscribe' : 'Manage'} <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Lifecycle */}
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Lifecycle</p>
              <p className="mt-1 text-sm font-bold uppercase tracking-tight text-white">Power, upgrade, and recovery</p>
            </div>
            <a href={instance.controlUiUrl || instance.url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-white bg-white px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-black hover:bg-zinc-200">
              Open Gateway <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            <ActionButton label={isRunning ? 'Restart' : 'Start'} detail={isRunning ? 'Graceful restart' : 'Boot runtime'} icon={isRunning ? RefreshCw : Power} accent={isRunning ? 'light' : 'warning'} loading={actionLoading === (isRunning ? 'restart' : 'start')} disabled={!controlsEnabled || !!actionLoading} onClick={() => onAction(isRunning ? 'restart' : 'start')} />
            <ActionButton label="Upgrade" detail="Pull latest image" icon={Sparkles} loading={actionLoading === 'update'} disabled={!controlsEnabled || !!actionLoading} onClick={() => onAction('update')} />
            <ActionButton label="Recover" detail="Repair tokens and config" icon={Wrench} accent="warning" loading={actionLoading === 'repair'} disabled={!controlsEnabled || !!actionLoading} onClick={() => onAction('repair')} />
            <Link href="/dashboard/maintenance" className="group flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-4 text-left transition-colors hover:border-zinc-700 hover:text-white">
              <div className="rounded-lg border border-current/20 p-1.5 text-zinc-300"><ShieldCheck className="h-4 w-4" /></div>
              <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-200">Doctor</p><p className="text-[10px] text-zinc-500">Diagnostics &amp; fixes</p></div>
            </Link>
            <ActionButton label="Stop" detail="Take offline" icon={Power} accent="danger" loading={actionLoading === 'stop'} disabled={!controlsEnabled || !!actionLoading || !isRunning} onClick={() => onAction('stop')} />
            <ActionButton label="Reset Memory" detail="Wipe everything" icon={Bot} accent="danger" loading={actionLoading === 'reset-memory'} disabled={!controlsEnabled || !!actionLoading} onClick={() => onAction('reset-memory')} />
          </div>
          {!controlsEnabled && (
            <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
              Lifecycle actions temporarily gated.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
