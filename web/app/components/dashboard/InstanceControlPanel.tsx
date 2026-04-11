'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowUpRight,
  Bot,
  Copy,
  ExternalLink,
  Loader2,
  Power,
  RefreshCw,
  ShieldCheck,
  Sparkles,
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

  const label = instance.subdomain.split('.')[0] || 'Agentbot Runtime'
  return label
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function formatPlanLabel(plan?: string | null) {
  if (!plan) return 'Managed'
  return plan.charAt(0).toUpperCase() + plan.slice(1)
}

function formatSubscriptionLabel(value?: string | null, fallbackPlan?: string) {
  if (!value || value === 'inactive') return `${formatPlanLabel(fallbackPlan)} plan`
  return value.replace(/_/g, ' ')
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

function SummaryCard({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail?: string
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">{label}</p>
      <p className="mt-2 text-sm font-bold uppercase tracking-[0.14em] text-white">{value}</p>
      {detail ? <p className="mt-1 text-xs text-zinc-500">{detail}</p> : null}
    </div>
  )
}

function ActionButton({
  label,
  detail,
  icon: Icon,
  tone = 'default',
  loading,
  disabled,
  onClick,
}: {
  label: string
  detail: string
  icon: typeof Power
  tone?: 'default' | 'primary' | 'warning' | 'danger'
  loading?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  const toneClass = tone === 'primary'
    ? 'border-white bg-white text-black hover:bg-zinc-200'
    : tone === 'warning'
      ? 'border-amber-400/30 bg-amber-400/10 text-amber-200 hover:border-amber-300/60 hover:text-white'
      : tone === 'danger'
        ? 'border-red-500/30 bg-red-500/10 text-red-300 hover:border-red-400/60 hover:text-white'
        : 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700 hover:text-white'

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        toneClass,
      )}
    >
      <div className="mt-0.5 rounded-xl border border-current/20 p-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em]">{label}</p>
        <p className="mt-1 text-xs normal-case tracking-normal text-current/70">{detail}</p>
      </div>
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

  useEffect(() => {
    fetch('/api/trial')
      .then((res) => res.json())
      .then(setTrialStatus)
      .catch(() => {})
  }, [])

  const instanceName = formatInstanceName(instance)
  const isRunning = instance.status === 'running'
  const lifecycleTelemetry = stats?.telemetry?.lifecycleMetricsAvailable ?? false
  const runtimeHealth = stats?.health === 'healthy' ? 'healthy' : stats?.health || 'checking'
  const managedSpecs = getManagedSpecs(instance.plan, instance.subscriptionStatus)

  const quickLinks = [
    { label: 'Open Agentbot', href: instance.controlUiUrl || instance.url, external: true },
    { label: 'Skills Manager', href: skillsManagerUrl, external: true },
    { label: 'Config', href: configManagerUrl, external: true },
    { label: 'Billing', href: '/billing', external: false },
    { label: 'Channels', href: '/dashboard/channels', external: false },
    { label: 'Updates', href: '/dashboard/tech-updates', external: false },
  ]

  return (
    <section className="rounded-[28px] border border-zinc-800 bg-zinc-900/70">
      <div className="border-b border-zinc-800 px-5 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">Agentbot Runtime</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{instanceName}</h2>
              <StatusBadge status={instance.status || 'unknown'} size="md" />
              <span className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-300">
                <StatusDot status={runtimeHealth === 'healthy' ? 'running' : 'starting'} />
                {runtimeHealth}
              </span>
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
              Clean controls for your Agentbot instance, with the runtime actions and machine facts in one place.
            </p>
          </div>

          <a
            href={instance.controlUiUrl || instance.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-zinc-200"
          >
            Open
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-100">
            {managedSpecs.cpuRam}
          </span>
          <span className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-100">
            {managedSpecs.storage}
          </span>
          <span className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-100">
            {formatSubscriptionLabel(instance.subscriptionStatus, instance.plan)}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/expert-setup"
            className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
          >
            Book setup
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/billing"
            className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
          >
            {trialStatus?.trial && !trialStatus.expired
              ? `Trial ends ${formatDate(trialStatus.endsAt)}`
              : 'Manage billing'}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="space-y-6 px-5 py-5 sm:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
          <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/80 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Instance Controls</p>
                <h3 className="mt-2 text-lg font-bold tracking-tight text-white">Manage power state and gateway lifecycle</h3>
              </div>
              <div className="flex flex-wrap gap-2">
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

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <ActionButton
                label={isRunning ? 'Restart Agentbot' : 'Start Machine'}
                detail={isRunning ? 'Restart the running Agentbot instance.' : 'Bring this Agentbot instance online.'}
                icon={isRunning ? RefreshCw : Power}
                tone={isRunning ? 'primary' : 'warning'}
                loading={actionLoading === (isRunning ? 'restart' : 'start')}
                disabled={!controlsEnabled || !!actionLoading}
                onClick={() => onAction(isRunning ? 'restart' : 'start')}
              />
              <ActionButton
                label="Redeploy or Upgrade"
                detail="Pull the latest managed runtime image."
                icon={Sparkles}
                loading={actionLoading === 'update'}
                disabled={!controlsEnabled || !!actionLoading}
                onClick={() => onAction('update')}
              />
              <Link
                href="/dashboard/maintenance"
                className="flex items-start gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-left transition-colors hover:border-zinc-700 hover:text-white"
              >
                <div className="mt-0.5 rounded-xl border border-current/20 p-2 text-zinc-300">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-200">Agentbot Doctor</p>
                  <p className="mt-1 text-xs text-zinc-500">Diagnostics, maintenance, and guided fixes.</p>
                </div>
              </Link>
              <ActionButton
                label="Agentbot Recovery"
                detail="Repair tokens, proxy wiring, and config drift."
                icon={Wrench}
                tone="warning"
                loading={actionLoading === 'repair'}
                disabled={!controlsEnabled || !!actionLoading}
                onClick={() => onAction('repair')}
              />
              <ActionButton
                label={isRunning ? 'Stop Machine' : 'Standby'}
                detail={isRunning ? 'Take this instance offline until restarted.' : 'This instance is already offline.'}
                icon={Power}
                tone="danger"
                loading={actionLoading === 'stop'}
                disabled={!controlsEnabled || !!actionLoading || !isRunning}
                onClick={() => onAction('stop')}
              />
              <ActionButton
                label="Reset Memory"
                detail="Wipe memory, identity, and conversation history."
                icon={Bot}
                tone="danger"
                loading={actionLoading === 'reset-memory'}
                disabled={!controlsEnabled || !!actionLoading}
                onClick={() => onAction('reset-memory')}
              />
            </div>

            {!controlsEnabled ? (
              <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                Managed lifecycle actions are temporarily gated while the control path is being hardened.
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <SummaryCard label="State" value={instance.status || 'unknown'} detail={runtimeHealth} />
              <SummaryCard
                label="Uptime"
                value={lifecycleTelemetry && stats?.uptime ? stats.uptime : 'Live checks only'}
                detail="Detailed lifecycle telemetry is not exposed yet"
              />
              <SummaryCard label="Restarts" value="—" detail="Not exposed by the runtime API yet" />
              <SummaryCard label="Last Exit" value="—" detail="Not exposed by the runtime API yet" />
              <SummaryCard label="Provisioned" value={formatRelativeTime(instance.provisionedAt)} detail={instance.subdomain} />
              <SummaryCard label="Version" value={instance.openclawVersion || 'unknown'} detail={instance.userId} />
            </div>

            <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/80 p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Quick Links</p>
              <div className="mt-4 space-y-2">
                {quickLinks.map((link) =>
                  link.external ? (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-2xl border border-zinc-800 px-4 py-3 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-900 hover:text-white"
                    >
                      <span>{link.label}</span>
                      <ArrowUpRight className="h-4 w-4 text-zinc-600" />
                    </a>
                  ) : (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="flex items-center justify-between rounded-2xl border border-zinc-800 px-4 py-3 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-900 hover:text-white"
                    >
                      <span>{link.label}</span>
                      <ArrowUpRight className="h-4 w-4 text-zinc-600" />
                    </Link>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
