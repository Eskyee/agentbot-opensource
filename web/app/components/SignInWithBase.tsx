'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { createBaseAccountSDK } from '@base-org/account'
import { SignInWithBaseButton } from '@base-org/account-ui/react'

const sdk = createBaseAccountSDK({
  appName: 'Agentbot',
  appLogoUrl: 'https://agentbot.raveculture.xyz/logo.png',
})

interface Props {
  onError?: (msg: string) => void
  redirectTo?: string
}

export default function SignInWithBase({ onError, redirectTo = '/dashboard' }: Props) {
  const [loading, setLoading] = useState(false)

  const handleSignIn = async () => {
    setLoading(true)
    try {
      const provider = sdk.getProvider()

      // Generate nonce before popup to avoid popup blockers
      const nonce = window.crypto.randomUUID().replace(/-/g, '')

      // Switch to Base mainnet
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x2105' }],
      }).catch(() => {/* ignore if already on Base */})

      // wallet_connect with SIWE capability — returns address + signed message
      const { accounts } = await provider.request({
        method: 'wallet_connect',
        params: [{
          version: '1',
          capabilities: {
            signInWithEthereum: {
              nonce,
              chainId: '0x2105', // Base Mainnet
            },
          },
        }],
      }) as any

      const { message, signature } = accounts[0].capabilities.signInWithEthereum

      // Pass the SIWE message + signature to NextAuth credentials provider
      const res = await signIn('credentials', {
        message,
        signature,
        redirect: false,
      })

      if (res?.ok) {
        window.location.href = redirectTo
      } else {
        onError?.('Wallet login failed. Please try again.')
      }
    } catch (err: any) {
      if (err?.code !== 4001) {
        // 4001 = user rejected — don't show error
        console.error('Base Account sign in error:', err)
        onError?.(err.message || 'Failed to sign in with Base')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={loading ? 'opacity-70 pointer-events-none' : ''}>
      <SignInWithBaseButton
        colorScheme="light"
        onClick={handleSignIn}
      />
    </div>
  )
}
