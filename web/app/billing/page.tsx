'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCustomSession } from '@/app/lib/useCustomSession'
import { useRouter } from 'next/navigation'
import { DashboardSidebar } from '@/app/components/DashboardSidebar'
import { Breadcrumbs } from '@/app/components/Breadcrumbs'

const plans = [
  {
    id: 'solo',
    name: 'Solo',
    specs: '1 Agent · MiMo V2 Pro',
    price: 29,
    period: 'mo',
    features: [
      { label: 'Telegram channel', included: true },
      { label: 'Use your own AI key', included: true },
      { label: 'A2A Bus Access', included: true },
      { label: 'Basic Analytics', included: true },
      { label: 'Priority support', included: false },
      { label: 'White-glove staging', included: false },
    ],
  },
  {
    id: 'collective',
    name: 'Collective',
    specs: '3 Agents · Llama 3.3',
    price: 69,
    period: 'mo',
    popular: true,
    features: [
      { label: 'Everything in Solo', included: true },
      { label: 'Royalty Split Engine', included: true },
      { label: 'Mission Control Graph', included: true },
      { label: 'Telegram + WhatsApp', included: true },
      { label: 'Priority support', included: true },
      { label: 'White-glove staging', included: false },
    ],
  },
  {
    id: 'label',
    name: 'Label',
    specs: 'Unlimited · DeepSeek R1',
    price: 149,
    period: 'mo',
    features: [
      { label: 'Everything in Collective', included: true },
      { label: 'Priority A2A Routing', included: true },
      { label: '24/7 Signal Guard', included: true },
      { label: 'White-glove staging', included: true },
      { label: 'Custom integrations', included: true },
      { label: 'Dedicated account manager', included: true },
    ],
  },
]

export default function BillingPage() {
  const { data: session, status } = useCustomSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentPlan, setCurrentPlan] = useState('solo')
  const [subscriptionStatus, setSubscriptionStatus] = useState('inactive')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?callbackUrl=/billing')
    }
  }, [status, router])

  useEffect(() => {
    const fetchBilling = async () => {
      if (!session?.user?.id) return
      try {
        const res = await fetch('/api/billing')
        if (res.ok) {
          const data = await res.json()
          setCurrentPlan(data.plan || 'solo')
          setSubscriptionStatus(data.subscriptionStatus || 'inactive')
        }
      } catch (err) {
        console.error('Billing fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchBilling()
  }, [session])

  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'User'

  const buyPlan = (priceId: string) => {
    window.location.href = `/api/stripe/checkout?plan=${priceId}`
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-black font-mono">
        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-black">
      <DashboardSidebar
        userName={userName}
        plan={currentPlan}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-zinc-950 border-b border-zinc-900 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="text-sm font-bold uppercase tracking-tighter">☆ Billing</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/dashboard" className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-zinc-400 transition-colors">
              Dashboard
            </a>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <Breadcrumbs />

            {/* Current Plan Card */}
            <div className="mb-8">
              <span className="text-[10px] uppercase tracking-widest text-zinc-600">Current Plan</span>
              <div className="border border-zinc-800 p-6 mt-2">
                {loading ? (
                  <div className="animate-pulse h-20 bg-zinc-900" />
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold uppercase tracking-tighter">
                        {plans.find(p => p.id === currentPlan)?.name || 'Solo'}
                      </h2>
                      <p className="text-zinc-500 text-sm mt-1">
                        {plans.find(p => p.id === currentPlan)?.specs || '1 Agent · Mistral 7B'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold tracking-tighter">
                        £{plans.find(p => p.id === currentPlan)?.price || 29}
                        <span className="text-lg text-zinc-500">/mo</span>
                      </div>
                      <span className={`text-[10px] uppercase tracking-widest px-2 py-1 ${
                        subscriptionStatus === 'active'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {subscriptionStatus === 'active' ? 'Active' : 'Unpaid'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Plan Features */}
            <div className="mb-8">
              <span className="text-[10px] uppercase tracking-widest text-zinc-600">Your Features</span>
              <div className="border border-zinc-800 divide-y divide-zinc-800 mt-2">
                {(plans.find(p => p.id === currentPlan)?.features || plans[0].features).map((f, i) => (
                  <div key={i} className="p-4 flex items-center justify-between">
                    <span className="text-sm text-zinc-300">{f.label}</span>
                    <span className={`text-xs ${f.included ? 'text-emerald-400' : 'text-zinc-600'}`}>
                      {f.included ? '✓ Included' : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="mb-8">
              <span className="text-[10px] uppercase tracking-widest text-zinc-600">Payment Methods</span>
              <div className="grid gap-4 md:grid-cols-1 sm:grid-cols-2 mt-2">
                <div className="border border-zinc-800 p-4">
                  <div className="text-sm font-bold mb-1">Stripe</div>
                  <p className="text-zinc-500 text-xs mb-3">Pay with card. Instant activation.</p>
                  <a
                    href="/api/stripe/checkout?plan=solo"
                    className="block w-full text-left bg-white text-black px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
                  >
                    Pay with Card
                  </a>
                </div>
                <div className="border border-zinc-800 p-4">
                  <div className="text-sm font-bold mb-1">Tempo Wallet</div>
                  <p className="text-zinc-500 text-xs mb-3">Pay with USDC. On-chain settlement.</p>
                  <a
                    href="/dashboard/wallet"
                    className="block w-full text-left border border-zinc-700 px-4 py-2 text-xs font-bold uppercase tracking-widest hover:border-zinc-500 transition-colors"
                  >
                    Open Wallet
                  </a>
                </div>
              </div>
            </div>

            {/* Upgrade Plans */}
            <div>
              <span className="text-[10px] uppercase tracking-widest text-zinc-600">Upgrade</span>
              <div className="grid gap-4 md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-2">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`border p-6 ${
                      plan.popular ? 'border-white' : 'border-zinc-800'
                    }`}
                  >
                    {plan.popular && (
                      <span className="text-[9px] uppercase tracking-widest text-white bg-white/10 px-2 py-0.5 mb-3 inline-block">
                        Popular
                      </span>
                    )}
                    <h3 className="text-lg font-bold uppercase tracking-tighter">{plan.name}</h3>
                    <p className="text-zinc-500 text-xs mt-1">{plan.specs}</p>
                    <div className="text-2xl font-bold tracking-tighter mt-3">
                      £{plan.price}<span className="text-sm text-zinc-500">/mo</span>
                    </div>
                    <ul className="mt-4 space-y-2">
                      {plan.features.filter(f => f.included).map((f, i) => (
                        <li key={i} className="text-xs text-zinc-400 flex items-center gap-2">
                          <span className="text-emerald-400">✓</span> {f.label}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => buyPlan(plan.id)}
                      disabled={currentPlan === plan.id && subscriptionStatus === 'active'}
                      className={`w-full mt-4 px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
                        currentPlan === plan.id && subscriptionStatus === 'active'
                          ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                          : plan.popular
                          ? 'bg-white text-black hover:bg-zinc-200'
                          : 'border border-zinc-700 hover:border-zinc-500'
                      }`}
                    >
                      {currentPlan === plan.id && subscriptionStatus === 'active' ? 'Current Plan' : 'Upgrade'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
