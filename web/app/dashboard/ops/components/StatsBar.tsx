'use client'

interface FleetStats {
  running: number
  total: number
  throughput: { callsPerMin: number; p95: number }
  verifiedFacts: { percent: number; mirrorLag: number }
  errors: { percent: number; flagged: string[] }
  spend24h: { amount: number; budgetPercent: number }
}

interface StatsBarProps {
  stats: FleetStats | null
  loading?: boolean
}

function StatBlock({
  label,
  value,
  sub,
  color = 'text-zinc-300',
}: {
  label: string
  value: string
  sub: string
  color?: string
}) {
  return (
    <div className="flex-1 min-w-0 px-3 py-2 bg-zinc-950 border border-zinc-800">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">{label}</div>
      <div className={`text-sm font-mono font-bold ${color}`}>{value}</div>
      <div className="text-[10px] font-mono text-zinc-600">{sub}</div>
    </div>
  )
}

export function StatsBar({ stats, loading }: StatsBarProps) {
  if (loading || !stats) {
    return (
      <div className="flex gap-2 mb-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex-1 h-16 bg-zinc-950 border border-zinc-800 animate-pulse" />
        ))}
      </div>
    )
  }

  const formatNumber = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(2)}k`
    return n.toFixed(0)
  }

  return (
    <div className="flex gap-2 mb-4">
      <StatBlock
        label="Running"
        value={`${String(stats.running).padStart(2, '0')}/${stats.total}`}
        sub={`+2 · 5m`}
        color="text-green-400"
      />
      <StatBlock
        label="Throughput"
        value={`${formatNumber(stats.throughput.callsPerMin)}/min`}
        sub={`p95 ${stats.throughput.p95}ms`}
      />
      <StatBlock
        label="Verified Facts"
        value={`${stats.verifiedFacts.percent}%`}
        sub={`lag ${stats.verifiedFacts.mirrorLag}ms`}
        color="text-green-400"
      />
      <StatBlock
        label="Errors"
        value={`${String(stats.errors.percent).padStart(4, '0')}%`}
        sub={stats.errors.flagged.length > 0 ? `flagged: ${stats.errors.flagged[0]}` : 'none'}
        color={stats.errors.percent > 1 ? 'text-red-400' : 'text-zinc-300'}
      />
      <StatBlock
        label="Spend 24H"
        value={`$${stats.spend24h.amount}`}
        sub={`${stats.spend24h.budgetPercent}% of budget`}
        color={stats.spend24h.budgetPercent > 80 ? 'text-yellow-400' : 'text-zinc-300'}
      />
    </div>
  )
}
