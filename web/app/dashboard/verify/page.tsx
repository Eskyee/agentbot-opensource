'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AgentVerificationPanel } from '@/app/components/VerificationBadge'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'
import { SectionHeader } from '@/app/components/shared/SectionHeader'

interface InstanceData {
  userId: string
  status: string
  verified?: boolean
  verificationType?: string | null
}

function VerifyContent() {
  const searchParams = useSearchParams()
  const [instance, setInstance] = useState<InstanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const urlUserId = searchParams.get('id')

  useEffect(() => {
    const fetchInstance = async () => {
      try {
        const userId = urlUserId || localStorage.getItem('agentbot_user_id')
        if (!userId) return

        const res = await fetch(`/api/instance/${userId}`)
        if (res.ok) {
          const data = await res.json()
          setInstance(data)
        }
      } catch (error) {
        console.error('Failed to fetch instance:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInstance()
  }, [urlUserId])

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-zinc-800 w-1/3"></div>
        <div className="h-64 bg-zinc-900 border border-zinc-800"></div>
      </div>
    )
  }

  const agentId = instance?.userId || urlUserId || ''

  return (
    <>
      {agentId ? (
        <AgentVerificationPanel
          agentId={agentId}
          verified={instance?.verified}
          verificationType={instance?.verificationType}
        />
      ) : (
        <div className="border border-zinc-800 bg-zinc-950 p-6">
          <p className="text-zinc-500 text-xs">
            No agent found. Deploy an agent first to verify it.
          </p>
        </div>
      )}
    </>
  )
}

export default function VerifyPage() {
  const ShieldIcon = () => (
    <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="square" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )

  return (
    <DashboardShell>
      <DashboardHeader
        title="Verify Your Agent"
        icon={<ShieldIcon />}
      />

      <DashboardContent className="max-w-4xl space-y-6">
        <SectionHeader
          label="Identity"
          title="Onchain Verification"
          description="Link your agent to an onchain identity to prove a real human is behind it."
        />

        <div className="border border-zinc-800 bg-zinc-950 p-6">
          <h2 className="text-sm font-bold tracking-tight uppercase mb-4">Why verify?</h2>
          <div className="space-y-px bg-zinc-800">
            {[
              { label: 'Trust', desc: 'Users know a real person runs this agent' },
              { label: 'Reputation', desc: 'Build onchain reputation that travels with you' },
              { label: 'Stand out', desc: 'Verified agents get a special badge in chats' },
            ].map((item) => (
              <div key={item.label} className="bg-zinc-950 p-4 flex items-start gap-3">
                <div className="w-1 h-1 bg-blue-400 mt-1.5 flex-shrink-0" />
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider">{item.label}</span>
                  <span className="text-xs text-zinc-500 ml-2">— {item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Suspense fallback={
          <div className="animate-pulse">
            <div className="h-8 bg-zinc-800 w-1/3 mb-8"></div>
            <div className="h-64 bg-zinc-900 border border-zinc-800"></div>
          </div>
        }>
          <VerifyContent />
        </Suspense>

        <div className="pt-4">
          <a href="/dashboard" className="text-[10px] text-zinc-500 hover:text-white uppercase tracking-widest font-bold">
            ← Back to Dashboard
          </a>
        </div>
      </DashboardContent>
    </DashboardShell>
  )
}
