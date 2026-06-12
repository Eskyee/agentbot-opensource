/**
 * Note — inline callout, adapted from vercel/ui (Geist) for the agentbot brand.
 */
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { AlertOctagon, AlertTriangleIcon, CheckCircle2, InfoIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const noteVariants = cva(
  'flex grow items-center justify-between gap-3 rounded-md border font-mono leading-normal [word-break:break-word]',
  {
    variants: {
      variant: {
        secondary: 'border-zinc-800 bg-zinc-950 text-zinc-400',
        success: 'border-green-900 bg-green-950/40 text-green-300',
        error: 'border-red-900 bg-red-950/40 text-red-300',
        warning: 'border-amber-900 bg-amber-950/40 text-amber-300',
        brand: 'border-orange-900 bg-orange-950/30 text-orange-300',
      },
      size: {
        small: 'min-h-[34px] px-2 py-1.5 text-[12px]',
        medium: 'min-h-[40px] px-3 py-2 text-sm',
        large: 'min-h-[48px] px-3 py-[11px] text-base',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'medium' },
  }
)

const icons = {
  success: CheckCircle2,
  error: AlertOctagon,
  warning: AlertTriangleIcon,
} as const

interface NoteProps {
  children: React.ReactNode
  action?: React.ReactNode
  size?: VariantProps<typeof noteVariants>['size']
  type?: VariantProps<typeof noteVariants>['variant']
  className?: string
}

export function Note({ action, children, size, type = 'secondary', className }: NoteProps) {
  const Icon = icons[type as keyof typeof icons] ?? InfoIcon

  return (
    <div className={cn(noteVariants({ variant: type, size }), className)}>
      <span className="flex items-center gap-3">
        <Icon className="h-4 w-4 shrink-0" />
        <span>{children}</span>
      </span>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
