'use client'

import { BaseWalletLink } from '@/app/components/BaseWalletLink'

export function WalletTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white">Base Wallet</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Link your Base wallet once to confirm ownership. It&apos;s then used everywhere —
          DJ streaming, receive addresses, top-ups, and transfers — without asking you to
          connect again.
        </p>
      </div>
      <div className="max-w-xl">
        <BaseWalletLink callbackUrl="/settings?tab=wallet" />
      </div>
    </div>
  )
}
