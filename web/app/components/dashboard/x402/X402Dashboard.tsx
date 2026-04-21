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
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">x402 Agentic Market</div>
            <h2 className="text-2xl font-bold uppercase tracking-tighter text-white mt-1">Sell Paid Agent APIs Without Accounts</h2>
            <p className="text-sm text-zinc-400 mt-3 leading-relaxed">
              Agentbot can expose paid API routes over x402 so users and other agents can pay per request in USDC.
              This follows the Coinbase x402 seller model: protect a route, advertise pricing, and return HTTP 402 until payment is attached.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://agentic.market"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center border border-zinc-700 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors"
            >
              Agentic Market
            </a>
            <a
              href="https://docs.cdp.coinbase.com/x402/welcome"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center border border-zinc-700 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors"
            >
              x402 Docs
            </a>
          </div>
        </div>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-4">AGENTBOT SELLER PATH</h3>
          <div className="space-y-4 text-sm text-zinc-400 leading-relaxed">
            <p>
              The clean Agentbot path is to expose premium API routes from your app or agent service and put x402 in front of them.
              Buyers do not create accounts or API keys. They send an HTTP request with payment attached.
            </p>
            <ol className="space-y-2 list-decimal pl-5 text-xs">
              <li>Pick the API route you want to monetize.</li>
              <li>Set a price in USDC and a payout wallet.</li>
              <li>Protect the route with x402 middleware.</li>
              <li>Return structured JSON and good metadata so the endpoint can be discovered by agents.</li>
              <li>List it in Agentic Market / Bazaar once the route is stable.</li>
            </ol>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-zinc-800 bg-black/40 p-4">
              <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Facilitator</div>
              <div className="text-xs font-mono text-white">CDP recommended</div>
              <p className="text-[11px] text-zinc-500 mt-2 break-all">
                https://api.cdp.coinbase.com/platform/v2/x402
              </p>
            </div>
            <div className="border border-zinc-800 bg-black/40 p-4">
              <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Testnet quick start</div>
              <div className="text-xs font-mono text-white">Signup-free facilitator</div>
              <p className="text-[11px] text-zinc-500 mt-2 break-all">
                https://x402.org/facilitator
              </p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-4">Networks</h3>
          <div className="space-y-3 text-xs text-zinc-400">
            <div className="flex items-center justify-between">
              <span>Base Mainnet</span>
              <span className="font-mono text-white">eip155:8453</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Base Sepolia</span>
              <span className="font-mono text-white">eip155:84532</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Polygon</span>
              <span className="font-mono text-white">eip155:137</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Arbitrum</span>
              <span className="font-mono text-white">eip155:42161</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Solana Mainnet</span>
              <span className="font-mono text-white">solana:5eyk…Kvdp</span>
            </div>
          </div>

          <div className="mt-6 border border-zinc-800 bg-black/40 p-4">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Price format</div>
            <p className="text-xs text-zinc-400">
              Use dollar-prefixed strings like <span className="font-mono text-white">$0.001</span>.
              Omitting the dollar sign can fail validation.
            </p>
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

      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-white">LIVE AGENTIC MARKET</h3>
            <p className="text-xs text-zinc-500 mt-2">
              Embedded buyers vs sellers chart from Agentic Market for operators who want the live market view inside Agentbot.
            </p>
          </div>
          <a
            href="https://agentic.market/?chart=buyers-sellers"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center border border-zinc-700 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors"
          >
            Open Full Dashboard
          </a>
        </div>

        <a
          href="https://agentic.market/?chart=buyers-sellers"
          target="_blank"
          rel="noopener noreferrer"
          className="block border border-zinc-800 bg-gradient-to-br from-emerald-950/40 via-black to-zinc-950 hover:border-emerald-500/60 transition-colors p-8 sm:p-12"
        >
          <div className="flex flex-col items-center text-center gap-4">
            <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Live on agentic.market</div>
            <div className="text-3xl sm:text-5xl font-bold uppercase tracking-tighter text-white">Buyers vs Sellers</div>
            <p className="text-sm text-zinc-400 max-w-xl">
              Real-time x402 marketplace activity — endpoint listings, per-request USDC pricing, and live settlement volume across agent buyers and sellers.
            </p>
            <div className="grid grid-cols-3 gap-6 mt-4">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500">Buyers</div>
                <div className="text-xl font-mono text-emerald-400 mt-1">Live</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500">Sellers</div>
                <div className="text-xl font-mono text-emerald-400 mt-1">Live</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500">Settlement</div>
                <div className="text-xl font-mono text-emerald-400 mt-1">USDC</div>
              </div>
            </div>
            <span className="inline-flex items-center justify-center mt-4 bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-3 text-[10px] font-bold uppercase tracking-widest">
              Open agentic.market →
            </span>
          </div>
        </a>

        <p className="mt-3 text-[10px] uppercase tracking-widest text-zinc-600">
          Agentic Market blocks iframe embedding (X-Frame-Options: DENY). Click above to open the live dashboard in a new tab.
        </p>
      </div>

      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
        <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-4">AGENTBOT EXAMPLE</h3>
        <pre className="overflow-x-auto text-[11px] leading-relaxed text-zinc-300 bg-black/50 border border-zinc-800 p-4">
{`import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";

const payTo = "0xYourAddress";
const facilitatorClient = new HTTPFacilitatorClient({
  url: "https://x402.org/facilitator"
});

const server = new x402ResourceServer(facilitatorClient)
  .register("eip155:84532", new ExactEvmScheme());

app.use(
  paymentMiddleware(
    {
      "GET /api/protected": {
        accepts: [
          {
            scheme: "exact",
            price: "$0.01",
            network: "eip155:84532",
            payTo,
          },
        ],
        description: "Access to protected Agentbot content",
        mimeType: "application/json",
      },
    },
    server,
  ),
);`}
        </pre>
        <p className="text-xs text-zinc-500 mt-4">
          In Agentbot terms: protect a route, publish a clear description, add Bazaar metadata when ready, and use the agentic wallet/x402 skills for buyers and autonomous clients.
        </p>
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
              ${pricing?.pricing?.rate ?? 0.01}
            </div>
            <p className="text-xs font-mono text-zinc-500 uppercase mt-1">
              {pricing?.tier || 'basic'} tier
              {pricing?.pricing?.discount ? ` (${pricing.pricing.discount}% off)` : ''}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
