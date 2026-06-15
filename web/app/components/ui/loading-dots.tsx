/**
 * LoadingDots — Geist blinking dots, adapted from vercel/ui for the agentbot brand.
 * Requires the `loading-dots-blink` keyframes in globals.css.
 */
import * as React from 'react'
import { cn } from '@/lib/utils'

interface LoadingDotsProps {
  size?: number
  className?: string
  children?: React.ReactNode
}

export function LoadingDots({ size = 3, className, children }: LoadingDotsProps) {
  return (
    <span className={cn('inline-flex items-center text-zinc-400', className)} aria-label="Loading">
      {children && <span className="mr-3 inline-block">{children}</span>}
      {[0, 200, 400].map((delay) => (
        <span
          key={delay}
          className="mx-[1px] inline-block rounded-full bg-current [animation:loading-dots-blink_1.4s_both_infinite]"
          style={{ width: size, height: size, animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  )
}
