'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface CreditPack {
  id: string
  name: string
  credits: number
  price: number
  currency: string
  popular?: boolean
  description: string
}

const CREDIT_PACKS: CreditPack[] = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 1000,
    price: 5,
    currency: 'GBP',
    description: '1,000 credits · ~500 agent messages',
  },
  {
    id: 'growth',
    name: 'Growth',
    credits: 5000,
    price: 20,
    currency: 'GBP',
    popular: true,
    description: '5,000 credits · ~2,500 agent messages',
  },
  {
    id: 'scale',
    name: 'Scale',
    credits: 15000,
    price: 50,
    currency: 'GBP',
    description: '15,000 credits · ~7,500 agent messages',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    credits: 50000,
    price: 150,
    currency: 'GBP',
    description: '50,000 credits · ~25,000 agent messages',
  },
]

export default function CreditsPage() {
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/credits')
      .then((r) => r.json())
      .then((d) => {
        setBalance(d.credits ?? 0)
      })
      .catch(() => setBalance(0))
      .finally(() => setLoading(false))
  }, [])

  async function handlePurchase(packId: string) {
    setPurchasing(packId)
    try {
      const res = await fetch('/api/stripe/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Failed to create checkout session')
      }
    } catch {
      alert('Network error')
    } finally {
      setPurchasing(null)
    }
  }

  return (
    <main className="min-h-screen bg-black text-white font-mono">
      {/* Header */}
      <section className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
        <div className="inline-block px-3 py-1 border border-zinc-800 text-orange-500 text-[10px] uppercase tracking-widest mb-6">
          Credits
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tighter uppercase leading-[0.9] mb-4">
          Buy <span className="text-orange-500">Credits.</span>
        </h1>
        <p className="text-zinc-400 text-sm max-w-lg leading-relaxed mb-8">
          Credits power your agents beyond plan limits. One credit ≈ one agent message.
          No expiry. No subscription. Buy what you need.
        </p>

        {/* Current balance */}
        <div className="border border-zinc-800 bg-zinc-950/40 p-6 inline-block">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Your Balance</div>
          <div className="text-3xl font-bold tracking-tighter tabular-nums">
            {loading ? (
              <span className="text-zinc-700 animate-pulse">—</span>
            ) : (
              <span className="text-orange-500">{(balance ?? 0).toLocaleString()}</span>
            )}
            <span className="text-xs font-normal text-zinc-600 ml-2">credits</span>
          </div>
        </div>
      </section>

      {/* Credit packs */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-10">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-8">Credit Packs</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-900">
            {CREDIT_PACKS.map((pack) => (
              <div key={pack.id} className="bg-black p-6 flex flex-col relative">
                {pack.popular && (
                  <div className="absolute top-3 right-3 text-[8px] uppercase tracking-widest text-orange-500 border border-orange-500/30 px-1.5 py-0.5">
                    Popular
                  </div>
                )}
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">{pack.name}</div>
                <div className="text-2xl font-bold tracking-tighter mb-1">
                  £{pack.price}
                </div>
                <div className="text-[10px] text-zinc-600 mb-4">{pack.credits.toLocaleString()} credits</div>
                <p className="text-zinc-500 text-xs leading-relaxed mb-6 flex-1">{pack.description}</p>
                <button
                  onClick={() => handlePurchase(pack.id)}
                  disabled={purchasing === pack.id}
                  className={`w-full py-3 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                    pack.popular
                      ? 'bg-white text-black hover:bg-zinc-200'
                      : 'border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {purchasing === pack.id ? 'Loading…' : 'Buy Credits'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How credits work */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-8">How Credits Work</div>
          <div className="grid sm:grid-cols-3 gap-px bg-zinc-900">
            <div className="bg-black p-6">
              <div className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-3">01</div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Buy</h3>
              <p className="text-zinc-500 text-xs leading-relaxed">Choose a credit pack. Pay with card via Stripe. Credits are added instantly to your account.</p>
            </div>
            <div className="bg-black p-6">
              <div className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-3">02</div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Use</h3>
              <p className="text-zinc-500 text-xs leading-relaxed">Your agents consume credits automatically when processing messages, running workflows, or calling tools.</p>
            </div>
            <div className="bg-black p-6">
              <div className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-3">03</div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Track</h3>
              <p className="text-zinc-500 text-xs leading-relaxed">Monitor usage in real-time on your dashboard. Credits never expire. Top up anytime.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-8">FAQ</div>
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">What are credits used for?</h3>
              <p className="text-zinc-500 text-xs leading-relaxed">Credits are consumed when your agents process messages, run workflows, call external tools, and generate responses. One credit ≈ one standard agent message.</p>
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Do credits expire?</h3>
              <p className="text-zinc-500 text-xs leading-relaxed">No. Credits stay in your account until used. No expiry date.</p>
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Can I use credits with BYOK?</h3>
              <p className="text-zinc-500 text-xs leading-relaxed">Yes. If you bring your own MiMo key, credits are only consumed for platform usage (tool calls, storage, workflows) — not for LLM inference.</p>
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">What happens when I run out?</h3>
              <p className="text-zinc-500 text-xs leading-relaxed">Your agents pause until you top up. No surprise charges. You can also set up auto-reload in your dashboard settings.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 text-center">
          <p className="text-zinc-500 text-xs mb-4">Already have a plan?</p>
          <div className="flex justify-center gap-3">
            <Link href="/dashboard" className="inline-flex items-center justify-center border border-zinc-800 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors">
              Dashboard
            </Link>
            <Link href="/pricing" className="inline-flex items-center justify-center border border-zinc-800 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors">
              View Plans
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
