'use client'

import { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { coinbaseWallet } from 'wagmi/connectors'
import { DashboardShell, DashboardHeader, DashboardContent } from '@/app/components/shared/DashboardShell'
import { SectionHeader } from '@/app/components/shared/SectionHeader'
import StatusPill from '@/app/components/shared/StatusPill'
import type { BasefmDistributionState } from '@/app/lib/basefmDistribution'

const RAVE_TOKEN_ADDRESS = '0xdf3c79a5759eeedb844e7481309a75037b8e86f5'
const RAVE_THRESHOLD = BigInt('1250000000000000000000000') // 1,250,000 RAVE in wei
const MUX_RTMP_URL = 'rtmp://global-live.mux.com:5222/app'

interface CommunityProgramResponse {
  perks: Array<{
    key: string
    unlocked: boolean
    detail: string
  }>
  rewards: {
    claimed: boolean
    currentTier: {
      label: string
    } | null
  }
}

interface RelayRow {
  key: string
  name: string
  type: string
  required: boolean
  enabled: boolean
  status: string
  viewerUrl: string | null
  probeUrl: string | null
  lastHealthyAt: string | null
  lastErrorAt: string | null
  lastErrorMessage: string | null
}

interface StreamMuxStatus {
  active: boolean
  session?: {
    id: number
    djName: string | null
    muxStreamId: string
    playbackId: string | null
  }
  mux?: {
    id: string
    status: string
    playbackId: string | null
    recentAssetIds: string[]
  }
  distribution?: BasefmDistributionState
  streamHealth?: 'good' | 'waiting' | 'bad'
  pickupRecommended?: boolean
  message?: string
  error?: string
}

function toStatusPillStatus(status: string): 'active' | 'idle' | 'error' | 'offline' {
  if (status === 'healthy' || status === 'active') return 'active'
  if (status === 'pending' || status === 'degraded' || status === 'idle') return 'idle'
  if (status === 'failed' || status === 'error') return 'error'
  return 'offline'
}

export default function DJStreamPage() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const [raveBalance, setRaveBalance] = useState<string | null>(null)
  const [stream, setStream] = useState<any>(null)
  const [streamSessionToken, setStreamSessionToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [djName, setDjName] = useState('DJ Escaba')
  const [communityProgram, setCommunityProgram] = useState<CommunityProgramResponse | null>(null)
  const [distribution, setDistribution] = useState<BasefmDistributionState | null>(null)
  const [relays, setRelays] = useState<RelayRow[]>([])
  const [relayLoading, setRelayLoading] = useState(true)
  const [relayActionError, setRelayActionError] = useState('')
  const [probingRelayKey, setProbingRelayKey] = useState<string | null>(null)
  const [youtubeViewerUrl, setYoutubeViewerUrl] = useState('')
  const [youtubeProbeUrl, setYoutubeProbeUrl] = useState('')
  const [savingYoutubeRelay, setSavingYoutubeRelay] = useState(false)
  const [endingStream, setEndingStream] = useState(false)
  const [muxStatus, setMuxStatus] = useState<StreamMuxStatus | null>(null)
  const [muxStatusLoading, setMuxStatusLoading] = useState(false)
  const [muxSyncing, setMuxSyncing] = useState(false)

  const handleConnect = () => {
    connect({ connector: coinbaseWallet({ appName: 'Agentbot', preference: 'smartWalletOnly' }) })
  }

  useEffect(() => {
    if (address) checkRAVEBalance(address)
  }, [address])

  useEffect(() => {
    const loadCommunityProgram = async () => {
      try {
        const res = await fetch('/api/community/program')
        if (!res.ok) return
        setCommunityProgram(await res.json())
      } catch {}
    }

    loadCommunityProgram()
  }, [])

  useEffect(() => {
    if (!stream || !streamSessionToken) return

    let active = true

    const checkAndMaybeSync = async () => {
      try {
        const res = await fetch('/api/basefm/streams/status', {
          headers: { 'x-basefm-session': streamSessionToken },
          cache: 'no-store',
        })
        const data = await res.json()
        if (!active || !res.ok) return

        setMuxStatus(data)

        if (data?.pickupRecommended) {
          const syncRes = await fetch('/api/basefm/streams/status', {
            method: 'POST',
            headers: { 'x-basefm-session': streamSessionToken },
          })
          const syncData = await syncRes.json()
          if (!active || !syncRes.ok) return

          const refreshed = await fetch('/api/basefm/streams/status', {
            headers: { 'x-basefm-session': streamSessionToken },
            cache: 'no-store',
          })
          const refreshedData = await refreshed.json()
          if (active && refreshed.ok) {
            setMuxStatus(refreshedData)
          }

          if (syncData?.synced) {
            const distributionRes = await fetch('/api/basefm/distribution', { cache: 'no-store' })
            const distributionData = await distributionRes.json()
            if (active) setDistribution(distributionData?.distribution || null)
          }
        }
      } catch {
        // keep this silent; manual controls remain available
      }
    }

    checkAndMaybeSync()
    const interval = setInterval(checkAndMaybeSync, 10000)

    return () => {
      active = false
      clearInterval(interval)
    }
  }, [stream, streamSessionToken])

  useEffect(() => {
    let active = true

    const loadRelayState = async () => {
      try {
        const [distributionRes, relaysRes] = await Promise.all([
          fetch('/api/basefm/distribution', { cache: 'no-store' }),
          fetch('/api/basefm/relays', { cache: 'no-store' }),
        ])

        const distributionData = await distributionRes.json()
        const relaysData = await relaysRes.json()

        if (!active) return

        setDistribution(distributionData?.distribution || null)
        setRelays(Array.isArray(relaysData?.relays) ? relaysData.relays : [])
      } catch (err) {
        if (!active) return
        setRelayActionError(err instanceof Error ? err.message : 'Unable to load relay status')
      } finally {
        if (active) setRelayLoading(false)
      }
    }

    loadRelayState()
    const interval = setInterval(loadRelayState, 15000)

    return () => {
      active = false
      clearInterval(interval)
    }
  }, [])

  const checkRAVEBalance = async (walletAddress: string) => {
    try {
      const response = await fetch('https://mainnet.base.org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [{
            to: RAVE_TOKEN_ADDRESS,
            data: '0x70a08231000000000000000000000000' + walletAddress.replace('0x', '')
          }, 'latest'],
          id: 1
        })
      })
      const result = await response.json()
      const balance = BigInt(result.result || '0x0')
      setRaveBalance(balance.toString())
    } catch (e) {
      console.error('Error checking balance:', e)
    }
  }

  const probeRelay = async (relayKey: string) => {
    setProbingRelayKey(relayKey)
    setRelayActionError('')
    try {
      const res = await fetch(`/api/basefm/relays/${relayKey}/probe`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Relay probe failed')
      }

      setRelays((current) =>
        current.map((relay) =>
          relay.key === relayKey && data?.relay
            ? {
                ...relay,
                status: data.relay.status,
                lastHealthyAt: data.relay.last_healthy_at || relay.lastHealthyAt,
                lastErrorAt: data.relay.last_error_at || relay.lastErrorAt,
                lastErrorMessage: data.relay.last_error_message || null,
              }
            : relay
        )
      )
    } catch (err) {
      setRelayActionError(err instanceof Error ? err.message : 'Relay probe failed')
    } finally {
      setProbingRelayKey(null)
    }
  }

  const saveYoutubeRelay = async () => {
    setSavingYoutubeRelay(true)
    setRelayActionError('')
    try {
      const res = await fetch('/api/basefm/relays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'youtube-main',
          name: 'YouTube',
          type: 'youtube',
          required: false,
          enabled: true,
          viewerUrl: youtubeViewerUrl.trim() || null,
          probeUrl: youtubeProbeUrl.trim() || youtubeViewerUrl.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to save YouTube relay')
      }

      const relaysRes = await fetch('/api/basefm/relays', { cache: 'no-store' })
      const relaysData = await relaysRes.json()
      setRelays(Array.isArray(relaysData?.relays) ? relaysData.relays : [])
    } catch (err) {
      setRelayActionError(err instanceof Error ? err.message : 'Failed to save YouTube relay')
    } finally {
      setSavingYoutubeRelay(false)
    }
  }

  const createStream = async () => {
    const streamWallet = hasRaveAccess ? address : claimedWallet
    if (!streamWallet) return

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/basefm/streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: streamWallet, name: djName })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create stream')
      } else {
        setStream(data.stream)
        setStreamSessionToken(data?.session?.accessToken || null)
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const endCurrentStream = async () => {
    setEndingStream(true)
    setError('')
    try {
      const res = await fetch('/api/basefm/streams', {
        method: 'DELETE',
        headers: streamSessionToken ? { 'x-basefm-session': streamSessionToken } : undefined,
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to end current stream')
      }

      setStream(null)
      setStreamSessionToken(null)
      setMuxStatus(null)

      const [distributionRes, relaysRes] = await Promise.all([
        fetch('/api/basefm/distribution', { cache: 'no-store' }),
        fetch('/api/basefm/relays', { cache: 'no-store' }),
      ])

      const distributionData = await distributionRes.json()
      const relaysData = await relaysRes.json()
      setDistribution(distributionData?.distribution || null)
      setRelays(Array.isArray(relaysData?.relays) ? relaysData.relays : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end current stream')
    } finally {
      setEndingStream(false)
    }
  }

  const fetchMuxStatus = async () => {
    setMuxStatusLoading(true)
    setError('')
    try {
      const res = await fetch('/api/basefm/streams/status', {
        headers: streamSessionToken ? { 'x-basefm-session': streamSessionToken } : undefined,
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to fetch Mux status')
      }
      setMuxStatus(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch Mux status')
    } finally {
      setMuxStatusLoading(false)
    }
  }

  const syncFromMux = async () => {
    setMuxSyncing(true)
    setError('')
    try {
      const res = await fetch('/api/basefm/streams/status', {
        method: 'POST',
        headers: streamSessionToken ? { 'x-basefm-session': streamSessionToken } : undefined,
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to sync from Mux')
      }
      await fetchMuxStatus()
      const distributionRes = await fetch('/api/basefm/distribution', { cache: 'no-store' })
      const distributionData = await distributionRes.json()
      setDistribution(distributionData?.distribution || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync from Mux')
    } finally {
      setMuxSyncing(false)
    }
  }

  const hasRaveAccess = Boolean(raveBalance && BigInt(raveBalance) >= RAVE_THRESHOLD)
  const claimedWallet = communityProgram?.rewards.walletAddress || null
  const hasCommunityPass = Boolean(
    communityProgram?.perks.some((perk) => perk.key === 'basefm-pass' && perk.unlocked)
  )
  const hasAccess = hasRaveAccess || hasCommunityPass
  const streamWallet = hasRaveAccess ? address || null : claimedWallet
  const formatAddress = (addr: string) => addr ? addr.slice(0, 6) + '...' + addr.slice(-4) : ''

  return (
    <DashboardShell>
      <DashboardHeader
        title="DJ Stream"
        icon={
          <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        }
      />

      <DashboardContent>
        <div className="max-w-3xl space-y-px">
          <div className="border border-zinc-800 bg-zinc-950 p-6">
            <SectionHeader
              label="Pioneer Mode"
              title="Rekordbox-Friendly Layout"
              description="Keep your normal Pioneer / Rekordbox muscle memory. Agentbot handles broadcast and relay control, not your deck workflow."
            />

            <div className="grid gap-px bg-zinc-800 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-black p-4">
                <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3">Deck A / B</div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Keep track selection, cueing, tempo, EQ, and channel faders on your Pioneer hardware or inside Rekordbox.
                </p>
              </div>
              <div className="bg-black p-4">
                <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3">Mixer</div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Treat Agentbot like the broadcast rack after your mixer. Your master output stays the source of truth.
                </p>
              </div>
              <div className="bg-black p-4">
                <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3">Broadcast</div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  OBS or your encoder sends the master program feed to baseFM. No need to relearn DJ controls to go live.
                </p>
              </div>
              <div className="bg-black p-4">
                <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3">Relays</div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Agentbot manages first-party playback, basefm.space, and optional downstream relays like YouTube.
                </p>
              </div>
            </div>

            <div className="mt-4 border border-zinc-800 bg-black p-4">
              <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3">Signal Path</div>
              <div className="grid gap-3 sm:grid-cols-4">
                {[
                  { label: 'Source', value: 'CDJ / XDJ / DDJ / Rekordbox' },
                  { label: 'Mixer', value: 'Master Out' },
                  { label: 'Encoder', value: 'OBS / RTMP' },
                  { label: 'Station', value: 'baseFM / Relays' },
                ].map((item) => (
                  <div key={item.label} className="border border-zinc-800 p-3">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">{item.label}</div>
                    <div className="text-xs text-zinc-300">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Step 1: Wallet */}
          <div className="border border-zinc-800 bg-zinc-950 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase tracking-widest text-zinc-600">Step 01</span>
                <span className="text-sm font-bold tracking-tight uppercase">Access Key</span>
              </div>
              {(isConnected || hasCommunityPass) && <StatusPill status="active" label={isConnected ? 'Connected' : 'Claimed'} />}
            </div>

            {!isConnected ? (
              <div>
                <button
                  onClick={handleConnect}
                  className="border border-zinc-700 hover:border-zinc-500 text-white text-xs font-bold uppercase tracking-widest py-3 px-6 transition-colors"
                >
                  Connect Wallet
                </button>
                <p className="mt-4 text-zinc-600 text-[10px] uppercase tracking-widest">
                  Base network · Coinbase Smart Wallet
                </p>

                {hasCommunityPass && claimedWallet && (
                  <div className="mt-4 border border-blue-500/20 bg-blue-500/10 p-4">
                    <p className="text-blue-300 text-[10px] uppercase tracking-widest">Agentbot Claimed Wallet</p>
                    <div className="mt-2 flex items-center gap-3">
                      <code className="text-sm text-zinc-200 font-mono">{formatAddress(claimedWallet)}</code>
                      <StatusPill status="active" label="Ready" />
                    </div>
                    <p className="mt-2 text-sm text-zinc-300">
                      Your Agentbot community pass is already linked, so you can stream with the claimed wallet even before connecting a Base wallet.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <code className="text-sm text-zinc-400 font-mono">{formatAddress(address!)}</code>
                  <button
                    onClick={() => disconnect()}
                    className="text-zinc-600 hover:text-white text-[10px] uppercase tracking-widest transition-colors"
                  >
                    Disconnect
                  </button>
                </div>

                {hasCommunityPass && claimedWallet && claimedWallet.toLowerCase() !== address!.toLowerCase() ? (
                  <div className="border border-blue-500/20 bg-blue-500/10 p-4">
                    <p className="text-blue-300 text-[10px] uppercase tracking-widest">Agentbot Claimed Wallet</p>
                    <p className="mt-2 text-sm text-zinc-300">
                      If you use the Agentbot token pass instead of the RAVE gate, the stream will mint against {formatAddress(claimedWallet)}.
                    </p>
                  </div>
                ) : null}
              </div>
            )}

            {error && (
              <div className="mt-4 border border-red-500/30 p-3 text-red-400 text-xs">
                {error}
              </div>
            )}
          </div>

          {/* Step 2: RAVE Balance */}
          {isConnected && (
            <div className="border border-zinc-800 bg-zinc-950 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-600">Step 02</span>
                  <span className="text-sm font-bold tracking-tight uppercase">Gate Check</span>
                </div>
                {hasAccess ? (
                  <StatusPill status="active" label="Eligible" />
                ) : raveBalance ? (
                  <StatusPill status="error" label="Insufficient" />
                ) : (
                  <StatusPill status="idle" label="Checking" />
                )}
              </div>

              <div className="space-y-4">
                {raveBalance ? (
                  <div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-bold tracking-tight">
                      {(Number(raveBalance) / 1e18).toLocaleString()}
                    </span>
                    <span className="text-xs text-zinc-500 uppercase tracking-widest">RAVE</span>
                  </div>
                  <p className="text-zinc-600 text-xs">
                    Required: 1,250,000 RAVE · Gate: $RAVE token on Base
                  </p>

                  {!hasAccess && (
                    <div className="mt-4 border border-zinc-800 p-4">
                      <p className="text-zinc-500 text-xs mb-1">
                        Need 1,250,000 RAVE to stream. Acquire on Uniswap or earn through baseFM.
                      </p>
                      <p className="text-zinc-700 text-[10px] uppercase tracking-widest">
                        Stripe payment option coming soon
                      </p>
                    </div>
                  )}
                  </div>
                ) : isConnected ? (
                  <p className="text-zinc-600 text-xs">Reading on-chain balance...</p>
                ) : null}

                {hasCommunityPass && claimedWallet && (
                  <div className="border border-blue-500/20 bg-blue-500/10 p-4">
                  <p className="text-blue-300 text-xs uppercase tracking-widest">Agentbot Community Pass</p>
                  <p className="mt-2 text-sm text-zinc-200">
                    Your {communityProgram?.rewards.currentTier?.label || 'claimed'} holder status unlocks a baseFM guest pass, so you can stream even without the full RAVE gate.
                  </p>
                  <p className="mt-2 text-xs text-zinc-400">
                    Claimed wallet: <span className="font-mono text-zinc-200">{claimedWallet}</span>
                  </p>
                </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Create Stream */}
          {hasAccess && !stream && (
            <div className="border border-zinc-800 bg-zinc-950 p-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-[10px] uppercase tracking-widest text-zinc-600">Step 03</span>
                <span className="text-sm font-bold tracking-tight uppercase">Broadcast Arm</span>
              </div>

              <div className="mb-6">
                <label className="block text-[10px] uppercase tracking-widest text-zinc-600 mb-2">DJ / SHOW NAME</label>
                <input
                  type="text"
                  value={djName}
                  onChange={(e) => setDjName(e.target.value)}
                  placeholder="DJ YourName"
                  className="w-full bg-black border border-zinc-800 px-4 py-3 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600 font-mono"
                />
              </div>

              <button
                onClick={createStream}
                disabled={loading || !streamWallet}
                className="w-full bg-white text-black py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors"
              >
                {loading ? 'Arming Broadcast...' : 'Go Live'}
              </button>

              {streamWallet ? (
                <p className="mt-3 text-xs text-zinc-500">
                  Access wallet: <span className="font-mono text-zinc-300">{streamWallet}</span>
                  {hasCommunityPass && !hasRaveAccess ? ' · using Agentbot token claim path' : ' · using RAVE gate path'}
                </p>
              ) : null}
            </div>
          )}

          <div className="border border-zinc-800 bg-zinc-950 p-6">
            <SectionHeader
              label="Distribution"
              title="Origin + Relay Health"
              description="Agentbot is canonical. Relays are downstream and tracked separately."
            />

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-zinc-800">
                <div className="bg-black p-4">
                  <span className="block text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Origin</span>
                  <StatusPill
                    status={toStatusPillStatus(distribution?.origin.status || 'offline')}
                    label={distribution?.origin.status || 'offline'}
                    size="sm"
                  />
                </div>
                <div className="bg-black p-4">
                  <span className="block text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Agentbot</span>
                  <StatusPill
                    status={toStatusPillStatus(distribution?.firstParty.status || 'offline')}
                    label={distribution?.firstParty.status || 'offline'}
                    size="sm"
                  />
                </div>
                <div className="bg-black p-4">
                  <span className="block text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Required Relays</span>
                  <StatusPill
                    status={toStatusPillStatus(distribution?.requiredRelayStatus || 'offline')}
                    label={distribution?.requiredRelayStatus || 'offline'}
                    size="sm"
                  />
                </div>
              </div>

              <div className="border border-zinc-800">
                <div className="border-b border-zinc-800 bg-black px-4 py-3 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-600">Relay Destinations</span>
                  <span className="text-[10px] uppercase tracking-widest text-zinc-700">
                    {relayLoading ? 'Loading' : `${relays.length} configured`}
                  </span>
                </div>
                <div className="divide-y divide-zinc-800">
                  {relays.map((relay) => (
                    <div key={relay.key} className="bg-black p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold uppercase tracking-tight">{relay.name}</span>
                            <StatusPill
                              status={toStatusPillStatus(relay.status)}
                              label={relay.status}
                              size="sm"
                            />
                          </div>
                          <div className="mt-2 text-xs text-zinc-500 space-y-1">
                            <p>Type: <span className="text-zinc-300 uppercase tracking-widest">{relay.type}</span></p>
                            <p>{relay.required ? 'Required relay' : 'Optional relay'}</p>
                            {relay.viewerUrl ? (
                              <p>
                                Viewer: <a href={relay.viewerUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-300 underline hover:text-white">{relay.viewerUrl}</a>
                              </p>
                            ) : null}
                            {relay.lastHealthyAt ? <p>Last healthy: <span className="text-zinc-300">{new Date(relay.lastHealthyAt).toLocaleString()}</span></p> : null}
                            {relay.lastErrorMessage ? <p className="text-red-400">Last error: {relay.lastErrorMessage}</p> : null}
                          </div>
                        </div>
                        <button
                          onClick={() => probeRelay(relay.key)}
                          disabled={probingRelayKey === relay.key}
                          className="border border-zinc-700 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white disabled:border-zinc-800 disabled:text-zinc-600"
                        >
                          {probingRelayKey === relay.key ? 'Probing' : 'Probe Relay'}
                        </button>
                      </div>
                    </div>
                  ))}
                  {!relayLoading && relays.length === 0 ? (
                    <div className="bg-black p-4 text-xs text-zinc-500">
                      No relay destinations configured yet.
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="border border-zinc-800 bg-black p-4">
                <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Optional YouTube Relay</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    value={youtubeViewerUrl}
                    onChange={(e) => setYoutubeViewerUrl(e.target.value)}
                    placeholder="https://youtube.com/@yourchannel/live"
                    className="w-full bg-zinc-950 border border-zinc-800 px-4 py-3 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600 font-mono"
                  />
                  <input
                    type="text"
                    value={youtubeProbeUrl}
                    onChange={(e) => setYoutubeProbeUrl(e.target.value)}
                    placeholder="Optional custom probe URL"
                    className="w-full bg-zinc-950 border border-zinc-800 px-4 py-3 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600 font-mono"
                  />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-zinc-500">
                    Save the viewer/probe destination here. RTMP key management stays external for now.
                  </p>
                  <button
                    onClick={saveYoutubeRelay}
                    disabled={savingYoutubeRelay || !youtubeViewerUrl.trim()}
                    className="border border-zinc-700 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white disabled:border-zinc-800 disabled:text-zinc-600"
                  >
                    {savingYoutubeRelay ? 'Saving' : 'Save YouTube Relay'}
                  </button>
                </div>
              </div>

              {relayActionError ? (
                <div className="border border-red-500/30 p-3 text-red-400 text-xs">
                  {relayActionError}
                </div>
              ) : null}
            </div>
          </div>

          {/* Stream Ready */}
          {stream && (
            <div className="border border-zinc-800 bg-zinc-950 p-6">
              <SectionHeader
                label="Live"
                title="Broadcast Rack Ready"
                description="Use this like the station rack after your decks and mixer. Pioneer / Rekordbox still own track control, cueing, and EQ."
              />

              <div className="space-y-6">
                {/* Status */}
                <div className="flex items-center gap-3">
                  <StatusPill status="active" label="Broadcast Live" />
                  <span className="text-xs text-zinc-500">Show: {stream.name || djName}</span>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={endCurrentStream}
                    disabled={endingStream}
                    className="border border-red-500/30 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-red-400 transition-colors hover:border-red-500 disabled:border-zinc-800 disabled:text-zinc-600"
                  >
                    {endingStream ? 'Cutting Feed' : 'Stop Broadcast'}
                  </button>
                  <button
                    onClick={fetchMuxStatus}
                    disabled={muxStatusLoading}
                    className="border border-zinc-700 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white disabled:border-zinc-800 disabled:text-zinc-600"
                  >
                    {muxStatusLoading ? 'Checking Mux' : 'Check Mux Status'}
                  </button>
                  <button
                    onClick={syncFromMux}
                    disabled={muxSyncing}
                    className="border border-zinc-700 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white disabled:border-zinc-800 disabled:text-zinc-600"
                  >
                    {muxSyncing ? 'Syncing' : 'Force Pickup'}
                  </button>
                </div>

                {muxStatus ? (
                  <div className="border border-zinc-800 p-4">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3">Mux Status</div>
                    <div className="grid gap-px bg-zinc-800 sm:grid-cols-3">
                      <div className="bg-black p-3">
                        <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Mux Stream</div>
                        <div className="text-xs text-zinc-300 break-all">{muxStatus.session?.muxStreamId || muxStatus.mux?.id || 'Unknown'}</div>
                      </div>
                      <div className="bg-black p-3">
                        <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Mux State</div>
                        <StatusPill
                          status={toStatusPillStatus(muxStatus.mux?.status || 'offline')}
                          label={muxStatus.mux?.status || 'unknown'}
                          size="sm"
                        />
                      </div>
                      <div className="bg-black p-3">
                        <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Health</div>
                        <StatusPill
                          status={
                            muxStatus.streamHealth === 'good'
                              ? 'active'
                              : muxStatus.streamHealth === 'waiting'
                                ? 'idle'
                                : 'error'
                          }
                          label={muxStatus.streamHealth || 'unknown'}
                          size="sm"
                        />
                      </div>
                      <div className="bg-black p-3">
                        <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Playback ID</div>
                        <div className="text-xs text-zinc-300 break-all">{muxStatus.mux?.playbackId || muxStatus.session?.playbackId || 'Pending'}</div>
                      </div>
                    </div>
                    {muxStatus.message ? (
                      <p className="mt-3 text-xs text-zinc-500">{muxStatus.message}</p>
                    ) : null}
                    {muxStatus.pickupRecommended ? (
                      <p className="mt-2 text-xs text-amber-300">Mux is active but the station has not picked the stream up yet. Force Pickup is recommended.</p>
                    ) : null}
                    {muxStatus.mux?.recentAssetIds?.length ? (
                      <p className="mt-2 text-xs text-zinc-600">
                        Recent assets: {muxStatus.mux.recentAssetIds.length}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <div className="grid gap-px bg-zinc-800 sm:grid-cols-3">
                  <div className="bg-black p-4">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Decks</div>
                    <div className="text-xs text-zinc-300">Rekordbox / Pioneer deck workflow stays unchanged</div>
                  </div>
                  <div className="bg-black p-4">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Master Out</div>
                    <div className="text-xs text-zinc-300">Send mixer master out into OBS or your encoder</div>
                  </div>
                  <div className="bg-black p-4">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Broadcast Rack</div>
                    <div className="text-xs text-zinc-300">Agentbot controls the station + relay layer after your mix</div>
                  </div>
                </div>

                {/* RTMP URL */}
                <div>
                  <span className="block text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Program Feed Target</span>
                  <code className="block bg-black border border-zinc-800 p-3 text-xs text-zinc-400 break-all select-all">
                    {stream.fullRtmpUrl}
                  </code>
                </div>

                {/* Stream Key + Playback */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-zinc-800">
                  <div className="bg-black p-4">
                    <span className="block text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Broadcast Key</span>
                    <code className="block text-xs text-zinc-400 break-all select-all">
                      {stream.streamKey}
                    </code>
                  </div>
                  <div className="bg-black p-4">
                  <span className="block text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Station Playback ID</span>
                  <code className="block text-xs text-zinc-400 break-all select-all">
                      {stream.playbackId || 'Pending...'}
                  </code>
                </div>
              </div>

                <div className="border border-zinc-800 p-4">
                  <span className="block text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Gate Source</span>
                  <span className="text-xs text-zinc-300 uppercase tracking-widest">
                    {stream.accessGrantedBy === 'community-pass' ? 'Agentbot community pass' : 'RAVE gate'}
                  </span>
                </div>

                {/* OBS Settings */}
                <div className="border border-zinc-800 p-4">
                  <span className="block text-[10px] uppercase tracking-widest text-zinc-600 mb-3">Encoder / OBS Settings</span>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Encoder Mode</span>
                      <span className="text-zinc-300">Custom</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">RTMP Server</span>
                      <code className="text-zinc-400">{MUX_RTMP_URL}</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Audio</span>
                      <span className="text-zinc-300">256-320 kbps · AAC · 44.1kHz Stereo</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Deck / Mixer Model</span>
                      <span className="text-zinc-300">Decks + EQ + cue on Pioneer, broadcast out on Agentbot</span>
                    </div>
                  </div>
                </div>

                <div className="border border-zinc-800 p-4">
                  <span className="block text-[10px] uppercase tracking-widest text-zinc-600 mb-3">Pioneer / Rekordbox Quick Notes</span>
                  <div className="space-y-2 text-xs text-zinc-500">
                    <p>1. Keep cue, beatmatch, loops, hot cues, and EQ work on your Pioneer hardware or Rekordbox.</p>
                    <p>2. Use the mixer master as the source feed for OBS.</p>
                    <p>3. Treat Agentbot like the broadcast rack after the mixer, not a CDJ or mixer replacement.</p>
                    <p>4. If you already know Pioneer workflow, you only need the go-live, stop, and relay controls here.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardContent>
    </DashboardShell>
  )
}
