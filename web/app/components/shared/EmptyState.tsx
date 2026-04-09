import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'text-center py-12 bg-zinc-900/50 border border-zinc-800 rounded-xl',
        className
      )}
    >
      {icon && <div className="mb-4 flex justify-center">{icon}</div>}
      <p className="text-zinc-400 text-sm">{title}</p>
      {description && (
        <p className="text-xs text-zinc-500 mt-1">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
