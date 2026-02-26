'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: '£19',
    period: '/mo',
    description: 'Perfect for individuals',
    features: [
      '1 AI Agent',
      '10GB storage',
      'Telegram channel',
      'Use your own AI key',
      'Priority support',
    ],
    cta: 'Get Started',
    href: '/api/stripe/checkout?plan=starter',
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '£39',
    period: '/mo + usage',
    description: 'For power users',
    features: [
      '1 AI Agent',
      '50GB storage',
      'Telegram + WhatsApp',
      'Custom domain',
      'Priority support',
    ],
    cta: 'Get Started',
    href: '/api/stripe/checkout?plan=pro',
    popular: false,
  },
  {
    id: 'scale',
    name: 'Scale',
    price: '£79',
    period: '/mo',
    description: 'For growing teams',
    features: [
      '3 AI Agents',
      '100GB storage',
      'All channels',
      'Advanced analytics',
      'Dedicated support',
    ],
    cta: 'Get Started',
    href: '/api/stripe/checkout?plan=scale',
    popular: false,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '£149',
    period: '/mo',
    description: 'Full service solution',
    features: [
      'Unlimited agents',
      '500GB storage',
      'White-label options',
      '24/7 phone support',
      'Custom integrations',
    ],
    cta: 'Contact Sales',
    href: '/#contact',
    popular: false,
  },
  {
    id: 'white_glove',
    name: 'White Glove',
    price: '£199',
    period: '/mo',
    description: 'Premium solution',
    features: [
      'Everything in Enterprise',
      '10x resources',
      'Priority 24/7 support',
      'Custom integrations',
      'Dedicated account manager',
    ],
    cta: 'Contact Sales',
    href: '/#contact',
    popular: false,
  },
]

const navItems = [
  { icon: '🤖', label: 'Agents', href: '/agents', active: false },
  { icon: '🛒', label: 'Marketplace', href: '/marketplace', active: false },
  { icon: '💳', label: 'Billing', href: '/billing', active: false },
  { icon: '⚙️', label: 'Account', href: '/settings', active: false },
]

function PricingSidebar({ userName, credits = 0 }: { userName: string; credits?: number }) {
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
                  ? 'bg-white/20 text-white' 
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
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold">
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

export default function PricingPage() {
  const { data: session } = useSession()
  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'Guest'
  
  return (
    <div className="flex h-screen bg-black text-white">
      <PricingSidebar userName={userName} credits={0} />

      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Simple Pricing</h1>
            <p className="text-gray-400">3-day free trial. No spam, ever.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-6 border ${
                  plan.popular
                    ? 'border-white bg-white/10'
                    : 'border-gray-800 bg-gray-900'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-full text-xs font-semibold">
                    Popular
                  </div>
                )}
                
                <h3 className="text-xl font-semibold">{plan.name}</h3>
                <p className="text-gray-400 text-sm mt-1">{plan.description}</p>
                
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-gray-400 text-sm">{plan.period}</span>
                </div>

                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-gray-300">
                      <span className="text-green-400">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <a
                  href={plan.href}
                  className={`mt-6 block w-full py-3 rounded-lg text-center font-semibold transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-white to-gray-200 hover:from-gray-100 hover:to-gray-300 text-black'
                      : 'bg-gray-700 hover:bg-white text-white hover:text-black'
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-400">
              Need a custom plan?{' '}
              <Link href="/#contact" className="text-white hover:underline">
                Contact us
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
