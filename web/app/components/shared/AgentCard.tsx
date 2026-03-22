import { cn } from '@/lib/utils'

interface AgentCardProps {
  children: React.ReactNode
  className?: string
  bordered?: boolean
  padding?: 'sm' | 'md' | 'lg'
}

export function AgentCard({
  children,
  className,
  bordered = true,
  padding = 'md',
}: AgentCardProps) {
  const paddingMap = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  return (
    <div
      className={cn(
        'bg-zinc-900 rounded-xl',
        bordered && 'border border-zinc-800',
        paddingMap[padding],
        className
      )}
    >
      {children}
    </div>
  )
}

interface AgentCardHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}

export function AgentCardHeader({
  title,
  subtitle,
  action,
  className,
}: AgentCardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between mb-4', className)}>
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider">{title}</h3>
        {subtitle && (
          <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  )
}

interface AgentStatProps {
  label: string
  value: string | number
  change?: string
  className?: string
}

export function AgentStat({ label, value, change, className }: AgentStatProps) {
  return (
    <div className={cn('', className)}>
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">
        {label}
      </div>
      <div className="text-2xl font-bold tracking-tighter">{value}</div>
      {change && (
        <div className="text-xs text-green-400 mt-1">{change}</div>
      )}
    </div>
  )
}
