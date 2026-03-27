'use client'

import { useState, useEffect, useCallback } from 'react'
import { Smartphone, Check, X, Shield, ShieldOff, Clock, Globe, RefreshCw } from 'lucide-react'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'

interface Device {
  id: string
  name: string
  ip: string
  firstSeen: string
  lastSeen: string
  status: string
}

const formatTime = (iso: string) => {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function DevicesPage() {
  const [pending, setPending] = useState<Device[]>([])
  const [approved, setApproved] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetch('/api/devices')
      const data = await res.json()
      setPending(data.pending || [])
      setApproved(data.approved || [])
      setError('')
    } catch {
      setError('Failed to fetch devices')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDevices()
    const interval = setInterval(fetchDevices, 30_000)
    return () => clearInterval(interval)
  }, [fetchDevices])

  const handleAction = async (deviceId: string, action: 'approve' | 'deny' | 'revoke') => {
    setActionLoading(deviceId + action)
    try {
      const res = await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, action }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Action failed')
        return
      }

      setPending(data.pending || [])
      setApproved(data.approved || [])
      setError('')
    } catch {
      setError('Network error')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <DashboardShell>
      <DashboardHeader
        title="Device Pairing"
        icon={<Smartphone className="h-5 w-5 text-blue-400" />}
        count={pending.length + approved.length}
        action={
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-600 font-mono">
              Auto-refresh 30s
            </span>
            <button
              onClick={fetchDevices}
              disabled={loading}
              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        }
      />

      <DashboardContent className="max-w-5xl space-y-8">
        {error && (
          <div className="border border-red-900/50 bg-red-950/30 px-4 py-3 text-xs font-mono text-red-400">
            {error}
          </div>
        )}

        {/* Pending requests */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-yellow-400" />
            <h2 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
              Pending Requests
            </h2>
            {pending.length > 0 && (
              <span className="text-[10px] text-yellow-400 bg-yellow-900/20 border border-yellow-800 rounded-full px-2 py-0.5 font-mono">
                {pending.length}
              </span>
            )}
          </div>

          {pending.length === 0 ? (
            <div className="border border-zinc-800 bg-zinc-950 p-8 text-center">
              <Shield className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-600 font-mono">No pending requests</p>
              <p className="text-[10px] text-zinc-700 font-mono mt-1">
                New device connections will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-px bg-zinc-800">
              {pending.map(device => (
                <div
                  key={device.id}
                  className="bg-zinc-950 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-mono font-bold text-white mb-1 truncate">
                      {device.name}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-mono text-zinc-600">
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {device.ip}
                      </span>
                      <span>First seen: {formatTime(device.firstSeen)}</span>
                      <span>Last seen: {timeAgo(device.lastSeen)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleAction(device.id, 'approve')}
                      disabled={!!actionLoading}
                      className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 transition-colors"
                    >
                      {actionLoading === device.id + 'approve' ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(device.id, 'deny')}
                      disabled={!!actionLoading}
                      className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                    >
                      {actionLoading === device.id + 'deny' ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                      Deny
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Approved devices */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-4 w-4 text-emerald-400" />
            <h2 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
              Approved Devices
            </h2>
            {approved.length > 0 && (
              <span className="text-[10px] text-emerald-400 bg-emerald-900/20 border border-emerald-800 rounded-full px-2 py-0.5 font-mono">
                {approved.length}
              </span>
            )}
          </div>

          {approved.length === 0 ? (
            <div className="border border-zinc-800 bg-zinc-950 p-8 text-center">
              <ShieldOff className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-600 font-mono">No approved devices</p>
              <p className="text-[10px] text-zinc-700 font-mono mt-1">
                Approve pending requests to add devices
              </p>
            </div>
          ) : (
            <div className="space-y-px bg-zinc-800">
              {approved.map(device => (
                <div
                  key={device.id}
                  className="bg-zinc-950 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                      <span className="text-sm font-mono font-bold text-white truncate">
                        {device.name}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-mono text-zinc-600">
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {device.ip}
                      </span>
                      <span>First seen: {formatTime(device.firstSeen)}</span>
                      <span>Last seen: {timeAgo(device.lastSeen)}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => handleAction(device.id, 'revoke')}
                      disabled={!!actionLoading}
                      className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                    >
                      {actionLoading === device.id + 'revoke' ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        <ShieldOff className="h-3 w-3" />
                      )}
                      Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardContent>
    </DashboardShell>
  )
}
