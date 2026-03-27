'use client'

import { useState, useEffect } from 'react'

interface X402Status {
  gateway: string
  status: string
  service: string
  agents: number
  colonies: number
  timestamp: string
}

interface Endpoint {
  description: string
  price: string
  slug: string
}

interface FitnessData {
  score: number
  tier: string
  details: any
}

interface PricingData {
  agentId: string
  tier: string
  pricing: { rate: number; discount: number }
  fitness: { score: number; tier: string }
}

export default function X402Dashboard() {
  const [status, setStatus] = useState<X402Status | null>(null)
  const [endpoints, setEndpoints] = useState<Endpoint[]>([])
  const [fitness, setFitness] = useState<FitnessData | null>(null)
  const [pricing, setPricing] = useState<PricingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [authenticated, setAuthenticated] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        
        // Fetch status (always available)
        const statusRes = await fetch('/api/x402')
        const statusData = await statusRes.json()
        setStatus(statusData)
        
        // Fetch endpoints (public)
        const endpointsRes = await fetch('/api/x402', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'endpoints' })
        })
        const endpointsData = await endpointsRes.json()
        setEndpoints(endpointsData.endpoints || [])
        
        // Fetch fitness (requires auth)
        const fitnessRes = await fetch('/api/x402', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'fitness', agentId: 'atlas' })
        })
        
        if (fitnessRes.status === 401) {
          setAuthenticated(false)
          setFitness({ score: 50, tier: 'new', details: null })
        } else {
          const fitnessData = await fitnessRes.json()
          setFitness(fitnessData)
        }
        
        // Fetch pricing (requires auth)
        const pricingRes = await fetch('/api/x402', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'pricing', agentId: 'atlas' })
        })
        
        if (pricingRes.status === 401) {
          setAuthenticated(false)
          setPricing({ agentId: 'atlas', tier: 'basic', pricing: { rate: 0.01, discount: 0 }, fitness: { score: 50, tier: 'new' } })
        } else {
          const pricingData = await pricingRes.json()
          setPricing(pricingData)
        }
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-zinc-800 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-zinc-800 rounded"></div>
            <div className="h-3 bg-zinc-800 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-zinc-900 rounded-lg border border-red-800 p-6">
        <p className="text-red-400">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Status */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
        <h2 className="text-lg font-bold uppercase tracking-tighter text-white mb-4">x402 GATEWAY</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs font-mono text-zinc-500 uppercase">Status</p>
            <p className={`text-sm font-mono ${status?.status === 'healthy' ? 'text-green-400' : 'text-red-400'}`}>
              {status?.status || 'unknown'}
            </p>
          </div>
          <div>
            <p className="text-xs font-mono text-zinc-500 uppercase">Agents</p>
            <p className="text-sm font-mono text-white">{status?.agents || 0}</p>
          </div>
          <div>
            <p className="text-xs font-mono text-zinc-500 uppercase">Colonies</p>
            <p className="text-sm font-mono text-white">{status?.colonies || 0}</p>
          </div>
          <div>
            <p className="text-xs font-mono text-zinc-500 uppercase">Gateway</p>
            <p className="text-xs font-mono text-zinc-400 truncate">{status?.gateway}</p>
          </div>
        </div>
      </div>

      {/* Endpoints */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
        <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-4">x402 ENDPOINTS</h3>
        <div className="space-y-3">
          {endpoints.map((ep, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded">
              <div>
                <p className="text-sm font-mono text-white">{ep.slug}</p>
                <p className="text-xs text-zinc-500">{ep.description}</p>
              </div>
              <span className="text-sm font-mono text-green-400">{ep.price}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Fitness & Pricing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-4">AGENT FITNESS</h3>
          <div>
            <div className={`text-4xl font-bold ${
              (fitness?.score || 0) > 80 ? 'text-green-400' :
              (fitness?.score || 0) > 60 ? 'text-yellow-400' :
              'text-zinc-400'
            }`}>
              {fitness?.score || 50}%
            </div>
            <p className="text-xs font-mono text-zinc-500 uppercase mt-1">{fitness?.tier || 'new'}</p>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
          <h3 className="text-sm font-mono font-bold text-white mb-4">DYNAMIC PRICING</h3>
          <div className="text-center">
            <div className="text-2xl font-mono font-bold text-white">
              ${pricing?.pricing.rate || 0.01}
            </div>
            <p className="text-xs font-mono text-zinc-500 uppercase mt-1">
              {pricing?.tier || 'basic'} tier
              {pricing?.pricing.discount ? ` (${pricing.pricing.discount}% off)` : ''}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
