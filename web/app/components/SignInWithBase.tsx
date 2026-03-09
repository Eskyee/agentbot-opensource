'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { signIn } from 'next-auth/react'

// Disable SSR — @base-org/account-ui uses Preact internals that crash during prerender
const SignInWithBaseButton = dynamic(
  () => import('@base-org/account-ui/react').then((m) => m.SignInWithBaseButton),
  { ssr: false }
)

// Allowed redirect destinations — prevents open redirect
const ALLOWED_REDIRECTS = ['/dashboard', '/onboard']

interface Props {
  onError?: (msg: string) => void
  redirectTo?: string
}

export default function SignInWithBase({ onError, redirectTo = '/dashboard' }: Props) {
  const [loading, setLoading] = useState(false)

  // Validate redirect destination against whitelist
  const safeRedirect = ALLOWED_REDIRECTS.includes(redirectTo) ? redirectTo : '/dashboard'

  const handleSignIn = async () => {
    setLoading(true)
    try {
      // Lazy-init SDK inside handler — avoids module-level browser API access during SSR
      const { createBaseAccountSDK } = await import('@base-org/account')
      const provider = createBaseAccountSDK({
        appName: 'Agentbot',
        appLogoUrl: 'https://agentbot.raveculture.xyz/logo.png',
      }).getProvider()

      // Generate nonce before popup opens (avoids popup blockers)
      const nonce = window.crypto.randomUUID().replace(/-/g, '')

      // Switch to Base mainnet
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x2105' }],
      }).catch(() => {/* already on Base — ignore */})

      // wallet_connect with SIWE capability → returns address + signed SIWE message
      const response = await provider.request({
        method: 'wallet_connect',
        params: [{
          version: '1',
          capabilities: {
            signInWithEthereum: {
              nonce,
              chainId: '0x2105',
            },
          },
        }],
      }) as any

      // Validate response structure before destructuring
      const siwe = response?.accounts?.[0]?.capabilities?.signInWithEthereum
      if (!siwe?.message || !siwe?.signature) {
        throw new Error('Invalid response from Base Account SDK')
      }

      const { message, signature } = siwe

      // Hand off to the 'wallet' NextAuth credentials provider (SIWE backend verifies with viem)
      const res = await signIn('wallet', {
        message,
        signature,
        redirect: false,
      })

      if (res?.ok) {
        window.location.href = safeRedirect
      } else {
        onError?.('Wallet login failed. Please try again.')
      }
    } catch (err: unknown) {
      const e = err as { code?: number; message?: string }
      if (e?.code !== 4001) {
        // 4001 = user rejected — don't show error for that
        console.error('Base Account sign in error:', err)
        onError?.(e.message || 'Failed to sign in with Base')
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
