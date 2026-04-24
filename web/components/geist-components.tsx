import type { JSX } from 'react'

export function Spinner({ size = 16 }: { size?: number }): JSX.Element {
  return (
    <span
      className="inline-block animate-spin rounded-full border-current border-r-transparent text-orange-400"
      aria-label="Loading"
      style={{
        width: size,
        height: size,
        borderWidth: Math.max(2, Math.round(size / 10)),
      }}
    />
  )
}

export function LoadingDots({ size = 3 }: { size?: number }): JSX.Element {
  return (
    <span className="inline-flex items-center gap-1 text-orange-400" aria-label="Loading">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="block rounded-full bg-current animate-pulse"
          style={{
            width: size,
            height: size,
            animationDelay: `${index * 120}ms`,
          }}
        />
      ))}
    </span>
  )
}
