import { CheckCircle, Clock, XCircle, AlertTriangle, Loader2, Ban, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

type AgentStatus =
  | 'running'
  | 'deploying'
  | 'starting'
  | 'stopping'
  | 'stopped'
  | 'error'
  | 'crashed'
  | 'degraded'
  | 'unknown'
  | 'provisioning'
  | 'bootstrapping'
  | 'ready'

const STATUS_CONFIG: Record<AgentStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
  running:        { label: 'Running',        color: 'bg-green-600/20 text-green-400 border-green-600/30',   icon: CheckCircle },
  ready:          { label: 'Ready',          color: 'bg-green-600/20 text-green-400 border-green-600/30',   icon: CheckCircle },
  deploying:      { label: 'Deploying',      color: 'bg-orange-600/20 text-orange-400 border-orange-600/30', icon: Loader2 },
  provisioning:   { label: 'Provisioning',   color: 'bg-orange-600/20 text-orange-400 border-orange-600/30', icon: Loader2 },
  starting:       { label: 'Starting',       color: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30', icon: Clock },
  bootstrapping:  { label: 'Bootstrapping',  color: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30', icon: Clock },
  stopping:       { label: 'Stopping',       color: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30', icon: Clock },
  stopped:        { label: 'Stopped',        color: 'bg-zinc-600/20 text-zinc-400 border-zinc-600/30',       icon: Ban },
  degraded:       { label: 'Degraded',       color: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30', icon: AlertTriangle },
  error:          { label: 'Error',          color: 'bg-red-600/20 text-red-400 border-red-600/30',         icon: XCircle },
  crashed:        { label: 'Crashed',        color: 'bg-red-600/20 text-red-400 border-red-600/30',         icon: Zap },
  unknown:        { label: 'Unknown',        color: 'bg-zinc-600/20 text-zinc-400 border-zinc-600/30',       icon: Clock },
}

interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md'
  className?: string
  showIcon?: boolean
}

export function StatusBadge({ status, size = 'sm', className, showIcon = true }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status as AgentStatus] || STATUS_CONFIG.unknown
  const Icon = config.icon
  const isAnimated = ['deploying', 'provisioning', 'starting', 'bootstrapping', 'stopping'].includes(status)

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border font-mono font-bold uppercase tracking-widest',
      size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs',
      config.color,
      className,
    )}>
      {showIcon && <Icon className={cn('w-3 h-3', isAnimated && 'animate-spin')} />}
      {config.label}
    </span>
  )
}

export function StatusDot({ status, className }: { status: string; className?: string }) {
  const config = STATUS_CONFIG[status as AgentStatus] || STATUS_CONFIG.unknown
  const dotColor = config.color.includes('green') ? 'bg-green-400'
    : config.color.includes('orange') ? 'bg-orange-400'
    : config.color.includes('yellow') ? 'bg-yellow-400'
    : config.color.includes('red') ? 'bg-red-400'
    : 'bg-zinc-500'
  const isAnimated = ['deploying', 'provisioning', 'starting', 'bootstrapping'].includes(status)

  return <span className={cn('h-2.5 w-2.5 rounded-full', dotColor, isAnimated && 'animate-pulse', className)} />
}
