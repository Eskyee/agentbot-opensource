import { cn } from '@/lib/utils'

interface DashboardShellProps {
  children: React.ReactNode
  className?: string
}

export function DashboardShell({ children, className }: DashboardShellProps) {
  return (
    <div className={cn('min-h-screen bg-black text-white selection:bg-blue-500/30 font-mono', className)}>
      {children}
    </div>
  )
}

interface DashboardHeaderProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  count?: number
  action?: React.ReactNode
  className?: string
}

export function DashboardHeader({
  title,
  subtitle,
  icon,
  count,
  action,
  className,
}: DashboardHeaderProps) {
  return (
    <div
      className={cn(
        'px-4 sm:px-6 py-4 sm:py-5 border-b border-zinc-800 flex items-center justify-between gap-3 overflow-hidden',
        className
      )}
    >
      <div className="min-w-0 flex-shrink">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {icon}
          <h1 className="text-base sm:text-xl font-bold tracking-tight font-mono truncate">{title}</h1>
          {count !== undefined && (
            <span className="text-xs text-zinc-500 bg-zinc-900 border border-zinc-700 rounded-full px-3 py-0.5 font-mono">
              {count}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="mt-1 text-xs text-zinc-500 truncate">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  )
}

interface DashboardContentProps {
  children: React.ReactNode
  className?: string
}

export function DashboardContent({ children, className }: DashboardContentProps) {
  return (
    <div className={cn('px-6 py-6', className)}>
      {children}
    </div>
  )
}
