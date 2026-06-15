'use client'

import { WagmiProvider } from 'wagmi'
import { ReactNode } from 'react'
import { wagmiConfig } from '@/app/lib/builder-code'

export default function WalletProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      {children}
    </WagmiProvider>
  )
}
