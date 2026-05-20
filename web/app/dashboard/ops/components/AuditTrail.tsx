'use client'

import { useState, useEffect, useCallback } from 'react'

interface AuditEntry {
  id: string
  created_at: string
  channel: string
  content: string
  from_agent: string
  to_agent?: string
}

export function AuditTrail() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAudit = useCallback(async () => {
    try {
      const res = await fetch('/api/bridge/inbox?channel=ops&reader=atlas-main&limit=30')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setEntries(data.messages || data || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAudit()
    const interval = setInterval(fetchAudit, 30000)
    return () => clearInterval(interval)
  }, [fetchAudit])

  const formatTime = (ts: string) => {
    try {
      const date = new Date(ts)
      return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ts
    }
  }

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-none p-3 flex flex-col min-h-[300px]">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">
        Audit Trail
      </div>
      {loading && <div className="text-xs text-zinc-500">Loading...</div>}
      {error && <div className="text-xs text-red-500">{error}</div>}
      {!loading && !error && entries.length === 0 && (
        <div className="text-xs text-zinc-600 text-center py-4">No recent operations</div>
      )}
      <div className="flex-1 overflow-y-auto space-y-1">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-start gap-2 px-2 py-1 border-l-2 border-l-zinc-700 bg-zinc-900 rounded-none"
          >
            <span className="text-[10px] text-zinc-600 font-mono shrink-0 w-10">
              {formatTime(entry.created_at)}
            </span>
            <div className="min-w-0">
              <div className="text-xs text-zinc-300 font-mono truncate">
                {entry.content}
              </div>
              {entry.from_agent && (
                <span className="text-[10px] text-zinc-600">
                  from: {entry.from_agent}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
