import type { JSX } from 'react'

export function Spinner({ size = 16 }: { size?: number }): JSX.Element {
  return (
    <svg
      className="inline-block animate-spin text-orange-400"
      role="status"
      aria-label="Loading"
      viewBox="0 0 24 24"
      style={{
        width: size,
        height: size,
      }}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.22"
        strokeWidth="3"
      />
      <path
        d="M22 12a10 10 0 0 1-10 10"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="3"
      />
    </svg>
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
