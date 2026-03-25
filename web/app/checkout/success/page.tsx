'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [subscription, setSubscription] = useState<{ plan?: string; nextBilling?: string } | null>(null)

  useEffect(() => {
    if (!sessionId) {
      setStatus('error')
      return
    }

    const verifySession = async () => {
      try {
        const response = await fetch(`/api/checkout/verify?session_id=${sessionId}`)
        if (!response.ok) throw new Error('Verification failed')

        const data = await response.json()
        setSubscription(data)
        setStatus('success')
      } catch (error) {
        console.error('Verification error:', error)
        setStatus('error')
      }
    }

    verifySession()
  }, [sessionId])

  if (status === 'loading') {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center font-mono">
        <div className="text-left space-y-4">
          <div className="w-6 h-6 border border-zinc-600 border-t-white animate-spin mx-auto" />
          <div className="text-sm font-bold uppercase tracking-widest">Deploying Service</div>
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest">This may take 30-60 seconds</p>
        </div>
      </main>
    )
  }

  if (status === 'error') {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center font-mono p-6">
        <div className="max-w-sm w-full space-y-8 text-left">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-6">Error</div>
            <h1 className="text-2xl font-bold tracking-tighter uppercase">
              Verification<br /><span className="text-zinc-700">Failed</span>
            </h1>
            <p className="text-zinc-500 text-xs mt-4">
              We couldn&apos;t verify your subscription. Please contact support.
            </p>
          </div>
          <Link
            href="/pricing"
            className="block w-full py-3 text-left text-xs font-bold uppercase tracking-widest border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
          >
            Back to Pricing
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center font-mono p-6">
      <div className="max-w-sm w-full space-y-8">
        <div className="text-left">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-6">Confirmed</div>
          <h1 className="text-2xl font-bold tracking-tighter uppercase">
            Welcome to<br /><span className="text-zinc-700">Agentbot</span>
          </h1>
        </div>

        <div className="border border-zinc-900 p-6 space-y-4">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Subscription Details</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-1">Plan</span>
              <span className="text-sm font-bold uppercase tracking-wider">{subscription?.plan || 'Loading...'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-1">Status</span>
              <span className="text-sm font-bold uppercase tracking-wider text-white">Active</span>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-1">Next Billing</span>
              <span className="text-sm font-bold uppercase tracking-wider">
                {subscription?.nextBilling ? new Date(subscription.nextBilling).toLocaleDateString() : 'Loading...'}
              </span>
            </div>
          </div>
        </div>

        <div className="border border-zinc-900 p-4">
          <p className="text-xs text-zinc-500">
            Your service is being deployed. You&apos;ll receive an email with your dashboard link shortly.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="block w-full py-3 text-left text-xs font-bold uppercase tracking-widest bg-white text-black hover:bg-zinc-200 transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="block w-full py-3 text-left text-xs font-bold uppercase tracking-widest border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
          >
            Back to Home
          </Link>
        </div>

        <p className="text-left text-zinc-700 text-[10px] uppercase tracking-widest">
          Need help? support@agentbot.raveculture.xyz
        </p>
      </div>
    </main>
  )
}

function CheckoutSuccessFallback() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center font-mono">
      <div className="text-left space-y-4">
        <div className="w-6 h-6 border border-zinc-600 border-t-white animate-spin mx-auto" />
        <div className="text-sm font-bold uppercase tracking-widest">Deploying Service</div>
        <p className="text-[10px] text-zinc-600 uppercase tracking-widest">This may take 30-60 seconds</p>
      </div>
    </main>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<CheckoutSuccessFallback />}>
      <CheckoutSuccessContent />
    </Suspense>
  )
}
