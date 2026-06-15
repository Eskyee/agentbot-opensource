'use client'

import dynamic from 'next/dynamic'

const WalletProvider = dynamic(() => import('@/app/components/WalletProvider'), {
  ssr: false,
})
const DigitalWristband = dynamic(() => import('@/app/components/DigitalWristband'), {
  ssr: false,
})

export function WristbandWalletModule() {
  return (
    <WalletProvider>
      <DigitalWristband />
    </WalletProvider>
  )
}
