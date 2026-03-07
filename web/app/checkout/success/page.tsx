'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [subscription, setSubscription] = useState<any>(null)

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
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Setting up your service...</p>
          <p className="text-gray-400 mt-2">This may take 30-60 seconds</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-3xl font-bold mb-4">Verification Failed</h1>
          <p className="text-gray-400 mb-8">
            We couldn't verify your subscription. Please contact support.
          </p>
          <Link
            href="/pricing"
            className="inline-block bg-white text-black px-6 py-2 rounded-lg font-bold hover:bg-gray-200"
          >
            Back to Pricing
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-3xl font-bold mb-4">Welcome to AgentBot!</h1>
        
        <div className="bg-gray-900 rounded-lg p-6 mb-8 text-left">
          <h2 className="text-lg font-bold mb-4">Your Setup Details</h2>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-gray-400">Plan:</span>{' '}
              <span className="font-bold">{subscription?.plan || 'Loading...'}</span>
            </p>
            <p>
              <span className="text-gray-400">Status:</span>{' '}
              <span className="font-bold text-green-400">Active</span>
            </p>
            <p>
              <span className="text-gray-400">Next Billing:</span>{' '}
              <span className="font-bold">
                {subscription?.nextBilling ? new Date(subscription.nextBilling).toLocaleDateString() : 'Loading...'}
              </span>
            </p>
          </div>
        </div>

        <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-4 mb-8">
          <p className="text-sm text-blue-300">
            Your service is being deployed. You'll receive an email with your dashboard link shortly.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="block w-full bg-white text-black px-6 py-3 rounded-lg font-bold hover:bg-gray-200 transition"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="block w-full bg-gray-800 text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-700 transition"
          >
            Back to Home
          </Link>
        </div>

        <p className="text-gray-500 text-sm mt-8">
          Need help? Contact support@agentbot.raveculture.xyz
        </p>
      </div>
    </div>
  )
}

function CheckoutSuccessFallback() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-xl">Setting up your service...</p>
        <p className="text-gray-400 mt-2">This may take 30-60 seconds</p>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<CheckoutSuccessFallback />}>
      <CheckoutSuccessContent />
    </Suspense>
  )
}
