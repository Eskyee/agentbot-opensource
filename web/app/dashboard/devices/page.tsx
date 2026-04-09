'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Smartphone, Unplug, Bell, AlertCircle, QrCode, Wifi, WifiOff } from 'lucide-react'
import { DashboardShell, DashboardHeader, DashboardContent } from '@/app/components/shared/DashboardShell'

interface Device {
  id: string
  name: string
  platform: string
  paired: boolean
  lastSeen: string
  pushEnabled: boolean
}

interface DeviceData {
  devices?: Device[]
  error?: string
  status?: string
}

export default function DevicesPage() {
  const [data, setData] = useState<DeviceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [pairing, setPairing] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)

  const fetchDevices = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/openclaw/devices')
      const d = await res.json()
      setData(d)
    } catch {
      setData({ error: 'Failed to connect to agent', status: 'unreachable' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDevices() }, [fetchDevices])

  const pair = async () => {
    setPairing(true)
    try {
      await fetch('/api/openclaw/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pair' }),
      })
      setTimeout(fetchDevices, 2000)
    } catch { /* silent */ } finally {
      setPairing(false)
    }
  }

  const unpair = async (deviceId: string) => {
    setActionId(deviceId)
    try {
      await fetch('/api/openclaw/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unpair', deviceId }),
      })
      setTimeout(fetchDevices, 1000)
    } catch { /* silent */ } finally {
      setActionId(null)
    }
  }

  const testPush = async (deviceId: string) => {
    setActionId(deviceId)
    try {
      await fetch('/api/openclaw/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test-push', deviceId }),
      })
    } catch { /* silent */ } finally {
      setTimeout(() => setActionId(null), 1000)
    }
  }

  const noAgent = data?.status === 'no_agent'
  const unreachable = data?.status === 'unreachable'
  const devices = data?.devices || []
  const paired = devices.filter(d => d.paired)
  const online = paired.filter(d => {
    const seen = new Date(d.lastSeen).getTime()
    return Date.now() - seen < 5 * 60 * 1000
  })

  return (
    <DashboardShell>
      <DashboardHeader title="Devices" subtitle="OpenClaw 2026.4.9 — Android Pairing & Push Notifications" />
      <DashboardContent>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-6 h-6 animate-spin text-zinc-500" />
          </div>
        ) : noAgent ? (
          <div className="text-center py-20 text-zinc-500">
            <Smartphone className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No agent deployed. Deploy an agent to pair devices.</p>
          </div>
        ) : unreachable ? (
          <div className="text-center py-20 text-zinc-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Agent is unreachable. It may be starting up.</p>
            <button onClick={fetchDevices} className="mt-4 text-xs border border-zinc-700 px-3 py-1 rounded hover:border-zinc-500">Retry</button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="text-xs text-zinc-500 uppercase mb-1">Paired Devices</div>
                <div className="text-2xl font-bold">{paired.length}</div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="text-xs text-zinc-500 uppercase mb-1">Online Now</div>
                <div className="text-2xl font-bold text-green-400">{online.length}</div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="text-xs text-zinc-500 uppercase mb-1">Push Enabled</div>
                <div className="text-2xl font-bold">{paired.filter(d => d.pushEnabled).length}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={pair} disabled={pairing}
                className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-500/20 transition-colors disabled:opacity-50 flex items-center gap-2">
                {pairing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                Pair New Device
              </button>
              <button onClick={fetchDevices}
                className="bg-zinc-800 border border-zinc-700 px-4 py-2 rounded-lg text-sm hover:border-zinc-600 transition-colors flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>

            {/* Device List */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h3 className="font-bold text-sm uppercase tracking-tight mb-4 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-green-400" /> Paired Devices
              </h3>
              {paired.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-sm">
                  <Smartphone className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No devices paired. Tap &quot;Pair New Device&quot; to scan a QR code from your phone.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paired.map(device => {
                    const isOnline = Date.now() - new Date(device.lastSeen).getTime() < 5 * 60 * 1000
                    const busy = actionId === device.id
                    return (
                      <div key={device.id} className="flex items-center justify-between border border-zinc-800 rounded-lg p-4">
                        <div className="flex items-center gap-3 min-w-0">
                          {isOnline ? (
                            <Wifi className="w-5 h-5 text-green-400 flex-shrink-0" />
                          ) : (
                            <WifiOff className="w-5 h-5 text-zinc-600 flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="text-sm font-bold truncate">{device.name}</div>
                            <div className="text-xs text-zinc-500">
                              {device.platform} &middot; Last seen {new Date(device.lastSeen).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {device.pushEnabled && (
                            <button onClick={() => testPush(device.id)} disabled={busy}
                              className="text-xs border border-zinc-700 px-2 py-1 rounded hover:border-zinc-500 disabled:opacity-50 flex items-center gap-1">
                              {busy ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Bell className="w-3 h-3" />}
                              Test Push
                            </button>
                          )}
                          <button onClick={() => unpair(device.id)} disabled={busy}
                            className="text-xs border border-red-500/30 text-red-400 px-2 py-1 rounded hover:border-red-500/50 disabled:opacity-50 flex items-center gap-1">
                            {busy ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Unplug className="w-3 h-3" />}
                            Unpair
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="text-xs text-zinc-600 text-center">
              Device pairing uses QR-first flow with WebSocket heartbeat. Push notifications bridge to Android even when the app is closed.
            </div>
          </div>
        )}
      </DashboardContent>
    </DashboardShell>
  )
}
