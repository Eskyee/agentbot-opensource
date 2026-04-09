'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'
import { SectionHeader } from '@/app/components/shared/SectionHeader'
import { ExternalLink } from 'lucide-react'

interface AgentInfo {
  agentId: string
  openclawUrl: string | null
}

interface VerifiedResult {
  agentPublicKey: string
  agentKeyHash: string
  humanId?: string
}

declare global {
  interface Window {
    SelfClaw?: {
      verify: (opts: {
        container: string | HTMLElement
        agentName: string
        agentDescription?: string
        category?: string
        theme?: 'dark' | 'light'
        onVerified: (result: VerifiedResult) => void
        onError?: (err: Error) => void
      }) => void
    }
  }
}

function VerifyContent() {
  const searchParams = useSearchParams()
  const [agent, setAgent] = useState<AgentInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [verified, setVerified] = useState(false)
  const [verifiedResult, setVerifiedResult] = useState<VerifiedResult | null>(null)
  const [widgetReady, setWidgetReady] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetMounted = useRef(false)
  const urlAgentId = searchParams.get('id')

  // Load agent from session
  useEffect(() => {
    const fetchAgent = async () => {
      try {
        if (urlAgentId) {
          setAgent({ agentId: urlAgentId, openclawUrl: null })
          setLoading(false)
          return
        }
        const res = await fetch('/api/user/openclaw')
        if (res.ok) {
          const data = await res.json()
          if (data.openclawInstanceId) {
            setAgent({ agentId: data.openclawInstanceId, openclawUrl: data.openclawUrl || null })
          }
        }
      } catch (e) {
        console.error('Failed to fetch agent:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchAgent()
  }, [urlAgentId])

  // Load SelfClaw embed widget once agent is known
  useEffect(() => {
    if (!agent?.agentId) return
    if (document.getElementById('selfclaw-embed')) {
      setWidgetReady(true)
      return
    }
    const script = document.createElement('script')
    script.id = 'selfclaw-embed'
    script.src = 'https://selfclaw.ai/embed/verify.js'
    script.onload = () => setWidgetReady(true)
    script.onerror = () => console.error('Failed to load SelfClaw embed')
    document.head.appendChild(script)
  }, [agent?.agentId])

  // Mount the widget once script is ready + container exists
  useEffect(() => {
    if (!widgetReady || !containerRef.current || !agent?.agentId || widgetMounted.current) return
    if (!window.SelfClaw) return
    widgetMounted.current = true

    window.SelfClaw.verify({
      container: containerRef.current,
      agentName: `agentbot-${agent.agentId}`,
      agentDescription: 'Agentbot AI agent verified via SelfClaw',
      category: 'assistant',
      theme: 'dark',
      onVerified: async (result) => {
        setVerified(true)
        setVerifiedResult(result)
        // Record verification on our backend
        try {
          await fetch(`/api/agents/${agent.agentId}/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              verificationType: 'eas',
              attestationUid: result.agentKeyHash,
              walletAddress: result.agentPublicKey,
            }),
          })
        } catch (e) {
          console.error('Failed to record verification:', e)
        }
      },
      onError: (err) => {
        console.error('SelfClaw verification error:', err)
      },
    })
  }, [widgetReady, agent?.agentId])

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-zinc-800 w-1/3" />
        <div className="h-64 bg-zinc-900 border border-zinc-800" />
      </div>
    )
  }

  if (!agent?.agentId) {
    return (
      <div className="border border-zinc-800 bg-zinc-950 p-6">
        <p className="text-zinc-500 text-sm mb-4">
          No agent found. Deploy an agent first from Mission Control.
        </p>
        <a
          href="/dashboard"
          className="text-[10px] text-blue-400 hover:text-blue-300 uppercase tracking-widest font-bold"
        >
          ← Mission Control
        </a>
      </div>
    )
  }

  if (verified) {
    return (
      <div className="border border-green-500/30 bg-green-500/5 p-6 space-y-3">
        <div className="flex items-center gap-2 text-green-400">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="font-bold text-sm uppercase tracking-widest">Agent Verified</span>
        </div>
        <p className="text-zinc-400 text-sm">
          Your agent is now linked to a verified human identity via SelfClaw.
          A <strong className="text-white">Verified Human</strong> badge will appear in agent chats.
        </p>
        {verifiedResult?.agentKeyHash && (
          <p className="text-[10px] font-mono text-zinc-500 break-all">
            Key hash: {verifiedResult.agentKeyHash}
          </p>
        )}
        <a
          href="https://selfclaw.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[10px] text-blue-400 hover:text-blue-300 uppercase tracking-widest font-bold"
        >
          View on SelfClaw <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Agent ID */}
      <div className="border border-zinc-800 bg-zinc-950 px-4 py-3">
        <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Agent ID</p>
        <code className="text-[11px] text-zinc-400 font-mono break-all">{agent.agentId}</code>
      </div>

      {/* SelfClaw embed widget */}
      <div className="border border-zinc-700 bg-zinc-950 p-4 sm:p-6">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-4">
          Verify with{' '}
          <a href="https://selfclaw.ai" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
            SelfClaw
          </a>
          {' '}/ Self.xyz passport
        </p>

        {/* Widget mounts here */}
        <div ref={containerRef} />

        {!widgetReady && (
          <div className="flex items-center gap-2 text-zinc-500 text-xs">
            <span className="w-2 h-2 rounded-full bg-zinc-600 animate-pulse" />
            Loading verification widget…
          </div>
        )}

        <p className="text-[10px] text-zinc-600 mt-4 leading-relaxed">
          You&apos;ll need the <strong className="text-zinc-400">Self app</strong> on your phone.
          Your passport NFC chip is read locally — raw data never leaves your device.
        </p>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  const ShieldIcon = () => (
    <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="square" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )

  return (
    <DashboardShell>
      <DashboardHeader
        title="Verify Agent"
        icon={<ShieldIcon />}
        action={
          <a
            href="https://selfclaw.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-400 hover:text-blue-300 border border-zinc-700 hover:border-blue-500 px-3 py-1.5 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            selfclaw.ai
          </a>
        }
      />

      <DashboardContent className="max-w-2xl space-y-6">
        <SectionHeader
          label="Identity"
          title="Onchain Verification"
          description="Link your agent to an onchain identity to prove a real human is behind it."
        />

        {/* Why verify */}
        <div className="border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
          <h2 className="text-sm font-bold tracking-tight uppercase mb-4">Why verify?</h2>
          <div className="space-y-px bg-zinc-800">
            {[
              { label: 'Trust', desc: 'Users know a real person runs this agent' },
              { label: 'Reputation', desc: 'Build onchain reputation that travels with you' },
              { label: 'Stand out', desc: 'Verified agents get a special badge in chats' },
            ].map((item) => (
              <div key={item.label} className="bg-zinc-950 p-3 sm:p-4 flex items-start gap-3">
                <div className="w-1 h-1 bg-blue-400 mt-1.5 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-bold uppercase tracking-wider">{item.label}</span>
                  <span className="text-xs text-zinc-500 ml-2">— {item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Suspense fallback={
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-zinc-800 w-1/3" />
            <div className="h-64 bg-zinc-900 border border-zinc-800" />
          </div>
        }>
          <VerifyContent />
        </Suspense>

        <div className="pt-2">
          <a href="/dashboard" className="text-[10px] text-zinc-500 hover:text-white uppercase tracking-widest font-bold">
            ← Back to Dashboard
          </a>
        </div>
      </DashboardContent>
    </DashboardShell>
  )
}
