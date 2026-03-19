'use client'

import { useState } from 'react'
import { useSession, signIn } from 'next-auth/react'

export default function CoinbaseWalletButton() {
  const { data: session, status } = useSession()
  const [showWallet, setShowWallet] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnectWallet = async () => {
    setIsConnecting(true)
    window.open('https://onramp.coinbase.com/', '_blank')
    setIsConnecting(false)
    setShowWallet(false)
  }

  const handlePayWithUSDC = async () => {
    window.open('https://commerce.coinbase.com/pay', '_blank')
  }

  if (status === 'loading') {
    return (
      <button className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-400" disabled>
        Loading...
      </button>
    )
  }

  if (!session) {
    return (
      <button
        onClick={() => signIn('google')}
        className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-gray-200"
      >
        Sign In
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowWallet(!showWallet)}
        className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white hover:from-blue-700 hover:to-purple-700 flex items-center gap-2"
      >
          <svg className="w-4 h-4" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="16" fill="#000000"/>
          <path d="M10 16.5L14 20.5L22 12.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        USDC Wallet
      </button>
      
      {showWallet && (
        <div className="absolute right-0 top-12 z-50 w-72">
          <div className="rounded-xl border border-gray-700 bg-gray-900 p-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-lg">🔗</span>
              </div>
              <div>
                <div className="font-semibold">Coinbase Wallet</div>
                <div className="text-xs text-gray-400">Pay with USDC</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <button
                onClick={handlePayWithUSDC}
                className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white hover:from-blue-700 hover:to-purple-700 flex items-center justify-center gap-2"
              >
                <span>💵</span>
                Pay with USDC
              </button>
              
              <button
                onClick={handleConnectWallet}
                disabled={isConnecting}
                className="w-full rounded-lg border border-gray-600 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800 flex items-center justify-center gap-2"
              >
                <span>🔐</span>
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-xs text-gray-500">
                0% fees on USDC payments via Coinbase Commerce
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
