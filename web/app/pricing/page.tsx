'use client'

import Link from 'next/link'
import { useState } from 'react'

const plans = [
  {
    name: 'Solo',
    price: '29',
    tagline: '1 agent. Your first step.',
    features: [
      '1 agent, 24/7 runtime',
      'All channels — Telegram, Discord, WhatsApp',
      'All skills included',
      'Your own server',
      'Email support',
    ],
  },
  {
    name: 'Collective',
    price: '69',
    popular: true,
    tagline: '3 agents. For teams and crews.',
    features: [
      '3 agents, 24/7 runtime',
      'Custom workflows and automations',
      'Priority support (24h response)',
      'Team access',
    ],
  },
  {
    name: 'Label',
    price: '149',
    tagline: '10 agents. Full control.',
    features: [
      '10 agents, 24/7 runtime',
      'API access and webhooks',
      'White-label (your brand, our infra)',
      'Dedicated support',
    ],
  },
]

const faqs = [
  {
    q: 'What does "24/7 runtime" mean?',
    a: 'Your agent runs on its own server, all the time. It wakes up, checks messages, handles tasks, and reports back — even when you\'re not online.',
  },
  {
    q: 'What channels can I connect?',
    a: 'Telegram, Discord, and WhatsApp. Connect one or all three — your agent handles them all from a single brain.',
  },
  {
    q: 'Can I change plans?',
    a: 'Yes. Upgrade or downgrade anytime from your dashboard. No lock-in.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'All major credit cards via Stripe, or USDC on Base.',
  },
  {
    q: 'What if I need more than 10 agents?',
    a: 'Contact us for a custom plan. We\'ll set up dedicated infrastructure for your needs.',
  },
]

function FAQItem({ q, a, isFirst }: { q: string; a: string; isFirst: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      {!isFirst && <div className="border-t border-zinc-800" />}
      <button onClick={() => setOpen(!open)} className="w-full py-6 flex items-center justify-between text-left">
        <dt className="text-sm font-bold text-white uppercase tracking-wider pr-4">{q}</dt>
        <svg className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <dd className="pb-6 text-sm text-zinc-400 leading-relaxed">{a}</dd>}
    </div>
  )
}

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <div className="max-w-4xl mx-auto px-6 py-16">

        {/* Hero */}
        <section className="mb-16">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-8">Pricing</span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter uppercase leading-[0.9]">
            One agent.<br /><span className="text-orange-500">One price.</span>
          </h1>
          <p className="text-zinc-400 text-sm max-w-md leading-relaxed mt-8">
            Deploy an autonomous agent that works 24/7. Connect your channels. Walk away.
          </p>
        </section>

        {/* What you're actually paying for */}
        <section className="border-t border-zinc-800 pt-16 mb-4">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-6">You scale agents, not features</div>
          <div className="border border-zinc-900 bg-zinc-950/40 p-4 sm:p-6 overflow-x-auto">
            <svg viewBox="0 0 880 250" className="w-full min-w-[560px]" role="img" aria-label="Every Agentbot plan includes all channels, all skills, 24/7 runtime, and your own server. The tiers differ only by how many agents you run: Solo is 1 agent at £29, Collective is 3 agents at £69, Label is 10 agents at £149." xmlns="http://www.w3.org/2000/svg">
              {/* tiers */}
              {[
                { x: 8, name: 'SOLO', price: '£29', n: 1, accent: false },
                { x: 300, name: 'COLLECTIVE', price: '£69', n: 3, accent: true },
                { x: 592, name: 'LABEL', price: '£149', n: 10, accent: false },
              ].map((t) => (
                <g key={t.name}>
                  <rect x={t.x} y="8" width="280" height="150" fill="#09090b" stroke={t.accent ? '#f97316' : '#27272a'} strokeWidth={t.accent ? 1.5 : 1} />
                  <text x={t.x + 18} y="34" fontFamily="ui-monospace,monospace" fontSize="11" fill={t.accent ? '#f97316' : '#a1a1aa'} letterSpacing="1" fontWeight="bold">{t.name}</text>
                  <text x={t.x + 262} y="34" textAnchor="end" fontFamily="ui-monospace,monospace" fontSize="13" fill="#ffffff" fontWeight="bold">{t.price}<tspan fontSize="8" fill="#52525b">/mo</tspan></text>
                  <text x={t.x + 18} y="52" fontFamily="ui-monospace,monospace" fontSize="8" fill="#52525b" letterSpacing="1">{t.n} agent{t.n > 1 ? 's' : ''}, 24/7</text>
                  {/* agent dots */}
                  {Array.from({ length: t.n }).map((_, i) => (
                    <rect key={i} x={t.x + 18 + (i % 5) * 26} y={70 + Math.floor(i / 5) * 26} width="18" height="18" fill={t.accent ? '#f97316' : '#3f3f46'} />
                  ))}
                </g>
              ))}
              {/* shared foundation */}
              <rect x="8" y="178" width="864" height="56" fill="#0a0a0a" stroke="#22c55e" strokeWidth="1" />
              <text x="28" y="200" fontFamily="ui-monospace,monospace" fontSize="9" fill="#22c55e" letterSpacing="2" fontWeight="bold">INCLUDED IN EVERY PLAN</text>
              <text x="28" y="220" fontFamily="ui-monospace,monospace" fontSize="10" fill="#a1a1aa">all channels · all skills · 24/7 runtime · your own server · no feature gates</text>
            </svg>
          </div>
        </section>

        {/* Plans */}
        <section className="border-t border-zinc-800 pt-16 mb-16">
          <div className="grid sm:grid-cols-3 gap-px bg-zinc-800">
            {plans.map((plan) => (
              <div key={plan.name} className={`bg-black p-6 sm:p-8 flex flex-col card-hover ${plan.popular ? 'popular-glow' : ''}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500">{plan.name}</span>
                  {plan.popular && (
                    <span className="text-[8px] uppercase tracking-widest text-orange-500 border border-orange-500/30 px-1.5 py-0.5">Popular</span>
                  )}
                </div>
                <div className="text-3xl font-bold tracking-tighter mb-2">
                  £{plan.price}<span className="text-xs font-normal text-zinc-600">/mo</span>
                </div>
                <p className="text-[11px] text-zinc-600 mb-6">{plan.tagline}</p>
                <ul className="space-y-2 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="text-zinc-500 text-xs flex items-center gap-2">
                      <span className="text-orange-500">→</span> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/api/stripe/checkout?plan=${plan.name.toLowerCase()}`}
                  className={`mt-auto block w-full py-3 text-center text-[10px] font-bold uppercase tracking-widest transition-colors btn-press ${
                    plan.popular
                      ? 'bg-white text-black hover:bg-zinc-200'
                      : 'border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
                  }`}
                >
                  Deploy
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* What's included */}
        <section className="border-t border-zinc-800 pt-16 mb-16">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-8">Every plan includes</div>
          <div className="grid sm:grid-cols-2 gap-px bg-zinc-800">
            {[
              { title: 'Always on', body: 'Your agent runs on its own server, 24/7. Not shared. Not throttled. Not sleeping.' },
              { title: 'Every channel', body: 'Telegram, Discord, WhatsApp. Connect one or all three. One brain, multiple channels.' },
              { title: 'Every skill', body: 'Full skill library on every plan. No tiers. No paywalls. No upgrade to unlock.' },
              { title: 'Full control', body: 'Dashboard, activity feed, health checks. See what your agent sees. Manage everything.' },
            ].map((item) => (
              <div key={item.title} className="bg-black p-6">
                <div className="text-xs font-bold text-white uppercase tracking-wider mb-2">{item.title}</div>
                <p className="text-zinc-500 text-xs leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-zinc-800 pt-16 mb-16">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-8">Questions</div>
          <dl>
            {faqs.map((faq, i) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} isFirst={i === 0} />
            ))}
          </dl>
        </section>

        {/* CTA */}
        <section className="border-t border-zinc-800 pt-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter uppercase mb-4">
            Your agent.<br /><span className="text-orange-500">Works while you sleep.</span>
          </h2>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center bg-white text-black px-10 py-4 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors mt-6"
          >
            Deploy Your Agent →
          </Link>
        </section>
      </div>
    </main>
  )
}
