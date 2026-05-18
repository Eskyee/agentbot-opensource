import type { Metadata } from 'next'
import { Suspense } from 'react'
import HeadlinerInviteClient from './HeadlinerInviteClient'

export const metadata: Metadata = {
  title: 'baseFM Headliner Invite | Agentbot',
  description: 'Redeem a baseFM headliner invite, then open the Agentbot DJ stream panel for audio-first live sets with optional video.',
}

export default function BasefmHeadlinerPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-black text-white font-mono" />}>
      <HeadlinerInviteClient />
    </Suspense>
  )
}
