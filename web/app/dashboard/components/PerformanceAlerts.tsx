'use client'

import { useState, useEffect } from 'react'

interface Alert {
  id: string
  type: 'warning' | 'error' | 'info'
  title: string
  message: string
  timestamp: string
  acknowledged: boolean
}

interface PerformanceMetrics {
  cpu: number
  memory: number
  errorRate: number
  responseTime: number
}

interface AlertThresholds {
  cpu: number
  memory: number
  errorRate: number
  responseTime: number
}

export function PerformanceAlerts({ userId }: { userId: string }) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [currentMetrics, setCurrentMetrics] = useState<PerformanceMetrics | null>(null)
  const [thresholds, setThresholds] = useState<AlertThresholds>({
    cpu: 80,
    memory: 85,
    errorRate: 5,
    responseTime: 5000
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    const fetchPerformanceData = async () => {
      try {
        setLoading(false)
        setError(null)

        const response = await fetch(`/api/metrics/${userId}/performance`)
        if (!response.ok) {
          throw new Error('Failed to fetch performance data')
        }

        const data = await response.json()
        setCurrentMetrics(data)
        
        // Generate real-time alerts based on thresholds
        const newAlerts: Alert[] = []
        
        if (data.cpu >= thresholds.cpu * 1.2) {
          newAlerts.push({
            id: Date.now().toString(),
            type: 'error',
            title: 'CPU Critical Threshold Exceeded',
            message: `CPU usage at ${data.cpu.toFixed(1)}% significantly exceeds ${thresholds.cpu}% threshold`,
            timestamp: new Date().toISOString(),
            acknowledged: false,
          })
        } else if (data.cpu >= thresholds.cpu) {
          newAlerts.push({
            id: Date.now().toString(),
            type: 'warning',
            title: 'CPU Threshold Exceeded',
            message: `CPU usage at ${data.cpu.toFixed(1)}% exceeds ${thresholds.cpu}% threshold`,
            timestamp: new Date().toISOString(),
            acknowledged: false,
          })
        }

        if (data.memory >= thresholds.memory * 1.2) {
          newAlerts.push({
            id: (Date.now() + 1).toString(),
            type: 'error',
            title: 'Memory Critical Threshold Exceeded',
            message: `Memory usage at ${data.memory.toFixed(1)}% significantly exceeds ${thresholds.memory}% threshold`,
            timestamp: new Date().toISOString(),
            acknowledged: false,
          })
        } else if (data.memory >= thresholds.memory) {
          newAlerts.push({
            id: (Date.now() + 2).toString(),
            type: 'warning', 
            title: 'Memory Threshold Exceeded',
            message: `Memory usage at ${data.memory.toFixed(1)}% exceeds ${thresholds.memory}% threshold`,
            timestamp: new Date().toISOString(),
            acknowledged: false,
          })
        }

        if (data.errorRate >= thresholds.errorRate) {
          newAlerts.push({
            id: (Date.now() + 3).toString(),
            type: 'warning',
            title: 'Elevated Error Rate Detected',
            message: `Error rate at ${data.errorRate.toFixed(1)}% exceeds ${thresholds.errorRate}% threshold`,
            timestamp: new Date().toISOString(),
            acknowledged: false,
          })
        }

        if (data.responseTime >= thresholds.responseTime) {
          newAlerts.push({
            id: (Date.now() + 4).toString(),
            type: 'warning',
            title: 'Slow Response Times Detected',
            message: `Response time at ${data.responseTime.toFixed(0)}ms exceeds ${thresholds.responseTime}ms threshold`,
            timestamp: new Date().toISOString(),
            acknowledged: false,
          })
        }

        // Keep only unacknowledged alerts from most recent
        setAlerts(prev => [...newAlerts, ...prev].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ).slice(0, 10))

      } catch (err) {
        console.error('Error fetching performance data:', err)
        setError('Failed to load performance data')
        setCurrentMetrics({
          cpu: 0,
          memory: 0,
          errorRate: 0,
          responseTime: 0,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPerformanceData()
    
    // Set up polling for real-time monitoring
    const interval = setInterval(fetchPerformanceData, 30000) // Update every 30 seconds
    
    return () => clearInterval(interval)
  }, [thresholds, userId])

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ))
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return date.toLocaleDateString()
  }

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'warning': return '⚠️'
      case 'error': return '🚨'
      case 'info': return 'ℹ️'
    }
  }

  const getAlertColor = (type: Alert['type']) => {
    switch (type) {
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/30'
      case 'error': return 'bg-red-500/10 border-red-500/30'
      case 'info': return 'bg-blue-500/10 border-blue-500/30'
    }
  }

  const getThresholdStatus = (current: number, threshold: number) => {
    if (current >= threshold * 1.2) return 'critical'
    if (current >= threshold) return 'warning'
    return 'healthy'
  }

  if (!userId) {
    return (
      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
        <div className="text-center text-zinc-500">
          No agent selected
        </div>
      </div>
    )
  }

  return (
    <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span>🔔</span> Performance Alerts
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-400">
            {alerts.filter(a => !a.acknowledged).length} active alerts
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="text-zinc-400">Loading performance data...</div>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span className="text-red-400">{error}</span>
          </div>
        </div>
      ) : (
        <>
          {/* Current Metrics Status */}
          {currentMetrics && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className={`rounded-lg p-3 border ${
                getThresholdStatus(currentMetrics.cpu, thresholds.cpu) === 'critical'
                  ? 'bg-red-500/10 border-red-500/30'
                  : getThresholdStatus(currentMetrics.cpu, thresholds.cpu) === 'warning'
                  ? 'bg-yellow-500/10 border-yellow-500/30'
                  : 'bg-green-500/10 border-green-500/30'
              }`}>
                <div className="text-xs text-zinc-500 mb-1">CPU</div>
                <div className="text-2xl font-bold font-mono">{currentMetrics.cpu.toFixed(1)}%</div>
                <div className="text-xs text-zinc-500 mt-1">Threshold: {thresholds.cpu}%</div>
              </div>

              <div className={`rounded-lg p-3 border ${
                getThresholdStatus(currentMetrics.memory, thresholds.memory) === 'critical'
                  ? 'bg-red-500/10 border-red-500/30'
                  : getThresholdStatus(currentMetrics.memory, thresholds.memory) === 'warning'
                  ? 'bg-yellow-500/10 border-yellow-500/30'
                  : 'bg-green-500/10 border-green-500/30'
              }`}>
                <div className="text-xs text-zinc-500 mb-1">Memory</div>
                <div className="text-2xl font-bold font-mono">{currentMetrics.memory.toFixed(1)}%</div>
                <div className="text-xs text-zinc-500 mt-1">Threshold: {thresholds.memory}%</div>
              </div>

              <div className={`rounded-lg p-3 border ${
                getThresholdStatus(currentMetrics.errorRate, thresholds.errorRate) === 'critical'
                  ? 'bg-red-500/10 border-red-500/30'
                  : getThresholdStatus(currentMetrics.errorRate, thresholds.errorRate) === 'warning'
                  ? 'bg-yellow-500/10 border-yellow-500/30'
                  : 'bg-green-500/10 border-green-500/30'
              }`}>
                <div className="text-xs text-zinc-500 mb-1">Error Rate</div>
                <div className="text-2xl font-bold font-mono">{currentMetrics.errorRate.toFixed(1)}%</div>
                <div className="text-xs text-zinc-500 mt-1">Threshold: {thresholds.errorRate}%</div>
              </div>

              <div className={`rounded-lg p-3 border ${
                getThresholdStatus(currentMetrics.responseTime, thresholds.responseTime) === 'critical'
                  ? 'bg-red-500/10 border-red-500/30'
                  : getThresholdStatus(currentMetrics.responseTime, thresholds.responseTime) === 'warning'
                  ? 'bg-yellow-500/10 border-yellow-500/30'
                  : 'bg-green-500/10 border-green-500/30'
              }`}>
                <div className="text-xs text-zinc-500 mb-1">Response Time</div>
                <div className="text-2xl font-bold font-mono">{currentMetrics.responseTime.toFixed(0)}ms</div>
                <div className="text-xs text-zinc-500 mt-1">Threshold: {thresholds.responseTime}ms</div>
              </div>
            </div>
          )}

          {/* Alerts List */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-400 mb-3">Recent Alerts</h3>
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-sm">
                <div className="text-4xl mb-2">✅</div>
                No active alerts
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`rounded-lg p-4 border ${getAlertColor(alert.type)} transition-all ${
                      alert.acknowledged ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl">{getAlertIcon(alert.type)}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm">{alert.title}</h4>
                          <span className="text-xs text-zinc-500">{formatTime(alert.timestamp)}</span>
                        </div>
                        <p className="text-sm text-zinc-400 mt-1">{alert.message}</p>
                      </div>
                    </div>
                    {!alert.acknowledged && (
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="mt-3 text-sm text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1 rounded transition-colors"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Threshold Configuration */}
          <div className="mt-6 pt-6 border-t border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-400 mb-3">Alert Thresholds</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">CPU Warning Level</span>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="50"
                    max="100"
                    step="5"
                    value={thresholds.cpu}
                    onChange={(e) => setThresholds(prev => ({ ...prev, cpu: Number(e.target.value) }))}
                    className="w-32 accent-blue-500"
                  />
                  <span className="text-sm font-mono">{thresholds.cpu}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Memory Warning Level</span>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="50"
                    max="100"
                    step="5"
                    value={thresholds.memory}
                    onChange={(e) => setThresholds(prev => ({ ...prev, memory: Number(e.target.value) }))}
                    className="w-32 accent-blue-500"
                  />
                  <span className="text-sm font-mono">{thresholds.memory}%</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
