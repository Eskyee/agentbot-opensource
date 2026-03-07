'use client'

import { useState, useEffect } from 'react'
import { OnchainKitProvider, ConnectWallet, Wallet, WalletDropdown, WalletDropdownDisconnect, useAccount } from '@coinbase/onchainkit/wallet'
import { Identity, Address, EthBalance, Name } from '@coinbase/onchainkit/identity'
import { base } from 'viem/chains'
import { createConfig, http, useAccount as useWagmiAccount, useBalance } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Link from 'next/link'

const wagmiConfig = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
})

const queryClient = new QueryClient()

const RAVE_TOKEN_ADDRESS = '0xdf3c79a5759eeedb844e7481309a75037b8e86f5'
const RAVE_THRESHOLD = BigInt('5000000000000000000000')

function DJStreamContent() {
  const { address, isConnected } = useWagmiAccount()
  const [raveBalance, setRaveBalance] = useState<string | null>(null)
  const [stream, setStream] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (address) {
      checkRAVEBalance(address)
    }
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
        body: JSON.stringify({ wallet: address, name: '' })
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

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">🎛️ DJ Stream Dashboard</h1>
          <Link href="/dashboard" className="text-purple-400 hover:text-purple-300">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="grid gap-6">
          {/* Wallet Connection */}
          <div className="bg-gray-800 p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-4">1. Connect Wallet</h2>
            <Wallet>
              <ConnectWallet />
              <WalletDropdown>
                <Identity className="px-4 pt-3 pb-2">
                  <Name />
                  <Address />
                  <EthBalance />
                </Identity>
                <WalletDropdownDisconnect />
              </WalletDropdown>
            </Wallet>
          </div>

          {/* RAVE Balance Check */}
          {isConnected && (
            <div className="bg-gray-800 p-6 rounded-xl">
              <h2 className="text-xl font-semibold mb-4">2. Verify RAVE Balance</h2>
              
              {raveBalance ? (
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-2xl">🎵</span>
                    <div>
                      <div className="text-3xl font-bold">
                        {(Number(raveBalance) / 1e18).toLocaleString()} RAVE
                      </div>
                      <div className="text-gray-400 text-sm">
                        Required: 5,000 RAVE
                      </div>
                    </div>
                    {hasAccess ? (
                      <span className="ml-auto bg-green-600 px-4 py-2 rounded-full font-semibold">
                        ✓ Eligible
                      </span>
                    ) : (
                      <span className="ml-auto bg-red-600 px-4 py-2 rounded-full font-semibold">
                        ✗ Need more RAVE
                      </span>
                    )}
                  </div>
                  
                  {!hasAccess && (
                    <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                      <p className="text-gray-300 mb-2">
                        Need 5,000 RAVE tokens to stream for free.
                      </p>
                      <p className="text-gray-400 text-sm">
                        Or pay £10/month via Stripe (coming soon).
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-400">Checking balance...</div>
              )}
            </div>
          )}

          {/* Create Stream */}
          {hasAccess && !stream && (
            <div className="bg-gray-800 p-6 rounded-xl">
              <h2 className="text-xl font-semibold mb-4">3. Create Stream</h2>
              <button
                onClick={createStream}
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-lg py-3 font-semibold"
              >
                {loading ? 'Creating Stream...' : 'Start Streaming'}
              </button>
              {error && (
                <div className="mt-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-300">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Stream Details */}
          {stream && (
            <div className="bg-gray-800 p-6 rounded-xl">
              <h2 className="text-xl font-semibold mb-4">🎉 Stream Ready!</h2>
              
              <div className="space-y-4">
                <div className="p-4 bg-green-900/30 border border-green-500 rounded-lg">
                  <div className="text-green-400 font-semibold mb-2">✓ Stream created successfully</div>
                  <div className="text-sm text-gray-300">
                    Your DJ name: {stream.name || 'Anonymous DJ'}
                  </div>
                </div>

                <div>
                  <div className="text-gray-400 text-sm mb-1">RTMP URL</div>
                  <code className="block bg-black p-3 rounded text-sm break-all">
                    {stream.rtmpUrl}/{stream.streamKey}
                  </code>
                </div>

                <div>
                  <div className="text-gray-400 text-sm mb-1">Full RTMP (for OBS)</div>
                  <code className="block bg-black p-3 rounded text-sm break-all">
                    {stream.fullRtmpUrl}
                  </code>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-gray-400 text-sm mb-1">Playback ID</div>
                    <code className="block bg-black p-2 rounded text-sm">
                      {stream.playbackId || 'Pending...'}
                    </code>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm mb-1">Status</div>
                    <span className="inline-block bg-yellow-600 px-3 py-1 rounded text-sm">
                      {stream.status}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-blue-900/30 border border-blue-500 rounded-lg">
                  <div className="font-semibold mb-2">📺 OBS Studio Settings</div>
                  <div className="text-sm text-gray-300 space-y-1">
                    <div><strong>Service:</strong> Custom</div>
                    <div><strong>Server:</strong> rtmp://global-live.mux.com:5222/app</div>
                    <div><strong>Stream Key:</strong> {stream.streamKey}</div>
                    <div><strong>Audio:</strong> 256-320 kbps, AAC, 44.1kHz Stereo</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DJStreamPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <OnchainKitProvider
        apiKey={process.env.NEXT_PUBLIC_CDP_API_KEY || ''}
        chain={base}
        config={{
          appearance: {
            name: 'Agentbot',
            mode: 'dark',
            theme: 'base',
          },
        }}
      >
        <DJStreamContent />
      </OnchainKitProvider>
    </QueryClientProvider>
  )
}