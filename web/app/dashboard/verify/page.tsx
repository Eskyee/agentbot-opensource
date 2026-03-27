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
import { ExternalLink } from 'lucide-react'

interface InstanceData {
  userId: string
  status: string
  verified?: boolean
  verificationType?: string | null
  agentId?: string
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
        if (!userId) {
          setLoading(false)
          return
        }

        const res = await fetch(`/api/instance/${userId}`)
        if (res.ok) {
          const data = await res.json()
          setInstance(data)
        } else {
          // Instance may not exist yet — still allow verification UI
          setInstance({ userId, status: 'pending' })
        }
      } catch (error) {
        console.error('Failed to fetch instance:', error)
        const userId = urlUserId || localStorage.getItem('agentbot_user_id')
        if (userId) setInstance({ userId, status: 'unknown' })
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

  const agentId = instance?.agentId || instance?.userId || urlUserId || ''

  if (!agentId) {
    return (
      <div className="border border-zinc-800 bg-zinc-950 p-6">
        <p className="text-zinc-500 text-xs mb-4">
          No agent found. Deploy an agent first to verify it.
        </p>
        <a
          href="/dashboard"
          className="text-[10px] text-brand-400 hover:text-brand-300 uppercase tracking-widest font-bold"
        >
          ← Deploy an agent
        </a>
      </div>
    )
  }

  return (
    <AgentVerificationPanel
      agentId={agentId}
      verified={instance?.verified}
      verificationType={instance?.verificationType}
    />
  )
}

export default function VerifyPage() {
  const ShieldIcon = () => (
    <svg className="h-5 w-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="square" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )

  return (
    <DashboardShell>
      <DashboardHeader
        title="Verify Agent"
        icon={<ShieldIcon />}
        action={
          <a
            href="https://selfclaw.ai/verify"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-400 hover:text-brand-300 border border-zinc-700 hover:border-brand-500 px-3 py-1.5 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            <span className="hidden sm:inline">selfclaw.ai/verify</span>
            <span className="sm:hidden">selfclaw</span>
          </a>
        }
      />

      <DashboardContent className="max-w-2xl space-y-6">
        <SectionHeader
          label="Identity"
          title="Onchain Verification"
          description="Link your agent to an onchain identity to prove a real human is behind it."
        />

        {/* Why verify */}
        <div className="border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
          <h2 className="text-sm font-bold tracking-tight uppercase mb-4">Why verify?</h2>
          <div className="space-y-px bg-zinc-800">
            {[
              { label: 'Trust', desc: 'Users know a real person runs this agent' },
              { label: 'Reputation', desc: 'Build onchain reputation that travels with you' },
              { label: 'Stand out', desc: 'Verified agents get a special badge in chats' },
            ].map((item) => (
              <div key={item.label} className="bg-zinc-950 p-3 sm:p-4 flex items-start gap-3">
                <div className="w-1 h-1 bg-brand-400 mt-1.5 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-bold uppercase tracking-wider">{item.label}</span>
                  <span className="text-xs text-zinc-500 ml-2">— {item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Suspense fallback={
          <div className="animate-pulse">
            <div className="h-8 bg-zinc-800 w-1/3 mb-4"></div>
            <div className="h-64 bg-zinc-900 border border-zinc-800"></div>
          </div>
        }>
          <VerifyContent />
        </Suspense>

        <div className="pt-2">
          <a href="/dashboard" className="text-[10px] text-zinc-500 hover:text-white uppercase tracking-widest font-bold">
            ← Back to Dashboard
          </a>
        </div>
      </DashboardContent>
    </DashboardShell>
  )
}
