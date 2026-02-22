'use client'

import { useState } from 'react'
import Link from 'next/link'

const navItems = [
  { icon: '🤖', label: 'Agents', href: '/agents', active: false },
  { icon: '🛒', label: 'Marketplace', href: '/marketplace', active: false },
  { icon: '💳', label: 'Billing', href: '/billing', active: true },
  { icon: '⚙️', label: 'Account', href: '/settings', active: false },
]

function BillingSidebar({ userName, credits = 0 }: { userName: string; credits?: number }) {
  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
      <div className="p-6 border-b border-gray-800">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🦞</span>
          <span className="text-xl font-bold">Agentbot</span>
        </Link>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                item.active 
                  ? 'bg-lobster-500/20 text-lobster-400' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="mt-8 p-4 bg-gray-800 rounded-xl">
          <div className="text-sm text-gray-400 mb-1">Credits</div>
          <div className="text-xl font-bold">${credits.toFixed(2)}</div>
        </div>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-lobster-500 rounded-full flex items-center justify-center font-bold">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-medium">{userName}</div>
            <div className="text-sm text-gray-400">Free Trial</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default function BillingPage() {
  const [credits, setCredits] = useState(100)
  const [usage] = useState(34.89)
  const [allowance] = useState(15)
  const [currentPlan] = useState('starter')

  const creditPacks = [
    { amount: 1000, price: 10, popular: false },
    { amount: 2500, price: 25, popular: true },
    { amount: 5000, price: 50, popular: false },
    { amount: 10000, price: 100, popular: false },
  ]

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      specs: '2 vCPU · 2GB · 30GB',
      credits: '$15',
      price: 49,
      features: ['All models', 'All integrations', '$15 monthly credits', 'Web browsing'],
    },
    {
      id: 'professional',
      name: 'Professional',
      specs: '2 vCPU · 4GB · 50GB',
      credits: '$25',
      price: 99,
      popular: true,
      features: ['All models', 'All integrations', '$25 monthly credits', 'Priority support'],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      specs: '4 vCPU · 8GB · 100GB',
      credits: '$50',
      price: 200,
      features: ['All models', 'All integrations', '$50 monthly credits', 'Dedicated support'],
    },
  ]

  return (
    <div className="flex h-screen bg-black text-white">
      <BillingSidebar userName="User" credits={0.01} />

      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Billing</h1>

        {/* Credit Balance */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Credit Balance</h2>
          <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-4xl font-bold">${credits.toFixed(2)}</div>
                <div className="text-gray-400">{credits} credits</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">${usage.toFixed(2)} used in last 30 days</div>
                <div className="text-sm text-gray-500">${allowance} monthly allowance</div>
              </div>
            </div>
            {credits < 10 && (
              <div className="mb-4 p-3 rounded-lg bg-yellow-500/20 text-yellow-400 text-sm">
                ⚠️ Low balance
              </div>
            )}
            <button className="rounded-lg bg-lobster-500 px-6 py-2 font-semibold hover:bg-lobster-400">
              Buy Credits
            </button>
          </div>
        </div>

        {/* Buy Credits */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Buy Credits</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {creditPacks.map((pack) => (
              <div
                key={pack.amount}
                className={`relative rounded-xl border p-6 ${
                  pack.popular 
                    ? 'border-lobster-500 bg-lobster-500/10' 
                    : 'border-gray-800 bg-gray-900/50'
                }`}
              >
                {pack.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-lobster-500 text-white text-xs px-3 py-1 rounded-full">
                    POPULAR
                  </span>
                )}
                <div className="text-3xl font-bold">${pack.price}</div>
                <div className="text-gray-400">{pack.amount.toLocaleString()} credits</div>
                <button className={`mt-4 w-full rounded-lg py-2 font-semibold ${
                  pack.popular 
                    ? 'bg-lobster-500 hover:bg-lobster-400' 
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}>
                  Select
                </button>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-gray-500 text-center">1 credit = $0.01 · Used for AI model requests</p>
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
                    ? 'border-lobster-500 bg-lobster-500/5' 
                    : 'border-gray-800 bg-gray-900/50'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-4 bg-lobster-500 text-white text-xs px-3 py-1 rounded-full">
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
                    <select className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
                      <option>1</option>
                      <option>2</option>
                      <option>3</option>
                    </select>
                    <button className={`rounded-lg px-4 py-2 font-semibold ${
                      currentPlan === plan.id 
                        ? 'bg-gray-800 text-gray-400' 
                        : 'bg-lobster-500 hover:bg-lobster-400'
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
          <button className="rounded-lg border border-gray-700 px-6 py-2 hover:bg-gray-800">
            Contact Sales
          </button>
        </div>
      </main>
    </div>
  )
}
