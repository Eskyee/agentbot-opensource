'use client'

import { useState, useEffect, useCallback } from 'react'

interface Swarm {
  id: string
  name: string
  description?: string
  agents: string[]
  enabled: boolean
}

export function SwarmList() {
  const [swarms, setSwarms] = useState<Swarm[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSwarms = useCallback(async () => {
    try {
      const res = await fetch('/api/swarms')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setSwarms(data.swarms || [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSwarms()
  }, [fetchSwarms])

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-none p-3">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">
        Swarms
      </div>
      {loading && <div className="text-xs text-zinc-500">Loading...</div>}
      {!loading && swarms.length === 0 && (
        <div className="text-xs text-zinc-600">No swarms</div>
      )}
      <div className="space-y-1">
        {swarms.map((swarm) => (
          <div
            key={swarm.id}
            className="px-2 py-1.5 border-l-2 border-l-zinc-700 bg-zinc-900 rounded-none"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-300">{swarm.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-600">{swarm.agents.length} agents</span>
                <span className={`text-[10px] uppercase tracking-widest ${swarm.enabled ? 'text-green-500' : 'text-zinc-600'}`}>
                  {swarm.enabled ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
