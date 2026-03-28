'use client'

import { cn } from '@/lib/utils'
import { useSidebar } from '@/app/dashboard/sidebar-context'

interface DashboardShellProps {
  children: React.ReactNode
  className?: string
}

export function DashboardShell({ children, className }: DashboardShellProps) {
  return (
    <div className={cn('bg-black text-white selection:bg-blue-500/30 font-mono', className)}>
      {children}
    </div>
  )
}

interface DashboardHeaderProps {
  title: string
  icon?: React.ReactNode
  count?: number
  action?: React.ReactNode
  className?: string
}

export function DashboardHeader({
  title,
  icon,
  count,
  action,
  className,
}: DashboardHeaderProps) {
  const { toggle } = useSidebar()

  return (
    <div
      className={cn(
        'sticky top-0 z-30 bg-zinc-950 px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-900 flex items-center justify-between gap-3 overflow-hidden',
        className
      )}
    >
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
        {/* Mobile hamburger — opens sidebar from context */}
        <button
          onClick={toggle}
          className="md:hidden p-1.5 -ml-1 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          aria-label="Open menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        {icon}
        <h1 className="text-sm sm:text-base font-bold tracking-tight font-mono uppercase truncate">{title}</h1>
        {count !== undefined && (
          <span className="text-xs text-zinc-500 bg-zinc-900 border border-zinc-700 px-2 py-0.5 font-mono">
            {count}
          </span>
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
