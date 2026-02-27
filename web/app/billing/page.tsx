'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import CoinbaseWalletButton from '../components/CoinbaseWallet'

const navItems = [
  { icon: '🤖', label: 'Agents', href: '/agents', active: false },
  { icon: '🛒', label: 'Marketplace', href: '/marketplace', active: false },
  { icon: '💳', label: 'Billing', href: '/billing', active: true },
  { icon: '⚙️', label: 'Account', href: '/settings', active: false },
]

function BillingSidebar({ userName, credits = 0 }: { userName: string; credits?: number }) {
  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                item.active 
                  ? 'bg-white/20 text-white' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </div>

        <Link href="/billing" className="block mt-8 p-4 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors">
          <div className="text-sm text-gray-400 mb-1">Your Plan</div>
          <div className="text-xl font-bold">Starter</div>
          <div className="text-xs text-blue-400 mt-2">Manage</div>
        </Link>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-black">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-medium">{userName}</div>
            <div className="text-sm text-blue-400">Sign up</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default function BillingPage() {
  const { data: session } = useSession()
  const [currentPlan, setCurrentPlan] = useState('starter')
  const [loading, setLoading] = useState(true)
  const [credits, setCredits] = useState(0)

  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'Sign in'

  useEffect(() => {
    const fetchBillingData = async () => {
      if (!session?.user?.id) return
      try {
        const res = await fetch(`/api/instance/${session.user.id}`)
        if (res.ok) {
          const data = await res.json()
          setCurrentPlan(data.plan || 'starter')
        }
      } catch (error) {
        console.error('Failed to fetch billing data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchBillingData()
  }, [session])

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      specs: '1 Agent · 1GB · 10GB',
      credits: '£15',
      price: 19,
      priceId: 'starter',
      features: ['Telegram channel', 'Use your own AI key', 'Priority support'],
      popular: true,
    },
    {
      id: 'pro',
      name: 'Pro',
      specs: '1 Agent · 1GB · 50GB',
      credits: '£25',
      price: 39,
      priceId: 'pro',
      features: ['Telegram + WhatsApp', 'Custom domain', 'Priority support', '+ usage'],
    },
    {
      id: 'scale',
      name: 'Scale',
      specs: '3 Agents · 2GB · 100GB',
      credits: '£60',
      price: 79,
      priceId: 'scale',
      features: ['All channels', 'Advanced analytics', 'Dedicated support'],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      specs: 'Unlimited · 4GB · 500GB',
      credits: '£100',
      price: 149,
      priceId: 'enterprise',
      features: ['White-label', '24/7 phone support', 'Custom integrations'],
    },
    {
      id: 'white_glove',
      name: 'White Glove',
      specs: 'Unlimited · 10x · Custom',
      credits: '£150',
      price: 199,
      priceId: 'white_glove',
      features: ['Everything in Enterprise', 'Dedicated account manager', 'Priority support'],
    },
  ]

  const buyPlan = async (priceId: string) => {
    try {
      // Use GET request to Stripe checkout route
      window.location.href = `/api/stripe/checkout?plan=${priceId}`
    } catch (error) {
      console.error('Failed to initiate checkout:', error)
      alert('Failed to start checkout')
    }
  }

  const connectWallet = () => {
    alert('Coinbase Wallet integration coming soon!')
  }

  const contactSales = () => {
    window.location.href = 'mailto:sales@agentbot.com?subject=Custom Infrastructure Inquiry'
  }

  return (
    <div className="flex h-screen bg-black text-white">
      <BillingSidebar userName={userName} credits={credits} />

      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Billing</h1>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : (
          <>
        {/* API Keys */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">AI API Keys</h2>
          <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-2xl">🔑</span>
              </div>
              <div>
                <div className="font-semibold">Bring Your Own API Key</div>
                <div className="text-sm text-gray-400">Pay directly to AI providers - no markup</div>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Users provide their own API keys from OpenRouter, Groq, Anthropic, or OpenAI. 
              You get the best rates directly from the source. No credit system needed.
            </p>
            <a href="/settings" className="rounded-lg bg-white text-black px-6 py-2 font-semibold hover:bg-gray-200 inline-block">
              Configure API Keys
            </a>
          </div>
        </div>

        {/* USDC on Base */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Pay with USDC</h2>
          <div className="rounded-2xl border border-gray-800 bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-2xl">💵</span>
                </div>
                <div>
                  <div className="font-semibold">USDC on Base</div>
                  <div className="text-sm text-gray-400">Instant, low-fee payments</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">0% fees</div>
                <div className="text-sm text-gray-500">via Coinbase</div>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Pay with USDC on Base for instant settlement and near-zero fees. 
              Connect your wallet to get started.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={connectWallet}
                className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-2 font-semibold hover:from-blue-600 hover:to-purple-700"
              >
                Connect Wallet
              </button>
              <a 
                href="https://commerce.coinbase.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="rounded-lg border border-gray-700 px-6 py-2 font-semibold hover:bg-gray-800"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>

        {/* Machines / Subscriptions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Machines</h2>
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 mb-4">
            <div className="text-gray-400">0 of 1 in use</div>
          </div>

          <div className="space-y-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-xl border p-6 ${
                  plan.popular 
                    ? 'border-white bg-white/5' 
                    : 'border-gray-800 bg-gray-900/50'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-4 bg-white text-black text-xs px-3 py-1 rounded-full">
                    POPULAR
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{plan.name}</h3>
                      {currentPlan === plan.id && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Current</span>
                      )}
                    </div>
                    <div className="text-gray-400 mt-1">{plan.specs}</div>
                    <div className="text-sm text-gray-500 mt-2">
                      {plan.credits}/mo credits · ${plan.price}/mo
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <select className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2" title="Select quantity">
                      <option>1</option>
                      <option>2</option>
                      <option>3</option>
                    </select>
                    <button 
                      onClick={() => buyPlan(plan.priceId)}
                      className={`rounded-lg px-4 py-2 font-semibold ${
                        currentPlan === plan.id 
                          ? 'bg-gray-800 text-gray-400' 
                          : 'bg-white hover:bg-gray-200 text-black'
                      }`}>
                      {currentPlan === plan.id ? 'Current' : 'Buy'}
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {plan.features.map((f) => (
                    <span key={f} className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Need custom */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 text-center">
          <h3 className="font-semibold mb-2">Need custom infrastructure?</h3>
          <p className="text-gray-400 text-sm mb-4">
            Volume discounts, dedicated support, and custom integrations.
          </p>
          <button 
            onClick={contactSales}
            className="rounded-lg border border-gray-700 px-6 py-2 hover:bg-gray-800"
          >
            Contact Sales
          </button>
        </div>
          </>
        )}
        </div>
      </main>
    </div>
  )
}
