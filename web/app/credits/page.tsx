'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const WalletProvider = dynamic(() => import('@/app/components/WalletProvider'), { ssr: false })

const CryptoPay = dynamic(
  () => import('@/app/components/CryptoPay').then((m) => m.CryptoPay),
  { ssr: false, loading: () => <div className="text-xs text-zinc-600 animate-pulse">Loading wallet…</div> }
)

interface CreditActivity {
  id: string
  type: 'topup' | 'usage' | 'subscription'
  amount: number
  description: string
  created_at: string
}

export default function CreditsPage() {
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [topUpAmount, setTopUpAmount] = useState(10)
  const [purchasing, setPurchasing] = useState(false)
  const [activity, setActivity] = useState<CreditActivity[]>([])

  useEffect(() => {
    Promise.all([
      fetch('/api/credits').then((r) => r.json()).catch(() => ({ credits: 0 })),
      fetch('/api/credits/activity').then((r) => r.json()).catch(() => ({ activity: [] })),
    ]).then(([creditData, activityData]) => {
      setBalance(creditData.credits ?? 0)
      setActivity(activityData.activity ?? [])
    }).finally(() => setLoading(false))
  }, [])

  async function handleTopUp() {
    setPurchasing(true)
    try {
      const res = await fetch('/api/stripe/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: topUpAmount }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Failed to create checkout')
      }
    } catch {
      alert('Network error')
    } finally {
      setPurchasing(false)
    }
  }

  async function handleSubscribe() {
    setPurchasing(true)
    try {
      const res = await fetch('/api/stripe/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: true }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Failed to create subscription')
      }
    } catch {
      alert('Network error')
    } finally {
      setPurchasing(false)
    }
  }

  const outOfCredits = balance !== null && balance <= 0

  return (
    <main className="min-h-screen bg-black text-white font-mono">
      {/* Header */}
      <section className="max-w-3xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
        <div className="inline-block px-3 py-1 border border-zinc-800 text-orange-500 text-[10px] uppercase tracking-widest mb-6">
          Credits
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tighter uppercase leading-[0.9] mb-4">
          Credits.
        </h1>
        <p className="text-zinc-400 text-sm max-w-lg leading-relaxed">
          Pay-as-you-go inference, prepaid. Every request draws down your balance at the model's published per-token rate (see <Link href="/pricing" className="text-orange-500 hover:text-orange-400 underline underline-offset-4">pricing</Link>). When it hits zero, calls return 402 until you top up.
        </p>
      </section>

      {/* Current Balance */}
      <section className="border-t border-zinc-900">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 py-10">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3">Current Balance</div>
          <div className="flex items-baseline gap-3">
            {loading ? (
              <span className="text-4xl font-bold tracking-tighter text-zinc-700 animate-pulse">—</span>
            ) : (
              <>
                <span className={`text-4xl font-bold tracking-tighter ${outOfCredits ? 'text-red-500' : 'text-white'}`}>
                  ${(balance ?? 0).toFixed(2)}
                </span>
                <span className="text-xs text-zinc-500 uppercase tracking-widest">USD</span>
              </>
            )}
          </div>
          {outOfCredits && !loading && (
            <div className="mt-3 text-xs text-red-400 flex items-center gap-2">
              <span>⚠</span> out of credits — requests are blocked until you top up
            </div>
          )}
        </div>
      </section>

      {/* Top Up */}
      <section className="border-t border-zinc-900">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <button
              onClick={handleSubscribe}
              disabled={purchasing}
              className="flex-1 bg-white text-black px-6 py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              subscribe $10/mo → $10 credits
            </button>
            <button
              onClick={handleTopUp}
              disabled={purchasing}
              className="flex-1 border border-zinc-800 px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors disabled:opacity-50"
            >
              top up credits →
            </button>
          </div>
          <p className="text-zinc-500 text-xs">
            Subscribe for $10 credits every month, or top up any amount one-time — no subscription required.
          </p>

          {/* Custom amount */}
          <div className="mt-6 flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-widest text-zinc-600">Amount:</span>
            {[5, 10, 25, 50, 100].map((amt) => (
              <button
                key={amt}
                onClick={() => setTopUpAmount(amt)}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border transition-colors ${
                  topUpAmount === amt
                    ? 'border-orange-500 text-orange-500 bg-orange-500/10'
                    : 'border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600'
                }`}
              >
                ${amt}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Pay with Crypto */}
      <section className="border-t border-zinc-900">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 py-10">
          <WalletProvider>
            <CryptoPay amount={topUpAmount} />
          </WalletProvider>
        </div>
      </section>

      {/* Agentbot Pro — Monthly Plan */}
      <section className="border-t border-zinc-900">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 py-10">
          <div className="border border-zinc-800 bg-zinc-950/40 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-bold text-white uppercase tracking-wider">Agentbot Pro</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">monthly credit plan</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold tracking-tighter">$10<span className="text-xs font-normal text-zinc-600">/month</span></div>
              </div>
            </div>
            <ul className="space-y-2 mb-6">
              {[
                '$10 of inference credits every month',
                'Metered per token at published model rates',
                'Works with every Agentbot model (MiMo, Claude, GPT)',
                'Unused credits roll over while subscribed',
                'Drop-in: same OpenAI-compatible endpoint + key',
                'Cancel anytime from Stripe portal',
              ].map((f, i) => (
                <li key={i} className="text-zinc-400 text-xs flex items-start gap-2">
                  <span className="text-orange-500 mt-0.5">[+]</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={handleSubscribe}
              disabled={purchasing}
              className="w-full bg-white text-black py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {purchasing ? 'Loading…' : 'Subscribe'}
            </button>
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="border-t border-zinc-900">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 py-10">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Recent Activity</div>
          {activity.length === 0 ? (
            <p className="text-zinc-600 text-xs">No credit activity yet. Subscribe to grant your first $10.</p>
          ) : (
            <div className="space-y-2">
              {activity.slice(0, 10).map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-zinc-900/50">
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] ${a.type === 'topup' || a.type === 'subscription' ? 'text-green-500' : 'text-zinc-500'}`}>
                      {a.type === 'topup' ? '↑' : a.type === 'subscription' ? '★' : '↓'}
                    </span>
                    <span className="text-xs text-zinc-400">{a.description}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-mono tabular-nums ${a.amount > 0 ? 'text-green-500' : 'text-zinc-500'}`}>
                      {a.amount > 0 ? '+' : ''}${Math.abs(a.amount).toFixed(2)}
                    </span>
                    <span className="text-[9px] text-zinc-700">{new Date(a.created_at).toLocaleDateString('en-GB')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer links */}
      <section className="border-t border-zinc-900">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 py-8 flex flex-wrap gap-6">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3">Learn</div>
            <div className="flex flex-col gap-2">
              <Link href="/documentation" className="text-[10px] text-zinc-500 hover:text-white transition-colors">how it works</Link>
              <Link href="/usage/global" className="text-[10px] text-zinc-500 hover:text-white transition-colors">usage</Link>
              <Link href="/blog" className="text-[10px] text-zinc-500 hover:text-white transition-colors">journal</Link>
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3">Products</div>
            <div className="flex flex-col gap-2">
              <Link href="/pricing" className="text-[10px] text-zinc-500 hover:text-white transition-colors">plans</Link>
              <Link href="/marketplace" className="text-[10px] text-zinc-500 hover:text-white transition-colors">marketplace</Link>
              <Link href="/basefm" className="text-[10px] text-zinc-500 hover:text-white transition-colors">baseFM</Link>
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3">Build</div>
            <div className="flex flex-col gap-2">
              <Link href="/documentation" className="text-[10px] text-zinc-500 hover:text-white transition-colors">docs</Link>
              <a href="https://github.com/Eskyee/agentbot-opensource" target="_blank" rel="noopener noreferrer" className="text-[10px] text-zinc-500 hover:text-white transition-colors">github</a>
              <Link href="/api/usage" className="text-[10px] text-zinc-500 hover:text-white transition-colors">api</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
