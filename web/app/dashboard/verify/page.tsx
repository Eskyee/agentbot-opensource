'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AgentVerificationPanel } from '@/app/components/VerificationBadge'

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
      <div className="animate-pulse">
        <div className="h-8 bg-gray-800 rounded w-1/3 mb-8"></div>
        <div className="h-64 bg-gray-900 rounded-xl"></div>
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
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
          <p className="text-gray-400">
            No agent found. Deploy an agent first to verify it.
          </p>
        </div>
      )}
    </>
  )
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Verify Your Agent</h1>
          <p className="text-gray-400">
            Link your agent to an onchain identity to prove a real human is behind it.
          </p>
        </div>

        <div className="mb-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
          <h2 className="text-lg font-semibold mb-2 text-blue-400">Why verify?</h2>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>• <strong>Trust</strong> - Users know a real person runs this agent</li>
            <li>• <strong>Reputation</strong> - Build onchain reputation that travels with you</li>
            <li>• <strong>Stand out</strong> - Verified agents get a special badge in chats</li>
          </ul>
        </div>

        <Suspense fallback={
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800 rounded w-1/3 mb-8"></div>
            <div className="h-64 bg-gray-900 rounded-xl"></div>
          </div>
        }>
          <VerifyContent />
        </Suspense>

        <div className="mt-8 text-center">
          <a href="/dashboard" className="text-blue-400 hover:text-blue-300">
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
