'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function InvitePageContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const name = searchParams.get('name')
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'used'>('loading')
  const [plan, setPlan] = useState('solo')

  useEffect(() => {
    if (!token) {
      setStatus('invalid')
      return
    }

    fetch('/api/invites/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.valid) {
          setStatus('valid')
          setPlan(data.plan || 'solo')
        } else if (data.error?.includes('used')) {
          setStatus('used')
        } else {
          setStatus('invalid')
        }
      })
      .catch(() => setStatus('invalid'))
  }, [token])

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-6">🦞</div>
        <h1 className="text-3xl font-bold tracking-tighter uppercase mb-4">You&apos;re Invited</h1>

        {status === 'loading' && (
          <p className="text-zinc-400">Verifying your invite...</p>
        )}

        {status === 'valid' && (
          <>
            {name && (
              <p className="text-zinc-400 mb-2">
                <span className="text-white font-medium">{name}</span> invited you to join Agentbot
              </p>
            )}
            <p className="text-zinc-500 text-sm mb-8">
              Plan: <span className="text-white uppercase tracking-widest font-bold">{plan}</span>
            </p>
            <Link
              href="/onboard"
              className="bg-white text-black px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors inline-block"
            >
              Get Started
            </Link>
          </>
        )}

        {status === 'used' && (
          <>
            <p className="text-zinc-400 mb-8">This invite has already been used.</p>
            <Link
              href="/login"
              className="border border-zinc-800 text-zinc-400 px-8 py-4 text-xs font-bold uppercase tracking-widest hover:text-white hover:border-zinc-600 transition-colors inline-block"
            >
              Sign In
            </Link>
          </>
        )}

        {status === 'invalid' && (
          <>
            <p className="text-zinc-400 mb-8">This invite link is invalid or has expired.</p>
            <Link
              href="/onboard"
              className="bg-white text-black px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors inline-block"
            >
              Sign Up Instead
            </Link>
          </>
        )}

        <p className="text-zinc-600 text-xs mt-12">agentbot.raveculture.xyz</p>
      </div>
    </div>
  )
}

export default function InvitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
      <InvitePageContent />
    </Suspense>
  )
}
