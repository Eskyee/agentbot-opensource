'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowUpRight,
  Bot,
  CalendarClock,
  Copy,
  ExternalLink,
  LifeBuoy,
  Loader2,
  Power,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  Wrench,
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

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatInstanceName(instance: InstanceControlPanelProps['instance']) {
  if (instance.botUsername) return `@${instance.botUsername}`

  const label = instance.subdomain.split('.')[0] || 'Managed instance'
  return label
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function formatPlanLabel(plan?: string | null) {
  if (!plan) return 'Managed plan'
  return plan.charAt(0).toUpperCase() + plan.slice(1)
}

function formatSubscriptionLabel(value?: string | null, fallbackPlan?: string) {
  if (!value || value === 'inactive') return `${formatPlanLabel(fallbackPlan)} plan`
  return value.replace(/_/g, ' ')
}

function formatMachineLabel(instanceId: string) {
  return `Managed - ${instanceId}`
}

function formatGatewayProcess(value?: string | null, health?: string | null) {
  if (value) return value
  if (health === 'healthy') return 'healthy'
  if (health) return health
  return 'observing'
}

function getManagedSpecs(plan?: string | null, subscriptionStatus?: string | null) {
  if (!plan || plan === 'free' || subscriptionStatus === 'inactive') {
    return {
      cpuRam: '2 vCPU, 3 GB RAM',
      storage: '10 GB SSD',
    }
  }

  if (plan === 'network') {
    return {
      cpuRam: '8 vCPU, 16 GB RAM',
      storage: '500 GB SSD',
    }
  }

  if (plan === 'label') {
    return {
      cpuRam: '4 vCPU, 8 GB RAM',
      storage: '100 GB SSD',
    }
  }

  if (plan === 'collective') {
    return {
      cpuRam: '2 vCPU, 4 GB RAM',
      storage: '50 GB SSD',
    }
  }

  return {
    cpuRam: '1 vCPU, 2 GB RAM',
    storage: '10 GB SSD',
  }
}

function ActionButton({
  label,
  detail,
  icon: Icon,
  accent,
  loading,
  disabled,
  onClick,
}: {
  label: string
  detail: string
  icon: typeof Power
  accent?: 'light' | 'zinc' | 'warning' | 'danger'
  loading?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  const accentClass = accent === 'light'
    ? 'border-white bg-white text-black hover:bg-zinc-200'
    : accent === 'warning'
      ? 'border-amber-400/30 bg-amber-400/10 text-amber-200 hover:border-amber-300/60 hover:text-white'
      : accent === 'danger'
        ? 'border-red-500/30 bg-red-500/10 text-red-300 hover:border-red-400/60 hover:text-white'
        : 'border-zinc-800 bg-zinc-950/70 text-zinc-300 hover:border-zinc-700 hover:text-white'

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group flex w-full items-center justify-between gap-4 rounded-2xl border px-4 py-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        accentClass,
      )}
    >
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

export function InstanceControlPanel({
  instance,
  stats,
  controlsEnabled,
  autoPairHealth,
  actionLoading,
  onCopyToken,
  onRefreshPairing,
  onAction,
  skillsManagerUrl,
  configManagerUrl,
}: InstanceControlPanelProps) {
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null)
  const isRunning = instance.status === 'running'
  const instanceName = formatInstanceName(instance)
  const lifecycleTelemetry = stats?.telemetry?.lifecycleMetricsAvailable ?? false
  const runtimeHealth = stats?.health === 'healthy' ? 'healthy' : stats?.health || 'checking'
  const gatewayProcess = formatGatewayProcess(instance.gatewayProcessStatus, stats?.health)
  const managedSpecs = getManagedSpecs(instance.plan, instance.subscriptionStatus)
  const maskedToken = instance.gatewayToken
    ? `${instance.gatewayToken.slice(0, 10)}...${instance.gatewayToken.slice(-6)}`
    : 'No token yet'

  const quickLinks = [
    { label: 'Gateway Process', href: instance.controlUiUrl || instance.url, external: true },
    { label: 'Subscription', href: '/billing', external: false },
    { label: "What's New", href: '/dashboard/tech-updates', external: false },
    { label: 'Skills Manager', href: skillsManagerUrl, external: true },
    { label: 'Open Config', href: configManagerUrl, external: true },
  ]

  useEffect(() => {
    fetch('/api/trial')
      .then((res) => res.json())
      .then(setTrialStatus)
      .catch(() => {})
  }, [])

  return (
    <section className="overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-950">
      <div className="border-b border-zinc-800 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.18),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.14),_transparent_32%),linear-gradient(180deg,_rgba(24,24,27,0.92),_rgba(9,9,11,0.96))] px-6 py-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-300/80">Instance Controls</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold uppercase tracking-tight text-white">{instanceName}</h2>
              <StatusBadge status={instance.status || 'unknown'} size="md" />
              <span className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-300">
                <StatusDot status={runtimeHealth === 'healthy' ? 'running' : 'starting'} />
                {runtimeHealth}
              </span>
            </div>
            <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">
              Manage power state, pairing, upgrade flow, and recovery for your managed OpenClaw runtime without leaving the dashboard.
            </p>
          </div>

          <div className="min-w-0 rounded-2xl border border-zinc-800 bg-black/40 p-4 lg:max-w-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Gateway Pairing</p>
                <p className="mt-2 text-sm font-bold uppercase tracking-[0.14em] text-white">
                  {autoPairHealth === 'ready' ? 'Connected' : autoPairHealth === 'missing' ? 'Needs attention' : 'Checking'}
                </p>
                <p className="mt-1 text-[11px] text-zinc-500">{maskedToken}</p>
              </div>
              <span
                className={cn(
                  'mt-1 h-3 w-3 rounded-full',
                  autoPairHealth === 'ready'
                    ? 'bg-emerald-400'
                    : autoPairHealth === 'missing'
                      ? 'bg-amber-400'
                      : 'bg-zinc-600 animate-pulse',
                )}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={onCopyToken}
                disabled={!instance.gatewayToken}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy Token
              </button>
              <button
                onClick={onRefreshPairing}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', autoPairHealth === 'loading' && 'animate-spin')} />
                Refresh Pairing
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-[24px] border border-zinc-800 bg-[linear-gradient(180deg,_rgba(255,255,255,0.03),_rgba(9,9,11,0.9))] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">{formatMachineLabel(instance.userId)}</p>
                  <h3 className="mt-2 text-lg font-bold uppercase tracking-tight text-white">{instanceName}</h3>
                </div>
                <a
                  href={instance.controlUiUrl || instance.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
                >
                  Open
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-zinc-700 bg-black/40 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-100">
                  {managedSpecs.cpuRam}
                </span>
                <span className="rounded-full border border-zinc-700 bg-black/40 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-100">
                  {managedSpecs.storage}
                </span>
              </div>
            </div>

            <div className="rounded-[24px] border border-zinc-800 bg-[linear-gradient(180deg,_rgba(245,158,11,0.08),_rgba(9,9,11,0.9))] p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-2 text-amber-200">
                  <CalendarClock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200/70">Agentbot Setup</p>
                  <h3 className="mt-2 text-lg font-bold tracking-tight text-white">
                    Go from inbox chaos to an AI executive assistant, in one hour.
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    An Agentbot expert configures your email, calendar, and messaging live on a call. Includes 2 months free hosting.
                  </p>
                </div>
              </div>
              <Link
                href="/expert-setup"
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-white bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-zinc-200"
              >
                Book your session
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="rounded-[24px] border border-zinc-800 bg-black/40 p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-2 text-blue-300">
                  <Star className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                    {trialStatus?.trial && !trialStatus.expired
                      ? `Free Trial - ${trialStatus.daysLeft ?? 0} days remaining`
                      : 'Subscription'}
                  </p>
                  <p className="mt-2 text-sm text-white">
                    {trialStatus?.trial && !trialStatus.expired
                      ? `Your trial expires on ${formatDate(trialStatus.endsAt)}.`
                      : `${formatSubscriptionLabel(instance.subscriptionStatus, instance.plan)} is active for this runtime.`}
                  </p>
                </div>
              </div>
              <Link
                href="/billing"
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-zinc-700 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
              >
                {trialStatus?.trial && !trialStatus.expired ? 'Subscribe now' : 'Manage subscription'}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:col-span-2 xl:col-span-3">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Lifecycle</p>
                <h3 className="mt-2 text-lg font-bold uppercase tracking-tight text-white">Power, upgrade, and recovery</h3>
                <p className="mt-1 max-w-xl text-sm text-zinc-400">
                  Safe actions stay grouped here so users can restart, redeploy, or heal their runtime without hunting across the dashboard.
                </p>
              </div>
              <a
                href={instance.controlUiUrl || instance.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-zinc-200"
              >
                Open Gateway
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <ActionButton
                label={isRunning ? 'Restart OpenClaw' : 'Start Machine'}
                detail={isRunning ? 'Graceful runtime restart with managed routing preserved' : 'Boot the managed runtime back into service'}
                icon={isRunning ? RefreshCw : Power}
                accent={isRunning ? 'light' : 'warning'}
                loading={actionLoading === (isRunning ? 'restart' : 'start')}
                disabled={!controlsEnabled || !!actionLoading}
                onClick={() => onAction(isRunning ? 'restart' : 'start')}
              />
              <ActionButton
                label="Redeploy / Upgrade"
                detail="Pull the latest managed image and refresh OpenClaw"
                icon={Sparkles}
                loading={actionLoading === 'update'}
                disabled={!controlsEnabled || !!actionLoading}
                onClick={() => onAction('update')}
              />
              <ActionButton
                label="Recover with Agentbot"
                detail="Run the managed repair flow for tokens, proxy wiring, and config drift"
                icon={Wrench}
                accent="warning"
                loading={actionLoading === 'repair'}
                disabled={!controlsEnabled || !!actionLoading}
                onClick={() => onAction('repair')}
              />
              <Link
                href="/dashboard/maintenance"
                className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-4 text-left transition-colors hover:border-zinc-700 hover:text-white"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-xl border border-current/20 p-2 text-zinc-300">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-200">OpenClaw Doctor</p>
                    <p className="mt-1 text-xs text-zinc-500">Open the maintenance surface for diagnostics, migration help, and guided fixes</p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-zinc-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <ActionButton
                label={isRunning ? 'Stop Machine' : 'Standby'}
                detail={isRunning ? 'Take the runtime offline until you explicitly start it again' : 'Runtime is already offline'}
                icon={Power}
                accent="danger"
                loading={actionLoading === 'stop'}
                disabled={!controlsEnabled || !!actionLoading || !isRunning}
                onClick={() => onAction('stop')}
              />
              <ActionButton
                label="Reset Memory"
                detail="Wipe memory, identity, and conversation history for a clean restart"
                icon={Bot}
                accent="danger"
                loading={actionLoading === 'reset-memory'}
                disabled={!controlsEnabled || !!actionLoading}
                onClick={() => onAction('reset-memory')}
              />
            </div>

            {!controlsEnabled ? (
              <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                Managed lifecycle actions are temporarily gated while the Railway control path is being hardened. Direct gateway links still work.
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[24px] border border-zinc-800 bg-black/40 p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Instance Snapshot</p>
            <dl className="mt-4 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-sm text-zinc-500">State</dt>
                <dd className="text-right text-sm font-bold uppercase tracking-[0.14em] text-white">{instance.status || 'unknown'}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-sm text-zinc-500">Uptime</dt>
                <dd className="text-right text-sm font-bold uppercase tracking-[0.14em] text-white">
                  {lifecycleTelemetry && stats?.uptime ? stats.uptime : 'Live checks only'}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-sm text-zinc-500">Restarts</dt>
                <dd className="text-right text-sm font-bold uppercase tracking-[0.14em] text-zinc-400">—</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-sm text-zinc-500">Last Exit</dt>
                <dd className="text-right text-sm font-bold uppercase tracking-[0.14em] text-zinc-400">—</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-sm text-zinc-500">Provisioned</dt>
                <dd className="text-right text-sm font-bold uppercase tracking-[0.14em] text-white">
                  {formatRelativeTime(instance.provisionedAt)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-[24px] border border-zinc-800 bg-black/40 p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Launch Pads</p>
            <div className="mt-4 space-y-2">
              {quickLinks.map((link) =>
                link.external ? (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between rounded-2xl border border-zinc-800 px-4 py-3 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-900/70 hover:text-white"
                  >
                    <span>{link.label}</span>
                    <ArrowUpRight className="h-4 w-4 text-zinc-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                ) : (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="group flex items-center justify-between rounded-2xl border border-zinc-800 px-4 py-3 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-900/70 hover:text-white"
                  >
                    <span>{link.label}</span>
                    <ArrowUpRight className="h-4 w-4 text-zinc-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                )
              )}
            </div>
          </div>

          <div className="rounded-[24px] border border-zinc-800 bg-black/40 p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-xl border border-zinc-700 p-2 text-zinc-300">
                <LifeBuoy className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Telemetry Note</p>
                <p className="mt-2 text-sm text-zinc-300">
                  Restart counts, last exit codes, and deeper machine stats aren&apos;t exposed by the managed runtime API yet.
                </p>
                <p className="mt-2 text-xs leading-6 text-zinc-500">
                  This panel stays honest: live state, pairing, version, and recovery are real; deeper host telemetry will land here once the backend exposes it safely.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
