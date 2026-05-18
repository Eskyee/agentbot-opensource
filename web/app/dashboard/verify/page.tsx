'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createWorldBridgeStore } from '@worldcoin/idkit-core'
import { solidityEncode } from '@worldcoin/idkit-core/hashing'
import { Spinner } from 'geist/components'
import * as QRCode from 'qrcode'
import type { JSX } from 'react'
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

// Shape actually returned by https://selfclaw.ai/embed/verify.js on success.
// (Earlier code assumed agentPublicKey / agentKeyHash, which the embed never
// produces — it returns publicKey / humanId / sessionId.) Kept optional so a
// partial success payload can never throw on .slice etc.
interface SelfClawVerifiedResult {
  publicKey?: string
  humanId?: string
  sessionId?: string
  agentName?: string
  privateKey?: string
  keyGenerated?: boolean
}

// Legacy-compatible shape used for display, mapped from either SelfClaw's
// embed response or our own /api/agents/[id]/verify GET response.
interface VerifiedResult {
  agentPublicKey: string
  agentKeyHash: string
  humanId?: string
  provider?: string
}

function SpinnerPanel(): JSX.Element {
  return (
    <div className="flex flex-row items-center justify-start gap-8 flex-initial border border-zinc-800 bg-zinc-950 p-6">
      <Spinner size={12} />
      <Spinner size={32} />
      <Spinner size={40} />
    </div>
  )
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
        onVerified: (result: SelfClawVerifiedResult) => void
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
  const [statusLoading, setStatusLoading] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetMounted = useRef(false)
  const urlAgentId = searchParams.get('id')
  const [scriptFailed, setScriptFailed] = useState(false)
  const [selfDeeplink, setSelfDeeplink] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [agentkitAddress, setAgentkitAddress] = useState('')
  const [agentkitSaving, setAgentkitSaving] = useState(false)
  const [agentkitChecking, setAgentkitChecking] = useState(false)
  const [agentkitError, setAgentkitError] = useState<string | null>(null)
  const [agentkitStatus, setAgentkitStatus] = useState<{
    registered: boolean
    humanId: string | null
  } | null>(null)
  const [agentkitRegistration, setAgentkitRegistration] = useState<{
    connectorURI: string
    qrDataUrl: string
    state?: string
    complete?: boolean
    txHash?: string | null
    nonce: string
    proofSubmitted?: boolean
  } | null>(null)
  const [agentkitRegistering, setAgentkitRegistering] = useState(false)
  const agentkitBridgeRef = useRef<ReturnType<typeof createWorldBridgeStore> | null>(null)
  // Bump to trigger re-mount of the SelfClaw widget after an error.
  const [retryAttempt, setRetryAttempt] = useState(0)

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

  // Detect mobile once so we can surface the same-device Self app deeplink
  // (scanning the QR on the same phone you're viewing it on doesn't work).
  useEffect(() => {
    if (typeof navigator === 'undefined') return
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
  }, [])

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
    script.onerror = () => {
      console.error('Failed to load SelfClaw embed')
      setScriptFailed(true)
    }
    document.head.appendChild(script)
  }, [agent?.agentId])

  // Observe the SelfClaw embed's QR fallback text and surface a tappable
  // deeplink if the session URL is a Self.xyz / self:// link. This lets
  // iPhone users tap through to the Self app instead of trying to scan a
  // QR on the same phone.
  useEffect(() => {
    if (!widgetReady || !containerRef.current) return
    const node = containerRef.current
    const extract = () => {
      const fallback = node.querySelector('.sc-verify-qr-fallback')
      if (!fallback) return
      const text = (fallback.textContent || '').trim()
      if (!text) return
      if (/^(self:\/\/|https:\/\/[\w.-]*self\.xyz|https:\/\/redirect\.self\.xyz)/i.test(text)) {
        setSelfDeeplink(text)
      }
    }
    extract()
    const observer = new MutationObserver(extract)
    observer.observe(node, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [widgetReady])

  useEffect(() => {
    if (!agent?.agentId) return

    let active = true

    const fetchVerificationStatus = async () => {
      setStatusLoading(true)
      setVerificationError(null)

      try {
        const response = await fetch(`/api/agents/${agent.agentId}/verify`, {
          cache: 'no-store',
        })

        const data = await response.json().catch(() => ({}))

        if (!active) return

        if (!response.ok) {
          throw new Error(data?.error || 'Failed to load verification status')
        }

        if (data?.verified) {
          setVerified(true)
          setVerifiedResult({
            agentPublicKey: data.verifierAddress || '',
            agentKeyHash: data.attestationUid || '',
            humanId: data.verificationType || undefined,
            provider: data.verificationType || undefined,
          })
        } else {
          setVerified(false)
          setVerifiedResult(null)
        }
      } catch (error) {
        if (!active) return
        setVerificationError(error instanceof Error ? error.message : 'Failed to load verification status')
      } finally {
        if (active) setStatusLoading(false)
      }
    }

    fetchVerificationStatus()

    return () => {
      active = false
    }
  }, [agent?.agentId])

  // Mount the widget once script is ready + container exists. Any synchronous
  // throw from the external embed is contained here — it is NEVER allowed to
  // bubble to React and trigger the /dashboard error boundary (which surfaced
  // as the "Something went wrong — undefined is not an object (evaluating
  // 'e.slice')" page users were hitting on iOS Safari before Ed25519 support).
  useEffect(() => {
    if (!widgetReady || !containerRef.current || !agent?.agentId || widgetMounted.current || verified) return
    if (!window.SelfClaw) return
    widgetMounted.current = true

    try {
      window.SelfClaw.verify({
        container: containerRef.current,
        agentName: `agentbot-${agent.agentId}`,
        agentDescription: 'Agentbot AI agent verified via SelfClaw',
        category: 'assistant',
        theme: 'dark',
        onVerified: async (result) => {
          const safeResult = result || {}
          const mapped: VerifiedResult = {
            agentPublicKey: safeResult.publicKey ?? '',
            agentKeyHash: safeResult.sessionId ?? '',
            humanId: safeResult.humanId,
            provider: 'eas',
          }
          setVerified(true)
          setVerifiedResult(mapped)
          // Record verification on our backend
          try {
            const response = await fetch(`/api/agents/${agent.agentId}/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                verificationType: 'eas',
                attestationUid: mapped.agentKeyHash || undefined,
                walletAddress: mapped.agentPublicKey || undefined,
              }),
            })
            const data = await response.json().catch(() => ({}))
            if (!response.ok) {
              throw new Error(data?.error || 'Failed to record verification')
            }
          } catch (e) {
            console.error('Failed to record verification:', e)
            setVerificationError(e instanceof Error ? e.message : 'Failed to record verification')
          }
        },
        onError: (err) => {
          console.error('SelfClaw verification error:', err)
          setVerificationError(err?.message || 'Verification widget error')
          // Let the user try again by resetting the mount guard.
          widgetMounted.current = false
        },
      })
    } catch (err) {
      console.error('SelfClaw.verify threw synchronously:', err)
      const msg = err instanceof Error ? err.message : 'Failed to initialise verification widget'
      setVerificationError(msg)
      widgetMounted.current = false
    }
  }, [widgetReady, agent?.agentId, verified, retryAttempt])

  useEffect(() => {
    if (!agentkitRegistration?.connectorURI || agentkitRegistration.complete) return

    let active = true
    const interval = window.setInterval(async () => {
      try {
        const bridge = agentkitBridgeRef.current
        if (!bridge) return

        await bridge.getState().pollForUpdates()
        const { result, errorCode, verificationState } = bridge.getState()
        if (!active) return

        if (errorCode) {
          setAgentkitError(String(errorCode))
        }

        setAgentkitRegistration(current => current ? {
          ...current,
          state: verificationState,
        } : current)

        if (result && !agentkitRegistration.proofSubmitted) {
          setAgentkitRegistration(current => current ? { ...current, proofSubmitted: true } : current)
          const response = await fetch('/api/agentkit/register', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              address: agentkitAddress.trim(),
              root: result.merkle_root,
              nonce: agentkitRegistration.nonce,
              nullifierHash: result.nullifier_hash,
              proof: result.proof,
            }),
          })
          const data = await response.json().catch(() => ({}))
          if (!response.ok) {
            throw new Error(data?.error || 'Failed to submit AgentKit registration')
          }

          setAgentkitRegistration(current => current ? {
            ...current,
            complete: true,
            txHash: typeof data.txHash === 'string' ? data.txHash : null,
          } : current)
          window.clearInterval(interval)

          // AgentBook indexing can lag the relay transaction very briefly.
          window.setTimeout(async () => {
            const status = await checkAgentkitRegistration()
            if (status?.registered) {
              await markAgentkitRegistered()
            }
          }, 2500)
        }
      } catch (error) {
        if (active) {
          setAgentkitError(error instanceof Error ? error.message : 'Failed to poll AgentKit registration')
        }
      }
    }, 2500)

    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [agentkitAddress, agentkitRegistration?.connectorURI, agentkitRegistration?.complete, agentkitRegistration?.nonce, agentkitRegistration?.proofSubmitted])

  const retryWidget = () => {
    setVerificationError(null)
    widgetMounted.current = false
    if (containerRef.current) containerRef.current.innerHTML = ''
    setRetryAttempt((n) => n + 1)
  }

  const createAgentkitRegistration = async () => {
    const address = agentkitAddress.trim()
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      setAgentkitError('Enter the EVM wallet address to register in AgentBook.')
      return
    }

    setAgentkitRegistering(true)
    setAgentkitError(null)
    setAgentkitRegistration(null)

    try {
      const response = await fetch('/api/agentkit/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to create AgentKit registration QR')
      }

      const signal = solidityEncode(['address', 'uint256'], [address, BigInt(data.nonce)])
      const bridge = createWorldBridgeStore()
      await bridge.getState().createClient({
        app_id: data.appId,
        action: data.action,
        signal,
      })
      const connectorURI = bridge.getState().connectorURI
      if (!connectorURI) {
        throw new Error('Failed to create World App registration link')
      }
      agentkitBridgeRef.current = bridge

      setAgentkitRegistration({
        connectorURI,
        qrDataUrl: await QRCode.toDataURL(connectorURI, {
          margin: 1,
          width: 256,
        }),
        nonce: data.nonce,
        state: 'awaiting_connection',
      })
    } catch (error) {
      setAgentkitError(error instanceof Error ? error.message : 'Failed to create AgentKit registration QR')
    } finally {
      setAgentkitRegistering(false)
    }
  }

  const markAgentkitRegistered = async () => {
    if (!agent?.agentId) return

    const address = agentkitAddress.trim()
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      setAgentkitError('Enter the EVM wallet address registered in AgentBook.')
      return
    }

    setAgentkitSaving(true)
    setAgentkitError(null)

    try {
      const status = await checkAgentkitRegistration(address)
      if (!status?.registered) {
        throw new Error('That wallet is not registered in AgentBook yet. Complete World App registration first, then check again.')
      }

      const response = await fetch(`/api/agents/${agent.agentId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationType: 'agentkit',
          walletAddress: address,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to record AgentKit registration')
      }

      setVerified(true)
      setVerifiedResult({
        agentPublicKey: address,
        agentKeyHash: data.attestationUid || `agentkit-${address.toLowerCase()}`,
        humanId: status.humanId || 'agentkit',
        provider: 'agentkit',
      })
    } catch (error) {
      setAgentkitError(error instanceof Error ? error.message : 'Failed to record AgentKit registration')
    } finally {
      setAgentkitSaving(false)
    }
  }

  const checkAgentkitRegistration = async (addressOverride?: string) => {
    const address = (addressOverride || agentkitAddress).trim()
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      setAgentkitStatus(null)
      setAgentkitError('Enter the EVM wallet address registered in AgentBook.')
      return null
    }

    setAgentkitChecking(true)
    setAgentkitError(null)

    try {
      const response = await fetch(`/api/agentkit/status?address=${encodeURIComponent(address)}`, {
        cache: 'no-store',
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to check AgentBook registration')
      }

      const status = {
        registered: Boolean(data.registered),
        humanId: typeof data.humanId === 'string' ? data.humanId : null,
      }
      setAgentkitStatus(status)
      return status
    } catch (error) {
      setAgentkitStatus(null)
      setAgentkitError(error instanceof Error ? error.message : 'Failed to check AgentBook registration')
      return null
    } finally {
      setAgentkitChecking(false)
    }
  }

  if (loading) {
    return <SpinnerPanel />
  }

  if (!agent?.agentId) {
    return (
      <div className="border border-zinc-800 bg-zinc-950 p-6">
        <p className="text-zinc-500 text-sm mb-4">
          No agent found. Deploy an agent first from Mission Control.
        </p>
        <a
          href="/dashboard"
          className="text-[10px] text-orange-400 hover:text-orange-400 uppercase tracking-widest font-bold"
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
          Your agent is now linked to a verified human identity via{' '}
          {verifiedResult?.provider === 'agentkit' ? 'AgentKit / AgentBook' : 'SelfClaw'}.
          A <strong className="text-white">Verified Human</strong> badge will appear in agent chats.
        </p>
        {verifiedResult?.agentKeyHash && (
          <p className="text-[10px] font-mono text-zinc-500 break-all">
            Key hash: {verifiedResult.agentKeyHash}
          </p>
        )}
        <a
          href={verifiedResult?.provider === 'agentkit' ? 'https://docs.world.org/agents/agent-kit/integrate.md' : 'https://selfclaw.ai'}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[10px] text-orange-400 hover:text-orange-400 uppercase tracking-widest font-bold"
        >
          {verifiedResult?.provider === 'agentkit' ? 'View AgentKit docs' : 'View on SelfClaw'} <ExternalLink className="w-3 h-3" />
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

      <div className="grid gap-4 lg:grid-cols-2">
      {/* SelfClaw embed widget */}
      <div className="border border-zinc-700 bg-zinc-950 p-4 sm:p-6">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-4">
          Verify with{' '}
          <a href="https://selfclaw.ai" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-400">
            SelfClaw
          </a>
          {' '}/ Self.xyz passport
        </p>

        {/* Widget mounts here */}
        <div ref={containerRef} />

        {isMobile && selfDeeplink && (
          <a
            href={selfDeeplink}
            className="mt-3 inline-flex items-center justify-center w-full sm:w-auto gap-2 bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold uppercase tracking-widest py-2.5 px-4 transition-colors"
          >
            Open in Self app
            <ExternalLink className="w-3 h-3" />
          </a>
        )}

        {!widgetReady && !scriptFailed && (
          <div className="flex items-center gap-2 text-zinc-500 text-xs">
            <Spinner size={12} />
            Loading verification widget…
          </div>
        )}

        {scriptFailed && (
          <div className="mt-3 border border-orange-500/20 bg-orange-500/10 px-3 py-2 text-xs text-red-300">
            Couldn&apos;t load the SelfClaw embed. Check your connection or any
            script blockers and{' '}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="underline hover:text-red-200"
            >
              try again
            </button>
            .
          </div>
        )}

        {statusLoading ? (
          <div className="flex items-center gap-2 text-zinc-500 text-xs mt-3">
            <Spinner size={12} />
            Loading current verification status…
          </div>
        ) : null}

        {verificationError ? (
          <div className="mt-3 border border-orange-500/20 bg-orange-500/10 px-3 py-2 text-xs text-red-300 flex items-start justify-between gap-3">
            <span className="flex-1">{verificationError}</span>
            <button
              type="button"
              onClick={retryWidget}
              className="shrink-0 border border-orange-500/40 hover:border-orange-400 text-red-200 hover:text-white text-[10px] font-bold uppercase tracking-widest py-1 px-2"
            >
              Retry
            </button>
          </div>
        ) : null}

        <p className="text-[10px] text-zinc-600 mt-4 leading-relaxed">
          You&apos;ll need the <strong className="text-zinc-400">Self app</strong> on your phone.
          Your passport NFC chip is read locally — raw data never leaves your device.
        </p>
      </div>

      <div className="border border-zinc-700 bg-zinc-950 p-4 sm:p-6">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-4">
          Verify with{' '}
          <a href="https://docs.world.org/agents/agent-kit/integrate.md" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-400">
            AgentKit
          </a>
          {' '}/ AgentBook
        </p>

        <div className="space-y-3 text-xs text-zinc-400">
          <p>
            Register the wallet your agent signs with in AgentBook, then attach
            that address here so x402 endpoints can recognize a human-backed agent.
          </p>

          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-zinc-600">Register</p>
            <code className="block border border-zinc-800 bg-black px-3 py-2 text-[11px] text-zinc-300 break-all">
              npx @worldcoin/agentkit-cli register &lt;agent-address&gt;
            </code>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-zinc-600">Install agent skill</p>
            <code className="block border border-zinc-800 bg-black px-3 py-2 text-[11px] text-zinc-300 break-all">
              npx skills add worldcoin/agentkit agentkit-x402
            </code>
          </div>
        </div>

        <label className="mt-4 block">
          <span className="block text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Agent wallet</span>
          <input
            value={agentkitAddress}
            onChange={(event) => {
              setAgentkitAddress(event.target.value)
              setAgentkitStatus(null)
              setAgentkitRegistration(null)
            }}
            placeholder="0x..."
            className="w-full border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
          />
        </label>

        <button
          type="button"
          onClick={createAgentkitRegistration}
          disabled={agentkitRegistering}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 disabled:hover:bg-orange-500 text-white text-xs font-bold uppercase tracking-widest py-2.5 px-4 transition-colors"
        >
          {agentkitRegistering ? 'Creating QR...' : 'Create World App QR'}
        </button>

        {agentkitRegistration ? (
          <div className="mt-3 border border-zinc-800 bg-black p-3">
            <img
              src={agentkitRegistration.qrDataUrl}
              alt="AgentKit registration QR code"
              className="mx-auto h-48 w-48 bg-white p-2"
            />
            <a
              href={agentkitRegistration.connectorURI}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 border border-zinc-700 hover:border-orange-500 text-zinc-200 hover:text-white text-xs font-bold uppercase tracking-widest py-2.5 px-4 transition-colors"
            >
              Open World App link
              <ExternalLink className="w-3 h-3" />
            </a>
            <p className="mt-3 text-[10px] text-zinc-600">
              Status: {agentkitRegistration.complete ? 'registered' : agentkitRegistration.state || 'waiting'}.
            </p>
            {agentkitRegistration.txHash ? (
              <p className="mt-2 text-[10px] font-mono text-zinc-500 break-all">
                Tx: {agentkitRegistration.txHash}
              </p>
            ) : null}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => checkAgentkitRegistration()}
          disabled={agentkitChecking}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 border border-zinc-700 hover:border-orange-500 disabled:opacity-60 text-zinc-200 hover:text-white text-xs font-bold uppercase tracking-widest py-2.5 px-4 transition-colors"
        >
          {agentkitChecking ? 'Checking...' : 'Check AgentBook Status'}
        </button>

        {agentkitStatus ? (
          <div className={`mt-3 border px-3 py-2 text-xs ${agentkitStatus.registered ? 'border-green-500/20 bg-green-500/10 text-green-300' : 'border-yellow-500/20 bg-yellow-500/10 text-yellow-200'}`}>
            {agentkitStatus.registered ? (
              <span>Registered in AgentBook{agentkitStatus.humanId ? `: ${agentkitStatus.humanId}` : ''}</span>
            ) : (
              <span>Not registered in AgentBook yet. Run the CLI command and complete World App verification first.</span>
            )}
          </div>
        ) : null}

        <button
          type="button"
          onClick={markAgentkitRegistered}
          disabled={agentkitSaving}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 disabled:hover:bg-orange-500 text-white text-xs font-bold uppercase tracking-widest py-2.5 px-4 transition-colors"
        >
          {agentkitSaving ? 'Saving...' : 'Mark AgentKit Registered'}
        </button>

        {agentkitError ? (
          <div className="mt-3 border border-orange-500/20 bg-orange-500/10 px-3 py-2 text-xs text-red-300">
            {agentkitError}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-3 text-[10px] font-bold uppercase tracking-widest">
          <a href="https://docs.world.org/llms.txt" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white inline-flex items-center gap-1">
            Docs index <ExternalLink className="w-3 h-3" />
          </a>
          <a href="/dashboard/x402" className="text-zinc-500 hover:text-white">
            x402 Gateway
          </a>
        </div>
      </div>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  const ShieldIcon = () => (
    <svg className="h-5 w-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-orange-400 hover:text-orange-400 border border-zinc-700 hover:border-orange-500 px-3 py-1.5 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            selfclaw.ai
          </a>
        }
      />

      <DashboardContent className="max-w-4xl space-y-6">
        <SectionHeader
          label="Identity"
          title="Onchain Verification"
          description="Link your agent to SelfClaw or AgentKit so users and x402 endpoints can identify human-backed agent traffic."
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
                <div className="w-1 h-1 bg-red-400 mt-1.5 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-bold uppercase tracking-wider">{item.label}</span>
                  <span className="text-xs text-zinc-500 ml-2">— {item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Suspense fallback={<SpinnerPanel />}>
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
