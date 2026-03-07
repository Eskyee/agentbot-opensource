'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState<string>('')
  const [error, setError] = useState<string>('')
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    if (!sessionId) {
      setError('Missing payment session')
      router.push('/pricing?error=missing_session')
      return
    }

    const verify = async () => {
      try {
        const res = await fetch(`/api/stripe/verify-session?session_id=${sessionId}`)
        if (res.ok) {
          const data = await res.json()
          setPlan(data.plan)
          setLoading(false)
        } else {
          setError('Payment verification failed')
          setTimeout(() => router.push('/pricing?error=verification_failed'), 2000)
        }
      } catch (err) {
        setError('Error verifying payment')
        setTimeout(() => router.push('/pricing?error=verification_error'), 2000)
      }
    }

    verify()
  }, [sessionId, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-gray-700 border-t-blue-500 animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Verifying your payment...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-900 rounded-lg border border-red-500/30 p-8 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-red-400 mb-2">Verification Failed</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link
            href="/pricing"
            className="inline-block px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-100 font-medium rounded-lg transition-colors"
          >
            Back to Pricing
          </Link>
        </div>
      </div>
    )
  }

  const planNames: Record<string, string> = {
    'starter': 'Starter',
    'pro': 'Pro',
    'scale': 'Scale',
    'enterprise': 'Enterprise',
    'white_glove': 'White Glove'
  }

  const planPrices: Record<string, string> = {
    'starter': '£19/month',
    'pro': '£39/month',
    'scale': '£79/month',
    'enterprise': '£149/month',
    'white_glove': '£199/month'
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900 rounded-lg border border-gray-800 p-8 text-center shadow-lg shadow-blue-500/10">
        {/* Success Icon */}
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-100 mb-2">Payment Confirmed!</h1>

        {/* Plan Info */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-6 border border-gray-700">
          <p className="text-gray-400 text-sm mb-1">Your plan:</p>
          <p className="text-xl font-semibold text-blue-400">{planNames[plan] || plan} Plan</p>
          <p className="text-gray-500 text-sm mt-1">{planPrices[plan]}</p>
        </div>

        {/* Message */}
        <div className="mb-6">
          <p className="text-gray-300 mb-2">
            Thank you for upgrading! Your service is being set up.
          </p>
          <p className="text-sm text-gray-500">
            Deployment typically takes 30-60 seconds. You'll be notified when ready.
          </p>
        </div>

        {/* CTA */}
        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="block px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/pricing"
            className="block px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-100 font-medium rounded-lg transition-colors"
          >
            View All Plans
          </Link>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-600 mt-6">
          Session ID: {sessionId?.substring(0, 16)}...
        </p>
      </div>
    </main>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <CheckoutSuccessContent />
    </Suspense>
  )
}
