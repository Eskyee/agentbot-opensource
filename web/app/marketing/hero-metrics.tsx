'use client'

import { useState, useEffect } from 'react'

const c = {
  bg: '#000000',
  ink: '#f0f0f5',
  mute: '#7a7a8e',
  line: '#3a3a50',
}

interface PublicStats {
  fleetSize: number
  callsPerMin: number
  p95: number
  mirrorLag: number
  verifiedFacts: number
}

export function HeroMetrics() {
  const [stats, setStats] = useState<PublicStats | null>(null)

  useEffect(() => {
    fetch('/api/ops/public-stats')
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
  }, [])

  const metrics = stats
    ? [
        { v: String(stats.fleetSize), k: 'fleet · prod' },
        { v: `${stats.verifiedFacts}%`, k: 'verified facts' },
        { v: stats.p95 > 0 ? `${stats.p95}ms` : '—', k: 'p95 inference' },
        { v: stats.mirrorLag > 0 ? `${Math.round(stats.mirrorLag)}ms` : '—', k: 'mirror lag' },
      ]
    : [
        { v: '—', k: 'fleet · prod' },
        { v: '—', k: 'verified facts' },
        { v: '—', k: 'p95 inference' },
        { v: '—', k: 'mirror lag' },
      ]

  return (
    <div
      className="mt-11 grid grid-cols-4 border"
      style={{ background: c.line, borderColor: c.line, gap: 1 }}
    >
      {metrics.map((m) => (
        <div
          key={m.k}
          className="flex flex-col gap-[2px] p-[14px_16px]"
          style={{ background: c.bg }}
        >
          <b
            className="text-xl font-medium tabular-nums"
            style={{ color: c.ink }}
          >
            {m.v}
          </b>
          <span
            className="text-[9.5px] tracking-[0.18em] uppercase"
            style={{ color: c.mute }}
          >
            {m.k}
          </span>
        </div>
      ))}
    </div>
  )
}
