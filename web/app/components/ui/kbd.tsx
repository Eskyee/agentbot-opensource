/**
 * Kbd — keyboard input hint, adapted from vercel/ui (Geist) for the agentbot brand.
 */
import * as React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const kbdVariants = cva(
  'inline-flex items-center justify-center gap-0.5 rounded border border-zinc-700 bg-zinc-900 font-mono text-zinc-400 shadow-[inset_0_-1px_0_rgba(255,255,255,0.06)]',
  {
    variants: {
      size: {
        small: 'min-w-[18px] px-1 text-[10px] leading-4',
        medium: 'min-w-[22px] min-h-[22px] px-1.5 text-[11px] leading-5',
      },
    },
    defaultVariants: { size: 'medium' },
  }
)

interface KbdProps {
  meta?: boolean
  shift?: boolean
  alt?: boolean
  ctrl?: boolean
  small?: boolean
  className?: string
  children?: React.ReactNode
}

export function Kbd({ meta, shift, alt, ctrl, small, className, children }: KbdProps) {
  return (
    <kbd className={cn(kbdVariants({ size: small ? 'small' : 'medium' }), className)}>
      {meta && <span>⌘</span>}
      {shift && <span>⇧</span>}
      {alt && <span>⌥</span>}
      {ctrl && <span>⌃</span>}
      {children != null && <span>{children}</span>}
    </kbd>
  )
}
