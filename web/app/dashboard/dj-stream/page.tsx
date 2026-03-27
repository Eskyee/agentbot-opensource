'use client'

import { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { DashboardShell, DashboardHeader, DashboardContent } from '@/app/components/shared/DashboardShell'
import { SectionHeader } from '@/app/components/shared/SectionHeader'
import StatusPill from '@/app/components/shared/StatusPill'

const RAVE_TOKEN_ADDRESS = '0xdf3c79a5759eeedb844e7481309a75037b8e86f5'
const RAVE_THRESHOLD = BigInt('1250000000000000000000000') // 1,250,000 RAVE in wei
const MUX_RTMP_URL = 'rtmp://global-live.mux.com:5222/app'

export default function DJStreamPage() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const [raveBalance, setRaveBalance] = useState<string | null>(null)
  const [stream, setStream] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [djName, setDjName] = useState('DJ Escaba')

  const handleConnect = () => {
    if (typeof window === 'undefined') return
    if (!window.ethereum) {
      setError('No wallet found. Install MetaMask or Coinbase Wallet.')
      return
    }
    connect({ connector: injected() })
  }

  useEffect(() => {
    if (address) checkRAVEBalance(address)
  }, [address])

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

  const createStream = async () => {
    if (!address) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/basefm/streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: address, name: djName })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create stream')
      } else {
        setStream(data.stream)
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const hasAccess = raveBalance && BigInt(raveBalance) >= RAVE_THRESHOLD
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
          {/* Step 1: Wallet */}
          <div className="border border-zinc-800 bg-zinc-950 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase tracking-widest text-zinc-600">Step 01</span>
                <span className="text-sm font-bold tracking-tight uppercase">Connect Wallet</span>
              </div>
              {isConnected && <StatusPill status="active" label="Connected" />}
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
                  Base network · MetaMask or Coinbase Wallet
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <code className="text-sm text-zinc-400 font-mono">{formatAddress(address!)}</code>
                <button
                  onClick={() => disconnect()}
                  className="text-zinc-600 hover:text-white text-[10px] uppercase tracking-widest transition-colors"
                >
                  Disconnect
                </button>
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
                  <span className="text-sm font-bold tracking-tight uppercase">Verify RAVE</span>
                </div>
                {hasAccess ? (
                  <StatusPill status="active" label="Eligible" />
                ) : raveBalance ? (
                  <StatusPill status="error" label="Insufficient" />
                ) : (
                  <StatusPill status="idle" label="Checking" />
                )}
              </div>

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
              ) : (
                <p className="text-zinc-600 text-xs">Reading on-chain balance...</p>
              )}
            </div>
          )}

          {/* Step 3: Create Stream */}
          {hasAccess && !stream && (
            <div className="border border-zinc-800 bg-zinc-950 p-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-[10px] uppercase tracking-widest text-zinc-600">Step 03</span>
                <span className="text-sm font-bold tracking-tight uppercase">Create Stream</span>
              </div>

              <div className="mb-6">
                <label className="block text-[10px] uppercase tracking-widest text-zinc-600 mb-2">DJ Name</label>
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
                disabled={loading}
                className="w-full bg-white text-black py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors"
              >
                {loading ? 'Creating...' : 'Start Streaming'}
              </button>
            </div>
          )}

          {/* Stream Ready */}
          {stream && (
            <div className="border border-zinc-800 bg-zinc-950 p-6">
              <SectionHeader
                label="Live"
                title="Stream Ready"
                description="Configure OBS or Larix with the credentials below."
              />

              <div className="space-y-6">
                {/* Status */}
                <div className="flex items-center gap-3">
                  <StatusPill status="active" label="Stream Created" />
                  <span className="text-xs text-zinc-500">DJ: {stream.name || djName}</span>
                </div>

                {/* RTMP URL */}
                <div>
                  <span className="block text-[10px] uppercase tracking-widest text-zinc-600 mb-2">RTMP URL</span>
                  <code className="block bg-black border border-zinc-800 p-3 text-xs text-zinc-400 break-all select-all">
                    {stream.fullRtmpUrl}
                  </code>
                </div>

                {/* Stream Key + Playback */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-zinc-800">
                  <div className="bg-black p-4">
                    <span className="block text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Stream Key</span>
                    <code className="block text-xs text-zinc-400 break-all select-all">
                      {stream.streamKey}
                    </code>
                  </div>
                  <div className="bg-black p-4">
                    <span className="block text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Playback ID</span>
                    <code className="block text-xs text-zinc-400 break-all select-all">
                      {stream.playbackId || 'Pending...'}
                    </code>
                  </div>
                </div>

                {/* OBS Settings */}
                <div className="border border-zinc-800 p-4">
                  <span className="block text-[10px] uppercase tracking-widest text-zinc-600 mb-3">OBS Studio Settings</span>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Service</span>
                      <span className="text-zinc-300">Custom</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Server</span>
                      <code className="text-zinc-400">{MUX_RTMP_URL}</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Audio</span>
                      <span className="text-zinc-300">256-320 kbps · AAC · 44.1kHz Stereo</span>
                    </div>
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
