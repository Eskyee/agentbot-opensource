export const dynamic = "force-dynamic"
'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function JoinContent() {
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')

    try {
      // Verify invite code
      const verifyRes = await fetch('/api/invites/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })

      if (!verifyRes.ok) {
        throw new Error('Invalid or expired invite code')
      }

      // Create account with invite
      const signupRes = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, inviteCode: code }),
      })

      if (!signupRes.ok) {
        throw new Error('Failed to create account')
      }

      setStatus('success')
      setMessage('Account created! Redirecting to dashboard...')
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 2000)
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'An error occurred')
    }
  }

  if (!code) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Join AgentBot</h1>
          <p className="text-gray-400 mb-8">Invalid or missing invite code</p>
          <p className="text-sm text-gray-500">
            Contact support for access: support@agentbot.raveculture.xyz
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-900 rounded-lg p-8 border border-gray-700">
          <h1 className="text-3xl font-bold mb-2">Join AgentBot</h1>
          <p className="text-gray-400 mb-8">You've been invited to join our private platform</p>

          {status === 'success' ? (
            <div className="bg-green-900/20 border border-green-500 rounded-lg p-4">
              <p className="text-green-300">{message}</p>
            </div>
          ) : status === 'error' ? (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
              <p className="text-red-300">{message}</p>
            </div>
          ) : null}

          {status !== 'success' && (
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
                  disabled={status === 'loading'}
                />
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition disabled:opacity-50"
              >
                {status === 'loading' ? 'Creating account...' : 'Join AgentBot'}
              </button>
            </form>
          )}

          <p className="text-xs text-gray-600 text-center mt-6">
            This is a private platform. Access requires an invitation.
          </p>
        </div>
      </div>
    </div>
  )
}

function JoinFallback() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-xl">Loading...</p>
      </div>
    </div>
  )
}

export default function JoinPage() {
  return (
    <Suspense fallback={<JoinFallback />}>
      <JoinContent />
    </Suspense>
  )
}
