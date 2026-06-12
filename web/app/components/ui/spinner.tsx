/**
 * Spinner — Geist 12-blade spinner, adapted from vercel/ui for the agentbot brand.
 * Requires the `spinner-fade` keyframes in globals.css.
 */
import * as React from 'react'
import { cn } from '@/lib/utils'

interface SpinnerProps {
  size?: number
  className?: string
}

export function Spinner({ size = 20, className }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn('shrink-0', className)}
      style={{ width: size, height: size }}
    >
      <div className="relative left-1/2 top-1/2 h-full w-full">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute left-[-10%] top-[-3.9%] h-[8%] w-[24%] rounded-[5px] bg-zinc-400 [animation:spinner-fade_1.2s_linear_infinite]"
            style={{
              transform: `rotate(${i * 30}deg) translate(146%)`,
              animationDelay: `${-1.2 + i * 0.1}s`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
