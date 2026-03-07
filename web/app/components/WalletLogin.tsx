'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { SiweMessage } from 'siwe'
import OnchainWallet from '@/app/components/OnchainWallet'
import { useAccount } from 'wagmi'

export default function WalletLogin() {
  const { address, isConnected } = useAccount()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loginWithWallet = async () => {
    if (!address) {
      setError('Please connect your wallet first')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Create SIWE message
      const domain = window.location.host
      const statement = 'Sign in to Agentbot with your wallet'
      
      const message = new SiweMessage({
        domain,
        address,
        statement,
        uri: window.location.origin,
        version: '1',
        chainId: 8453, // Base mainnet
      })

      // Request signature from wallet
      const signature = await window.ethereum?.request({
        method: 'personal_sign',
        params: [
          message.prepareMessage(),
          address
        ],
      })

      if (!signature) {
        throw new Error('Signature denied')
      }

      // Sign in with NextAuth
      const result = await signIn('credentials', {
        message: message.prepareMessage(),
        signature,
        redirect: false,
      })

      if (result?.error) {
        setError('Login failed. Please try again.')
      } else {
        window.location.href = '/dashboard'
      }
    } catch (err: any) {
      console.error('Wallet login error:', err)
      setError(err.message || 'Failed to sign in with wallet')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {!isConnected ? (
        <div className="text-center">
          <p className="text-gray-400 mb-4">
            Connect your wallet to sign in or create an account
          </p>
          <OnchainWallet />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-4">
            <div className="text-sm text-gray-400">Connected wallet</div>
            <div className="font-mono text-sm">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </div>
          </div>

          <button
            onClick={loginWithWallet}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                Signing message...
              </span>
            ) : (
              'Sign In with Wallet'
            )}
          </button>

          <p className="text-xs text-gray-500 text-center">
            You'll sign a message to verify wallet ownership. No transaction needed.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
