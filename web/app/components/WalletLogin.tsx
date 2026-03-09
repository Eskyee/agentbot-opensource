'use client'

import SignInWithBase from '@/app/components/SignInWithBase'

export default function WalletLogin() {
  return (
    <div className="space-y-4">
      <p className="text-gray-400 text-center text-sm">
        Connect your Base Account to sign in or create an account
      </p>
      <div className="flex justify-center">
        <SignInWithBase />
      </div>
      <p className="text-xs text-gray-500 text-center">
        Uses your passkey — no password or seed phrase needed.
      </p>
    </div>
  )
}
