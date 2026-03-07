'use client'

import { useState, useEffect } from 'react'
import { OnchainKitProvider, ConnectWallet, Wallet, WalletDropdown, Identity, Name, Address, useAccount } from '@coinbase/onchainkit/wallet'
import { WagmiProvider, createConfig, http, useConnect, useDisconnect } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { base } from 'viem/chains'

const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
})

const queryClient = new QueryClient()

const RAVE_TOKEN_ADDRESS = '0xdf3c79a5759eeedb844e7481309a75037b8e86f5'
const RAVE_THRESHOLD = BigInt('5000000000000000000000')
const MUX_RTMP_URL = 'rtmp://global-live.mux.com:5222/app'

function DJStreamContent() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const [raveBalance, setRaveBalance] = useState<string | null>(null)
  const [stream, setStream] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [djName, setDjName] = useState('DJ Escaba')

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

  const handleConnect = () => {
    if (connectors[0]) {
      connect({ connector: connectors[0] })
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
  const formatAddress = (addr: string) => addr.slice(0, 6) + '...' + addr.slice(-4)

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🎛️ DJ Stream Dashboard</h1>

        <div className="grid gap-6">
          {/* Wallet Connection */}
          <div className="bg-gray-800 p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-4">1. Connect Wallet</h2>
            
            {!isConnected ? (
              <button
                onClick={handleConnect}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
              >
                <span>🔵</span> Connect Wallet (Coinbase)
              </button>
            ) : (
              <div className="flex items-center gap-4">
                <div className="bg-green-600 px-4 py-2 rounded-lg">
                  <span className="text-sm text-gray-300">Connected:</span>
                  <span className="ml-2 font-mono">{formatAddress(address || '')}</span>
                </div>
                <button
                  onClick={() => { disconnect(); setRaveBalance(null); setStream(null) }}
                  className="text-gray-400 hover:text-white"
                >
                  Disconnect
                </button>
              </div>
            )}
            
            {error && (
              <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-300">
                {error}
              </div>
            )}
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
              
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">DJ Name</label>
                <input
                  type="text"
                  value={djName}
                  onChange={(e) => setDjName(e.target.value)}
                  placeholder="DJ YourName"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <button
                onClick={createStream}
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-lg py-3 font-semibold"
              >
                {loading ? 'Creating Stream...' : 'Start Streaming'}
              </button>
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
                    DJ: {stream.name || djName}
                  </div>
                </div>

                <div>
                  <div className="text-gray-400 text-sm mb-1">Full RTMP (for OBS/Larix)</div>
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
                    <div><strong>Server:</strong> {MUX_RTMP_URL}</div>
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
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider 
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY || ''}
          chain={base}
        >
          <DJStreamContent />
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}