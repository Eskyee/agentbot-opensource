'use client'

import { useState, useEffect, useRef } from 'react'
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
  // Pre-generate nonce on mount so it's ready before the button click.
  // This avoids popup blockers — any async work between click and wallet_connect
  // popup causes browsers to classify the popup as unsolicited.
  const nonceRef = useRef<string>('')

  useEffect(() => {
    nonceRef.current = window.crypto.randomUUID().replace(/-/g, '')
  }, [])

  const safeRedirect = ALLOWED_REDIRECTS.includes(redirectTo) ? redirectTo : '/dashboard'

  const handleSignIn = async () => {
    setLoading(true)
    try {
      // Lazy-init SDK — still inside handler to avoid SSR issues,
      // but SDK init is synchronous so it doesn't delay the popup
      const { createBaseAccountSDK } = await import('@base-org/account')
      const provider = createBaseAccountSDK({
        appName: 'Agentbot',
        appLogoUrl: 'https://agentbot.raveculture.xyz/logo.png',
      }).getProvider()

      const nonce = nonceRef.current
      if (!nonce) throw new Error('Nonce not ready — please try again')

      // wallet_connect opens the Base Account popup immediately after click.
      // Chain switching is handled by the SDK via the chainId capability param.
      // Do NOT do any async work (network calls, wallet_switchEthereumChain) here
      // — browsers block popups opened after async gaps in user gesture handlers.
      const response = await provider.request({
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

      // Validate response structure before destructuring
      const siwe = response?.accounts?.[0]?.capabilities?.signInWithEthereum
      if (!siwe?.message || !siwe?.signature) {
        throw new Error('Invalid response from Base Account SDK')
      }

      const { message, signature } = siwe

      // Hand off to the 'wallet' NextAuth credentials provider
      const res = await signIn('wallet', {
        message,
        signature,
        redirect: false,
      })

      if (res?.ok) {
        window.location.href = safeRedirect
      } else {
        // Rotate nonce for next attempt
        nonceRef.current = window.crypto.randomUUID().replace(/-/g, '')
        onError?.('Wallet login failed. Please try again.')
      }
    } catch (err: unknown) {
      // Rotate nonce so the next attempt uses a fresh one
      nonceRef.current = window.crypto.randomUUID().replace(/-/g, '')
      const e = err as { code?: number; message?: string }
      if (e?.code !== 4001) {
        // 4001 = user rejected — don't surface an error for that
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
