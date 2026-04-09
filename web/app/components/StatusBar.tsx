'use client'

import { useEffect, useState } from 'react'

interface StatusData {
  users: number | null
  online: boolean
}

export function StatusBar() {
  const [status, setStatus] = useState<StatusData>({ users: null, online: true })
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/health', { cache: 'no-store' })
        const data = await res.json()
        setStatus({
          users: typeof data.totalUsers === 'number' ? data.totalUsers : null,
          online: data.status === 'healthy' || data.status === 'ok',
        })
        setLastUpdate(new Date())
      } catch {
        setStatus(prev => ({ ...prev, online: false }))
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/90 backdrop-blur-md border-t border-zinc-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-10 text-[10px]">
          <div className="flex items-center gap-4 text-zinc-500 overflow-x-auto">
            <span className="flex items-center gap-2 whitespace-nowrap">
              <span className={`w-1.5 h-1.5 rounded-full ${status.online ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className={`font-mono font-bold ${status.online ? 'text-green-500' : 'text-red-500'}`}>
                {status.online ? 'ONLINE' : 'OFFLINE'}
              </span>
            </span>
            <span className="hidden sm:inline text-zinc-800">·</span>
            {status.users !== null && (
              <>
                <span className="hidden sm:inline text-zinc-800">·</span>
                <span className="hidden sm:inline whitespace-nowrap font-mono">{status.users} users</span>
              </>
            )}
            <span className="hidden md:inline text-zinc-800">·</span>
            <span className="hidden md:inline whitespace-nowrap font-mono text-zinc-600">
              {lastUpdate ? `updated ${lastUpdate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : ''}
            </span>
          </div>
          <span className="text-zinc-600 whitespace-nowrap font-mono">
            © 2026 Agentbot
          </span>
        </div>
      </div>
    </div>
  )
}
