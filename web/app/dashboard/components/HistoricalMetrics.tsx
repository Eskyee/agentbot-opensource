'use client'

import { useState, useEffect } from 'react'

interface HistoricalData {
  timestamp: string
  cpu: number
  memory: number
  messages: number
  errors: number
}

export function HistoricalMetrics({ userId }: { userId: string }) {
  const [timeRange, setTimeRange] = useState('24h')
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    
    const fetchHistoricalMetrics = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/metrics/${userId}/historical?range=${timeRange}`)
        if (!response.ok) {
          throw new Error('Failed to fetch historical metrics')
        }
        
        const data = await response.json()
        setHistoricalData(data.metrics || [])
      } catch (err) {
        console.error('Error fetching historical metrics:', err)
        setError('Failed to load historical metrics')
        setHistoricalData([])
      } finally {
        setLoading(false)
      }
    }

    fetchHistoricalMetrics()
    
    // Set up polling for real-time updates
    const interval = setInterval(fetchHistoricalMetrics, 60000) // Update every minute
    
    return () => clearInterval(interval)
  }, [timeRange, userId])

  const getAverage = (metric: keyof HistoricalData) => {
    if (historicalData.length === 0) return 0
    const sum = historicalData.reduce((acc, curr) => acc + (curr[metric] as number), 0)
    return Math.round(sum / historicalData.length)
  }

  const getTrend = (metric: keyof HistoricalData) => {
    if (historicalData.length < 2) return 'neutral'
    const recent = historicalData.slice(-5)
    const recentAvg = recent.reduce((acc, curr) => acc + (curr[metric] as number), 0) / recent.length
    const earlierSlice = historicalData.slice(0, Math.max(5, historicalData.length / 4))
    const earlierAvg = earlierSlice.reduce((acc, curr) => acc + (curr[metric] as number), 0) / (earlierSlice.length || 1)
    
    if (recentAvg > earlierAvg * 1.1) return 'up'
    if (recentAvg < earlierAvg * 0.9) return 'down'
    return 'neutral'
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    if (timeRange === '24h') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
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
          <span>📈</span> Historical Metrics
        </h2>
        <div className="flex gap-2">
          {['24h', '7d', '30d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-sm rounded-lg ${
                timeRange === range
                  ? 'bg-white text-black'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="text-zinc-400">Loading historical data...</div>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span className="text-red-400">{error}</span>
          </div>
        </div>
      ) : historicalData.length === 0 ? (
        <div className="text-center py-8 text-zinc-500 text-sm">
          <div className="text-4xl mb-2">📊</div>
          No historical data available
        </div>
      ) : (
        <div className="space-y-6">
          {/* CPU Chart */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-400">CPU Usage</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-white">{getAverage('cpu')}%</span>
                {getTrend('cpu') === 'up' && (
                  <span className="text-xs text-red-400">↑ {Math.round((getAverage('cpu') / 100) * 100)}%</span>
                )}
                {getTrend('cpu') === 'down' && (
                  <span className="text-xs text-green-400">↓ {Math.round((100 / getAverage('cpu')) * 100)}%</span>
                )}
              </div>
            </div>
            <div className="h-20 flex items-end gap-1">
              {historicalData.slice(-24).map((entry, idx) => (
                <div
                  key={entry.timestamp}
                  className="flex-1 bg-green-500 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
                  style={{ height: `${entry.cpu}%` }}
                  title={`${formatTime(entry.timestamp)}: ${entry.cpu}%`}
                />
              ))}
            </div>
          </div>

          {/* Memory Chart */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-400">Memory Usage</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-white">{getAverage('memory')}%</span>
                {getTrend('memory') === 'up' && (
                  <span className="text-xs text-red-400">↑ {Math.round((getAverage('memory') / 100) * 100)}%</span>
                )}
                {getTrend('memory') === 'down' && (
                  <span className="text-xs text-green-400">↓ {Math.round((100 / getAverage('memory')) * 100)}%</span>
                )}
              </div>
            </div>
            <div className="h-20 flex items-end gap-1">
              {historicalData.slice(-24).map((entry, idx) => (
                <div
                  key={entry.timestamp}
                  className="flex-1 bg-blue-500 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
                  style={{ height: `${entry.memory}%` }}
                  title={`${formatTime(entry.timestamp)}: ${entry.memory}%`}
                />
              ))}
            </div>
          </div>

          {/* Analytics Summary */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-zinc-800">
            <div>
              <div className="text-xs text-zinc-500 mb-1">Avg CPU</div>
              <div className="text-lg font-bold font-mono">{getAverage('cpu')}%</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 mb-1">Avg Memory</div>
              <div className="text-lg font-bold font-mono">{getAverage('memory')}%</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 mb-1">Total Errors</div>
              <div className="text-lg font-bold font-mono text-red-400">
                {historicalData.reduce((acc, curr) => acc + curr.errors, 0)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
