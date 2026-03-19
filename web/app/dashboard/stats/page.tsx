'use client'

import { useEffect, useState } from 'react'

interface SystemStats {
  cpu: number
  memory: number
  uptime: number
  messages: number
  errors: number
  health: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
}

export default function StatsPage() {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 5000) // Poll every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      const data = await response.json()
      setStats(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) return `${days}d ${hours}h ${mins}m`
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m`
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'bg-green-900/30 text-green-300 border-green-500'
      case 'degraded':
        return 'bg-yellow-900/30 text-yellow-300 border-yellow-500'
      case 'unhealthy':
        return 'bg-red-900/30 text-red-300 border-red-500'
      default:
        return 'bg-gray-900/30 text-gray-300 border-gray-500'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <h1 className="text-3xl font-bold mb-8">System Stats & Health</h1>
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">System Stats & Health</h1>
          <p className="text-gray-400">Real-time monitoring of your agentbot infrastructure</p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-8">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {stats ? (
          <>
            {/* Health Status */}
            <div className={`border rounded-lg p-6 mb-8 ${getHealthColor(stats.health)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold mb-2">System Health</h2>
                  <p className="text-sm opacity-90">Overall status of your infrastructure</p>
                </div>
                <div className="text-4xl font-bold capitalize">{stats.health}</div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {/* CPU */}
              <div className="border border-gray-700 rounded-lg p-6 bg-gray-900/50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm text-gray-400 font-medium">CPU Usage</h3>
                  <span className="text-xs text-gray-500">%</span>
                </div>
                <div className="mb-3">
                  <div className="text-3xl font-bold">{stats.cpu.toFixed(1)}</div>
                  <div className="w-full bg-gray-800 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(stats.cpu, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  {stats.cpu < 50 ? '✓ Good' : stats.cpu < 80 ? '⚠ Moderate' : '✕ High'}
                </p>
              </div>

              {/* Memory */}
              <div className="border border-gray-700 rounded-lg p-6 bg-gray-900/50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm text-gray-400 font-medium">Memory Usage</h3>
                  <span className="text-xs text-gray-500">%</span>
                </div>
                <div className="mb-3">
                  <div className="text-3xl font-bold">{stats.memory.toFixed(1)}</div>
                  <div className="w-full bg-gray-800 rounded-full h-2 mt-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(stats.memory, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  {stats.memory < 50 ? '✓ Good' : stats.memory < 80 ? '⚠ Moderate' : '✕ High'}
                </p>
              </div>

              {/* Uptime */}
              <div className="border border-gray-700 rounded-lg p-6 bg-gray-900/50">
                <h3 className="text-sm text-gray-400 font-medium mb-3">Uptime</h3>
                <div className="text-2xl font-bold">{formatUptime(stats.uptime)}</div>
                <p className="text-xs text-gray-500 mt-2">System running</p>
              </div>

              {/* Messages */}
              <div className="border border-gray-700 rounded-lg p-6 bg-gray-900/50">
                <h3 className="text-sm text-gray-400 font-medium mb-3">Messages</h3>
                <div className="text-3xl font-bold text-green-400">{stats.messages.toLocaleString()}</div>
                <p className="text-xs text-gray-500 mt-2">Processed total</p>
              </div>

              {/* Errors */}
              <div className="border border-gray-700 rounded-lg p-6 bg-gray-900/50">
                <h3 className="text-sm text-gray-400 font-medium mb-3">Errors</h3>
                <div className={`text-3xl font-bold ${stats.errors > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {stats.errors}
                </div>
                <p className="text-xs text-gray-500 mt-2">Recent errors</p>
              </div>

              {/* Last Updated */}
              <div className="border border-gray-700 rounded-lg p-6 bg-gray-900/50">
                <h3 className="text-sm text-gray-400 font-medium mb-3">Last Updated</h3>
                <div className="text-sm font-mono">{new Date(stats.timestamp).toLocaleTimeString()}</div>
                <p className="text-xs text-gray-500 mt-2">Refreshes every 5s</p>
              </div>
            </div>

            {/* Performance Summary */}
            <div className="border border-gray-700 rounded-lg p-6 bg-gray-900/50">
              <h2 className="text-lg font-semibold mb-4">Performance Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">CPU Status</span>
                  <span className={stats.cpu < 80 ? 'text-green-400' : 'text-red-400'}>
                    {stats.cpu < 50 ? '✓ Optimal' : stats.cpu < 80 ? '⚠ Normal' : '✕ High Load'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Memory Status</span>
                  <span className={stats.memory < 80 ? 'text-green-400' : 'text-red-400'}>
                    {stats.memory < 50 ? '✓ Optimal' : stats.memory < 80 ? '⚠ Normal' : '✕ High Usage'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Error Rate</span>
                  <span className={stats.errors === 0 ? 'text-green-400' : 'text-red-400'}>
                    {stats.errors === 0 ? '✓ No Errors' : `⚠ ${stats.errors} Error(s)`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">System Health</span>
                  <span className={`capitalize ${stats.health === 'healthy' ? 'text-green-400' : stats.health === 'degraded' ? 'text-yellow-400' : 'text-red-400'}`}>
                    {stats.health}
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400">No stats available</p>
          </div>
        )}
      </div>
    </div>
  )
}
