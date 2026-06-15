'use client'

import { useState, useEffect } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
  CartesianGrid,
} from 'recharts'

interface Candle {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

const TIMEFRAMES = [
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '1h', value: '1h' },
  { label: '4h', value: '4h' },
  { label: '1d', value: '1d' },
]

function formatTime(timestamp: number, timeframe: string): string {
  const d = new Date(timestamp * 1000)
  if (timeframe === '1d') {
    return `${d.getMonth() + 1}/${d.getDate()}`
  }
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatPrice(price: number): string {
  if (price < 0.000001) {
    return price.toExponential(2)
  }
  if (price < 0.01) {
    return `$${price.toFixed(8)}`
  }
  return `$${price.toFixed(4)}`
}

function formatVolume(vol: number): string {
  if (vol >= 1000) return `$${(vol / 1000).toFixed(1)}K`
  return `$${vol.toFixed(0)}`
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-xs font-mono shadow-xl">
      <div className="text-zinc-500 mb-2">{new Date(d.time * 1000).toLocaleString()}</div>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">O</span>
          <span className="text-white">{formatPrice(d.open)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">H</span>
          <span className="text-green-400">{formatPrice(d.high)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">L</span>
          <span className="text-red-400">{formatPrice(d.low)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">C</span>
          <span className="text-white">{formatPrice(d.close)}</span>
        </div>
        <div className="flex justify-between gap-4 border-t border-zinc-800 pt-1 mt-1">
          <span className="text-zinc-500">Vol</span>
          <span className="text-zinc-400">{formatVolume(d.volume)}</span>
        </div>
      </div>
    </div>
  )
}

export default function BasefmChart() {
  const [timeframe, setTimeframe] = useState('1h')
  const [candles, setCandles] = useState<Candle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/basefm/ohlcv?timeframe=${timeframe}&limit=100`)
      .then((r) => r.json())
      .then((data) => {
        setCandles(data.candles || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [timeframe])

  const chartData = candles
    .slice()
    .reverse()
    .map((c) => ({
      ...c,
      label: formatTime(c.time, timeframe),
      isUp: c.close >= c.open,
    }))

  const priceMin = Math.min(...candles.map((c) => c.low))
  const priceMax = Math.max(...candles.map((c) => c.high))
  const pricePadding = (priceMax - priceMin) * 0.1

  return (
    <div className="rounded-xl border border-zinc-800 bg-black overflow-hidden">
      {/* Timeframe selector */}
      <div className="flex items-center gap-1 px-4 pt-3 pb-1">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf.value}
            onClick={() => setTimeframe(tf.value)}
            className={`px-3 py-1 text-[10px] uppercase tracking-widest rounded transition-colors ${
              timeframe === tf.value
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-600 hover:text-zinc-400'
            }`}
          >
            {tf.label}
          </button>
        ))}
        <div className="ml-auto text-[10px] text-zinc-600 uppercase tracking-widest">
          GeckoTerminal
        </div>
      </div>

      {loading ? (
        <div className="h-[400px] flex items-center justify-center">
          <div className="text-zinc-600 text-xs animate-pulse">Loading chart...</div>
        </div>
      ) : candles.length === 0 ? (
        <div className="h-[400px] flex items-center justify-center">
          <div className="text-zinc-600 text-xs">No data available</div>
        </div>
      ) : (
        <div className="px-2">
          {/* Price chart */}
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: '#52525b' }}
                axisLine={{ stroke: '#27272a' }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[priceMin - pricePadding, priceMax + pricePadding]}
                tick={{ fontSize: 9, fill: '#52525b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => formatPrice(v)}
                width={90}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="close"
                stroke="#22c55e"
                fill="url(#gradient)"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
            </ComposedChart>
          </ResponsiveContainer>

          {/* Volume chart */}
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={chartData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: '#52525b' }}
                axisLine={{ stroke: '#27272a' }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 9, fill: '#52525b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => formatVolume(v)}
                width={50}
              />
              <Tooltip
                content={({ active, payload }: any) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0]?.payload
                  return (
                    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-xs font-mono">
                      <span className="text-zinc-500">Vol </span>
                      <span className="text-white">{formatVolume(d?.volume || 0)}</span>
                    </div>
                  )
                }}
              />
              <Bar
                dataKey="volume"
                fill="#27272a"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
