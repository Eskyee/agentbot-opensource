'use client'

import { useState, useEffect, useCallback } from 'react'

interface FleetInstance {
  designation: string
  status: { active: boolean; fitness?: number; uptime?: number }
}

interface FleetStatusProps {
  onSelect?: (designation: string) => void
  selected?: string | null
}

export function FleetStatus({ onSelect, selected }: FleetStatusProps) {
  const [instances, setInstances] = useState<FleetInstance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFleet = useCallback(async () => {
    try {
      const res = await fetch('/api/mission-control/fleet/traces')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setInstances(data.instances || data.traces || data || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFleet()
    const interval = setInterval(fetchFleet, 15000)
    return () => clearInterval(interval)
  }, [fetchFleet])

  const getStatusColor = (instance: FleetInstance) => {
    if (instance.status?.active) return 'text-green-500 border-l-green-500'
    if (instance.status?.fitness !== undefined && instance.status.fitness < 0.3) return 'text-red-500 border-l-red-500'
    return 'text-yellow-500 border-l-yellow-500'
  }

  const getStatusLabel = (instance: FleetInstance) => {
    if (instance.status?.active) return 'ACTIVE'
    if (instance.status?.fitness !== undefined && instance.status.fitness < 0.3) return 'ERROR'
    return 'IDLE'
  }

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-none p-3">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">
        Fleet Status
      </div>
      {loading && <div className="text-xs text-zinc-500">Loading fleet...</div>}
      {error && <div className="text-xs text-red-500">{error}</div>}
      {!loading && !error && instances.length === 0 && (
        <div className="text-xs text-zinc-600">No fleet instances detected</div>
      )}
      <div className="space-y-1">
        {instances.map((inst) => (
          <button
            key={inst.designation}
            onClick={() => onSelect?.(inst.designation)}
            className={`w-full text-left px-2 py-1.5 border-l-2 ${getStatusColor(inst)} bg-zinc-900 hover:bg-zinc-800 transition-colors rounded-none ${
              selected === inst.designation ? 'bg-zinc-800' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-300">{inst.designation}</span>
              <span className={`text-[10px] uppercase tracking-widest ${getStatusColor(inst).split(' ')[0]}`}>
                {getStatusLabel(inst)}
              </span>
            </div>
            {inst.status?.fitness !== undefined && (
              <div className="text-[10px] text-zinc-600 mt-0.5">
                fitness: {(inst.status.fitness * 100).toFixed(1)}%
                {inst.status?.uptime !== undefined && ` · uptime: ${inst.status.uptime}h`}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
