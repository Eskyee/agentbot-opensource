/**
 * StatusDot — adapted from vercel/ui (Geist) for the agentbot brand.
 * Flexible state names so it can drop into existing call sites.
 */
import * as React from 'react'
import { cn } from '@/lib/utils'

type State =
  | 'ok'
  | 'online'
  | 'ready'
  | 'degraded'
  | 'building'
  | 'queued'
  | 'down'
  | 'error'
  | 'offline'
  | 'idle'
  | 'canceled'

const COLOR: Record<State, string> = {
  ok: 'bg-green-500',
  online: 'bg-green-500',
  ready: 'bg-green-500',
  degraded: 'bg-yellow-500',
  building: 'bg-orange-500',
  queued: 'bg-zinc-600',
  down: 'bg-red-500',
  error: 'bg-red-500',
  offline: 'bg-red-500',
  idle: 'bg-zinc-600',
  canceled: 'bg-zinc-600',
}

const TEXT: Record<State, string> = {
  ok: 'text-green-400',
  online: 'text-green-400',
  ready: 'text-green-400',
  degraded: 'text-yellow-400',
  building: 'text-orange-400',
  queued: 'text-zinc-500',
  down: 'text-red-400',
  error: 'text-red-400',
  offline: 'text-red-400',
  idle: 'text-zinc-500',
  canceled: 'text-zinc-500',
}

const LABEL: Record<State, string> = {
  ok: 'Online',
  online: 'Online',
  ready: 'Ready',
  degraded: 'Degraded',
  building: 'Building',
  queued: 'Queued',
  down: 'Down',
  error: 'Error',
  offline: 'Offline',
  idle: 'Idle',
  canceled: 'Canceled',
}

interface StatusDotProps {
  state: State
  /** Show the text label next to the dot. Pass a string to override it. */
  label?: boolean | string
  /** Animated pulse halo for live states */
  pulse?: boolean
  className?: string
}

export function StatusDot({ state, label, pulse, className }: StatusDotProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full animate-ping rounded-full opacity-60',
              COLOR[state]
            )}
          />
        )}
        <span className={cn('relative inline-flex h-2 w-2 rounded-full', COLOR[state])} />
      </span>
      {label && (
        <span className={cn('text-[10px] font-mono uppercase tracking-widest', TEXT[state])}>
          {typeof label === 'string' ? label : LABEL[state]}
        </span>
      )}
    </span>
  )
}
