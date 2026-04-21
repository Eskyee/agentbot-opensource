import { cn } from '@/lib/utils'

interface DashboardShellProps {
  children: React.ReactNode
  className?: string
}

export function DashboardShell({ children, className }: DashboardShellProps) {
  return (
    <div
      className={cn(
        'min-h-screen bg-black text-white font-mono selection:bg-orange-500/30 relative overflow-hidden',
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.14),transparent_28%),radial-gradient(circle_at_top_left,rgba(251,146,60,0.08),transparent_24%),linear-gradient(180deg,rgba(24,24,27,0.96),rgba(0,0,0,1))]" />
      <div className="relative z-10">
      {children}
      </div>
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
        'px-4 sm:px-6 py-4 sm:py-5 border-b border-zinc-800/80 bg-zinc-950/75 backdrop-blur-sm flex items-center justify-between gap-3 overflow-hidden shadow-[inset_0_-1px_0_rgba(120,53,15,0.25)]',
        className
      )}
    >
      <div className="min-w-0 flex-shrink">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {icon}
          <h1 className="text-base sm:text-xl font-bold tracking-tight font-mono truncate text-white">{title}</h1>
          {count !== undefined && (
            <span className="text-xs text-orange-200 bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-0.5 font-mono">
              {count}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="mt-1 text-xs text-zinc-400 truncate">{subtitle}</p>
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
