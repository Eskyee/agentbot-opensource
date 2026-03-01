'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

// ============================================================================
// Types & Interfaces
// ============================================================================

interface PlanFeature {
  name: string
  included: boolean
  tooltip?: string
}

interface Plan {
  id: string
  name: string
  price: number
  priceId: string
  description: string
  features: PlanFeature[]
  popular?: boolean
  cta: string
  resources: {
    ram: string
    cpu: number
  }
}

interface CheckoutState {
  loading: boolean
  error: string | null
  planId: string | null
}

// ============================================================================
// Design Tokens (matching globals.css & tailwind.config.js)
// ============================================================================

const DESIGN_TOKENS = {
  colors: {
    background: { 1: '#000000', 2: '#0a0a0a' },
    gray: { 1: '#111111', 2: '#1a1a1a', 3: '#262626', 4: '#333333', 5: '#404040', 6: '#525252', 7: '#a3a3a3', 8: '#d4d4d4', 9: '#e5e5e5', 10: '#fafafa' },
    foreground: { DEFAULT: '#fafafa', subtle: '#a3a3a3' },
    accent: { DEFAULT: '#3b82f6', hover: '#2563eb' },
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  borderRadius: { sm: '6px', md: '8px', lg: '12px' },
  transitions: { default: '200ms ease', slow: '300ms ease' },
  breakpoints: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px' },
} as const

// ============================================================================
// Plan Data (synced with API route)
// ============================================================================

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 19,
    priceId: 'starter',
    description: '1 AI Agent, 10GB storage, Telegram channel',
    cta: 'Get Started',
    resources: { ram: '2GB', cpu: 1 },
    features: [
      { name: '1 AI Agent', included: true },
      { name: '10GB Storage', included: true },
      { name: 'Telegram Channel', included: true },
      { name: 'Basic Analytics', included: true },
      { name: 'Email Support', included: true },
      { name: 'WhatsApp Integration', included: false },
      { name: 'Custom Domain', included: false },
      { name: 'White-label', included: false },
      { name: '24/7 Support', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 39,
    priceId: 'pro',
    description: '1 AI Agent, 50GB storage, Telegram + WhatsApp, Custom domain, + usage',
    cta: 'Start Free Trial',
    popular: true,
    resources: { ram: '4GB', cpu: 2 },
    features: [
      { name: '1 AI Agent', included: true },
      { name: '50GB Storage', included: true },
      { name: 'Telegram Channel', included: true },
      { name: 'WhatsApp Integration', included: true },
      { name: 'Custom Domain', included: true },
      { name: 'Advanced Analytics', included: true },
      { name: 'Priority Support', included: true },
      { name: 'White-label', included: false },
      { name: '24/7 Support', included: false },
    ],
  },
  {
    id: 'scale',
    name: 'Scale',
    price: 79,
    priceId: 'scale',
    description: '3 AI Agents, 100GB storage, All channels, Advanced analytics',
    cta: 'Scale Up',
    resources: { ram: '8GB', cpu: 4 },
    features: [
      { name: '3 AI Agents', included: true },
      { name: '100GB Storage', included: true },
      { name: 'Telegram Channel', included: true },
      { name: 'WhatsApp Integration', included: true },
      { name: 'Custom Domain', included: true },
      { name: 'Advanced Analytics', included: true },
      { name: 'Priority Support', included: true },
      { name: 'White-label', included: true },
      { name: '24/7 Support', included: false },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 149,
    priceId: 'enterprise',
    description: 'Unlimited agents, 500GB storage, White-label, 24/7 support',
    cta: 'Contact Sales',
    resources: { ram: '16GB', cpu: 4 },
    features: [
      { name: 'Unlimited AI Agents', included: true },
      { name: '500GB Storage', included: true },
      { name: 'Telegram Channel', included: true },
      { name: 'WhatsApp Integration', included: true },
      { name: 'Custom Domain', included: true },
      { name: 'Advanced Analytics', included: true },
      { name: 'Priority Support', included: true },
      { name: 'White-label', included: true },
      { name: '24/7 Support', included: true },
    ],
  },
  {
    id: 'white_glove',
    name: 'White Glove',
    price: 199,
    priceId: 'white_glove',
    description: 'Premium - Everything in Enterprise, 10x resources, Dedicated account manager',
    cta: 'Premium Access',
    resources: { ram: '32GB', cpu: 8 },
    features: [
      { name: 'Unlimited AI Agents', included: true },
      { name: '1TB Storage', included: true },
      { name: 'All Channels', included: true },
      { name: 'Custom Domain', included: true },
      { name: 'Advanced Analytics', included: true },
      { name: 'Dedicated Account Manager', included: true },
      { name: 'White-label', included: true },
      { name: '24/7 Priority Support', included: true },
      { name: '10x Resources', included: true },
    ],
  },
]

// ============================================================================
// Components
// ============================================================================

/**
 * Loading spinner component with accessibility support
 */
function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  return (
    <div
      className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-700 border-t-gray-300`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

/**
 * Feature list item with tooltip support
 */
function FeatureItem({ feature }: { feature: PlanFeature }) {
  return (
    <li
      className={`flex items-center gap-3 text-sm ${
        feature.included ? 'text-gray-300' : 'text-gray-600'
      }`}
      title={feature.tooltip}
    >
      {feature.included ? (
        <svg
          className="w-4 h-4 flex-shrink-0 text-green-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ) : (
        <svg
          className="w-4 h-4 flex-shrink-0 text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      )}
      <span>{feature.name}</span>
    </li>
  )
}

/**
 * Resource badge component
 */
function ResourceBadge({ ram, cpu }: { ram: string; cpu: number }) {
  return (
    <div className="flex gap-2 mt-4">
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-800 text-gray-300 rounded-md">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        {ram} RAM
      </span>
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-800 text-gray-300 rounded-md">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
        {cpu} CPU
      </span>
    </div>
  )
}

/**
 * Individual pricing card component
 */
function PricingCard({
  plan,
  checkoutState,
  onCheckout,
}: {
  plan: Plan
  checkoutState: CheckoutState
  onCheckout: (planId: string) => void
}) {
  const isLoading = checkoutState.loading && checkoutState.planId === plan.id

  return (
    <article
      className={`relative flex flex-col p-6 rounded-xl border transition-all duration-300 ${
        plan.popular
          ? 'border-blue-500 bg-gray-900/50 shadow-lg shadow-blue-500/10'
          : 'border-gray-800 bg-gray-900/30 hover:border-gray-700'
      }`}
      aria-labelledby={`plan-${plan.id}-name`}
    >
      {/* Popular badge */}
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-blue-500 text-white rounded-full">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Most Popular
          </span>
        </div>
      )}

      {/* Plan header */}
      <header className="mb-4">
        <h3
          id={`plan-${plan.id}-name`}
          className="text-xl font-semibold text-gray-100"
        >
          {plan.name}
        </h3>
        <p className="mt-1 text-sm text-gray-400">{plan.description}</p>
      </header>

      {/* Price */}
      <div className="mb-4">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-gray-100">£{plan.price}</span>
          <span className="text-gray-500">/month</span>
        </div>
      </div>

      {/* Resources */}
      <ResourceBadge ram={plan.resources.ram} cpu={plan.resources.cpu} />

      {/* Features list */}
      <ul className="flex-1 mt-6 space-y-3" role="list" aria-label={`${plan.name} features`}>
        {plan.features.map((feature, index) => (
          <FeatureItem key={index} feature={feature} />
        ))}
      </ul>

      {/* CTA Button */}
      <button
        onClick={() => onCheckout(plan.id)}
        disabled={isLoading}
        className={`mt-6 w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
          plan.popular
            ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25'
            : 'bg-gray-800 hover:bg-gray-700 text-gray-100 border border-gray-700'
        } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
        aria-disabled={isLoading}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <LoadingSpinner size="sm" />
            Processing...
          </span>
        ) : (
          plan.cta
        )}
      </button>
    </article>
  )
}

/**
 * Error message component
 */
function ErrorMessage({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div
      className="fixed bottom-4 right-4 max-w-sm p-4 bg-red-500/10 border border-red-500/30 rounded-lg shadow-lg animate-slide-up"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="flex-1">
          <p className="text-sm font-medium text-red-400">Checkout Error</p>
          <p className="mt-1 text-sm text-red-300/80">{message}</p>
        </div>
        <button
          onClick={onDismiss}
          className="text-red-400 hover:text-red-300 transition-colors"
          aria-label="Dismiss error"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

/**
 * Main pricing page component
 */
function PricingPageContent() {
  const searchParams = useSearchParams()
  const [checkoutState, setCheckoutState] = useState<CheckoutState>({
    loading: false,
    error: null,
    planId: null,
  })

  // Handle URL error params
  useEffect(() => {
    const error = searchParams.get('error')
    if (error) {
      const errorMessages: Record<string, string> = {
        invalid_plan: 'Invalid plan selected. Please try again.',
        stripe_not_configured: 'Payment system not configured. Please contact support.',
        checkout_failed: 'Checkout failed. Please try again.',
      }
      setCheckoutState((prev) => ({
        ...prev,
        error: errorMessages[error] || 'An error occurred. Please try again.',
      }))
    }
  }, [searchParams])

  const handleCheckout = async (planId: string) => {
    setCheckoutState({ loading: true, error: null, planId })

    try {
      const response = await fetch(`/api/stripe/checkout?plan=${planId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create checkout session')
      }

      const data = await response.json()
      
      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      setCheckoutState({
        loading: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        planId: null,
      })
    }
  }

  const dismissError = () => {
    setCheckoutState((prev) => ({ ...prev, error: null }))
  }

  return (
    <main className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-24">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-transparent" />
        
        {/* Animated grid pattern */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
          aria-hidden="true"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page header */}
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-100 tracking-tight animate-fade-in">
              Simple, transparent pricing
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-gray-400 animate-fade-in-up">
              Choose the perfect plan for your needs. All plans include a 14-day free trial.
            </p>
          </div>

          {/* Billing toggle */}
          <div className="mt-8 flex justify-center animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <div className="inline-flex items-center gap-3 p-1 bg-gray-900 rounded-lg border border-gray-800">
              <button
                className="px-4 py-2 text-sm font-medium text-gray-100 bg-gray-800 rounded-md transition-colors"
                aria-pressed="true"
              >
                Monthly
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-300 transition-colors"
                aria-pressed="false"
                disabled
              >
                Yearly <span className="ml-1 text-green-400">-20%</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Grid */}
      <section className="relative pb-20 sm:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6"
            role="list"
            aria-label="Pricing plans"
          >
            {PLANS.map((plan, index) => (
              <div
                key={plan.id}
                role="listitem"
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <PricingCard
                  plan={plan}
                  checkoutState={checkoutState}
                  onCheckout={handleCheckout}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative py-16 border-t border-gray-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-100 text-center mb-12">
            Frequently Asked Questions
          </h2>
          
          <dl className="space-y-6">
            {[
              {
                question: 'Can I change plans later?',
                answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately and billing is prorated.',
              },
              {
                question: 'What payment methods do you accept?',
                answer: 'We accept all major credit cards, debit cards, and PayPal through our secure Stripe payment processing.',
              },
              {
                question: 'Is there a free trial?',
                answer: 'Yes! All plans include a 14-day free trial. No credit card required to start.',
              },
              {
                question: 'What happens if I exceed my plan limits?',
                answer: 'We\'ll notify you when you\'re approaching your limits. You can upgrade your plan or pay for additional usage.',
              },
              {
                question: 'Can I cancel my subscription?',
                answer: 'Yes, you can cancel anytime from your dashboard. You\'ll continue to have access until the end of your billing period.',
              },
            ].map((faq, index) => (
              <div key={index} className="bg-gray-900/30 rounded-lg p-6">
                <dt className="text-lg font-medium text-gray-100">{faq.question}</dt>
                <dd className="mt-2 text-gray-400">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 bg-gradient-to-b from-transparent to-blue-500/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-100 mb-4">
            Ready to get started?
          </h2>
          <p className="text-lg text-gray-400 mb-8">
            Join thousands of users building AI agents with Agentbot.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
            >
              Start Free Trial
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              View Documentation
            </Link>
          </div>
        </div>
      </section>

      {/* Error Toast */}
      {checkoutState.error && (
        <ErrorMessage message={checkoutState.error} onDismiss={dismissError} />
      )}
    </main>
  )
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <PricingPageContent />
    </Suspense>
  )
}
