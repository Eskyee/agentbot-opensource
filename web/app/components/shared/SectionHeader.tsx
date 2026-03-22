import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  label?: string
  title: string
  description?: string
  badgeVariant?: 'outline' | 'secondary'
  className?: string
  children?: React.ReactNode
}

export function SectionHeader({
  label,
  title,
  description,
  badgeVariant = 'outline',
  className,
  children,
}: SectionHeaderProps) {
  return (
    <div className={cn('mb-8', className)}>
      {label && (
        <Badge
          variant={badgeVariant}
          className={cn(
            'mb-4 text-[10px] uppercase tracking-widest',
            badgeVariant === 'outline' && 'border-zinc-800 text-blue-500'
          )}
        >
          {label}
        </Badge>
      )}
      <h2 className="text-2xl md:text-3xl font-bold tracking-tighter uppercase">
        {title}
      </h2>
      {description && (
        <p className="text-zinc-400 text-sm max-w-md leading-relaxed mt-3">
          {description}
        </p>
      )}
      {children}
    </div>
  )
}
