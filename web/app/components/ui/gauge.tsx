/**
 * Gauge — circular progress arc, adapted from vercel/ui (Geist) for the
 * agentbot brand. Clean SVG implementation: semantic thresholds by default
 * (green / amber / red), or pass an explicit color.
 */
import * as React from 'react'
import { cn } from '@/lib/utils'

const SIZES = {
  tiny: { px: 20, stroke: 10, text: 'text-[0px]' },
  small: { px: 32, stroke: 10, text: 'text-[11px] font-medium' },
  medium: { px: 64, stroke: 10, text: 'text-lg font-medium' },
  large: { px: 128, stroke: 10, text: 'text-3xl font-semibold' },
} as const

interface GaugeProps {
  /** 0–100 */
  value: number
  size?: keyof typeof SIZES
  showValue?: boolean
  /** Override arc color (any CSS color). Defaults to threshold colors. */
  color?: string
  /** Track color */
  trackColor?: string
  className?: string
}

export function Gauge({
  value,
  size = 'medium',
  showValue,
  color,
  trackColor = 'rgba(255,255,255,0.10)',
  className,
}: GaugeProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const { px, stroke, text } = SIZES[size]

  const arcColor =
    color ??
    (clamped >= 68
      ? '#22c55e' // green-500
      : clamped >= 34
        ? '#f59e0b' // amber-500
        : '#ef4444') // red-500

  const r = 45
  const circumference = 2 * Math.PI * r

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      role="meter"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg fill="none" viewBox="0 0 100 100" height={px} width={px}>
        <circle
          cx="50"
          cy="50"
          r={r}
          stroke={trackColor}
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        <circle
          cx="50"
          cy="50"
          r={r}
          stroke={arcColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(clamped / 100) * circumference} ${circumference}`}
          transform="rotate(-90 50 50)"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {showValue && size !== 'tiny' && (
        <span className={cn('absolute font-mono text-white', text)}>{Math.round(clamped)}</span>
      )}
    </div>
  )
}
