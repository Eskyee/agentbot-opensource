'use client'

import Link from 'next/link'

export default function PricingPage() {
  const plans = [
    {
      id: 'solo',
      name: 'SOLO',
      price: 29,
      description: 'Creative agents only. Chat with fans, generate artwork. No business automation.',
      color: 'green',
      features: [
        { text: '1 Creative Agent thread', included: true },
        { text: 'Fan engagement (Telegram)', included: true },
        { text: 'BlockDB queries for A&R', included: true },
        { text: 'No OpenClaw business', included: false },
      ],
    },
    {
      id: 'collective',
      name: 'COLLECTIVE',
      price: 69,
      description: 'Creative crew + 1 OpenClaw seat (digital tour manager).',
      color: 'blue',
      popular: true,
      features: [
        { text: '3 Creative Agent threads', included: true },
        { text: '1 OpenClaw Business seat', included: true },
        { text: 'Email Triage (50/day)', included: true },
        { text: 'USDC Invoicing', included: true },
      ],
    },
    {
      id: 'label',
      name: 'LABEL',
      price: 149,
      description: 'Full back office — 3 OpenClaw seats + 10 creative agents.',
      color: 'purple',
      features: [
        { text: '10 Creative Agent threads', included: true },
        { text: '3 OpenClaw Business seats', included: true },
        { text: 'Multi-inbox (A&R@, Booking@)', included: true },
        { text: 'White-label emails', included: true },
      ],
    },
    {
      id: 'network',
      name: 'NETWORK',
      price: 499,
      description: 'Agencies — resell the future. Unlimited everything.',
      color: 'orange',
      features: [
        { text: 'Unlimited Creative Agents', included: true },
        { text: 'Unlimited OpenClaw seats', included: true },
        { text: 'White-label (resell)', included: true },
        { text: '99.9% SLA guarantee', included: true },
      ],
    },
  ]

  const colorClasses: Record<string, { border: string; text: string; bg: string; button: string; buttonHover: string; check: string }> = {
    green: {
      border: 'border-white/10 hover:border-green-500',
      text: 'text-gray-400 group-hover:text-green-400',
      bg: 'bg-gray-900/30',
      button: 'bg-white text-black hover:bg-gray-200',
      buttonHover: 'hover:bg-gray-200',
      check: 'text-green-500',
    },
    blue: {
      border: 'border-blue-500',
      text: 'text-blue-400',
      bg: 'bg-blue-500/5',
      button: 'bg-blue-500 text-black hover:bg-blue-400',
      buttonHover: 'hover:bg-blue-400',
      check: 'text-blue-500',
    },
    purple: {
      border: 'border-white/10 hover:border-purple-500',
      text: 'text-gray-400 group-hover:text-purple-400',
      bg: 'bg-gray-900/30',
      button: 'bg-white text-black hover:bg-gray-200',
      buttonHover: 'hover:bg-gray-200',
      check: 'text-purple-500',
    },
    orange: {
      border: 'border-orange-500/50 hover:border-orange-500',
      text: 'text-orange-400 group-hover:text-orange-300',
      bg: 'bg-orange-500/5',
      button: 'bg-orange-500 text-black hover:bg-orange-400',
      buttonHover: 'hover:bg-orange-400',
      check: 'text-orange-500',
    },
  }

  return (
    <main className="min-h-screen bg-black text-white selection:bg-blue-500 selection:text-white">
      {/* Hero */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 text-6xl sm:text-8xl" role="img" aria-label="Lobster">🦞</div>
          
          <div className="mb-4 text-[10px] font-bold text-blue-500 tracking-[0.3em] uppercase">
            Platform Operator Protocol
          </div>
          
          <h1 className="text-5xl font-black tracking-tighter sm:text-6xl lg:text-8xl mb-6">
            ONE CREATIVE CREW, ONE BUSINESS MIND
          </h1>
          
          <p className="mt-6 text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Agentbot handles your fans. OpenClaw handles your inbox. Pay how you want — card or Apple Pay.
          </p>
          
          {/* Billing Toggle */}
          <div className="mt-8 flex justify-center">
            <div className="inline-flex items-center gap-1 p-1 bg-gray-900 rounded-lg border border-gray-800">
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  true ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-4 py-12 sm:px-6 lg:px-8 pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => {
              const colors = colorClasses[plan.color]
              return (
                <div
                  key={plan.id}
                  className={`border rounded-2xl p-6 ${colors.bg} ${colors.border} transition-all group relative overflow-hidden`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-blue-500 text-black text-[10px] font-black px-3 py-1 uppercase tracking-tighter">
                      POPULAR
                    </div>
                  )}
                  
                  <h3 className={`text-lg font-bold ${colors.text} transition-colors`}>
                    {plan.name}
                  </h3>
                  
                  <p className="mt-2 text-xs text-gray-500">{plan.description}</p>
                  
                  <p className="mt-4 text-4xl font-black">
                    £{plan.price}<span className="text-lg font-normal text-gray-600">/mo</span>
                  </p>
                  
                  <ul className="mt-6 space-y-2 text-sm text-gray-500 text-left">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex gap-2">
                        <span className={feature.included ? colors.check : 'text-gray-600'}>
                          {feature.included ? '✓' : '✗'}
                        </span>
                        <span className={feature.included ? 'text-gray-400' : ''}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link
                    href={`/api/stripe/checkout?plan=${plan.id}`}
                    className={`mt-6 block w-full rounded-xl py-3 text-center text-sm font-bold transition-colors ${colors.button}`}
                  >
                    SELECT
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Payment Methods */}
      <section className="px-4 py-12 bg-black border-t border-white/5">
        <div className="mx-auto max-w-3xl text-center">
          <h3 className="text-lg font-bold text-gray-300 mb-6">Accepted Payment Methods</h3>
          <div className="flex flex-wrap justify-center gap-4 items-center">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 rounded-lg border border-gray-800">
              <span className="text-white font-semibold">Visa</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 rounded-lg border border-gray-800">
              <span className="text-white font-semibold">Mastercard</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 rounded-lg border border-gray-800">
              <span className="text-white font-semibold">Apple Pay</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 rounded-lg border border-gray-800">
              <span className="text-white font-semibold">Google Pay</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 rounded-lg border border-gray-800">
              <span className="text-white font-semibold">PayPal</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 rounded-lg border border-gray-800">
              <span className="text-white font-semibold">USDC</span>
            </div>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            Secure payments via Stripe. Crypto optional — use USDC on Base for discounts.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-16 border-t border-white/5 bg-[#050505]">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-100 text-center mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            {[
              {
                q: 'What is the difference between Agentbot and OpenClaw?',
                a: 'Agentbot = Creative Crew (fan engagement, promo, music). OpenClaw = Business Operations (email, contracts, invoicing). Solo tier gets Agentbot only. Collective+ includes OpenClaw seats.',
              },
              {
                q: 'Do I need to provide my own AI API key?',
                a: 'Yes — Agentbot is BYOK (Bring Your Own Key). You connect your OpenAI, Anthropic, OpenRouter, or local Ollama keys directly. You pay wholesale rates with zero markup.',
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit cards through Stripe, or USDC on Base via x402.',
              },
              {
                q: 'Can I change plans later?',
                a: 'Yes. Upgrade or downgrade at any time from your dashboard. OpenClaw seats can be added incrementally on Collective+ tiers.',
              },
            ].map((faq, i) => (
              <div key={i} className="bg-gray-900/30 rounded-lg p-6 border border-white/5">
                <dt className="text-lg font-medium text-gray-100">{faq.q}</dt>
                <dd className="mt-2 text-gray-400">{faq.a}</dd>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 bg-gradient-to-b from-transparent to-blue-500/5">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-gray-100 mb-4">
            Ready to automate your music business?
          </h2>
          <p className="text-lg text-gray-400 mb-8">
            Solo: chat with fans. Collective+: add a digital tour manager. Label+: full back office.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="https://raveculture.mintlify.app"
              className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              View Documentation
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 bg-black">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🦞</span>
                <span className="font-black tracking-tighter text-xl">AGENTBOT</span>
              </div>
              <p className="text-gray-500 text-sm mb-4">
                Zero human company run by Atlas_baseFM. The underground infrastructure for autonomous agent fleets.
              </p>
              <div className="text-xs text-gray-600">
                © 2026 BY RAVECULTURE
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-xs font-bold text-green-400 tracking-widest mb-2">SUPPORT THE MISSION</div>
              <div className="text-xs text-gray-500 mb-2">Send ETH or tokens to:</div>
              <code className="text-green-400 bg-gray-900 px-3 py-2 rounded font-mono text-xs break-all inline-block">
                0xd8fd0e1dce89beaab924ac68098ddb17613db56f
              </code>
              <div className="mt-3 flex gap-4 justify-end text-xs">
                <Link href="/token" className="text-blue-400 hover:underline">$AGENTBOT</Link>
                <Link href="/basefm" className="text-purple-400 hover:underline">$BASEFM</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
