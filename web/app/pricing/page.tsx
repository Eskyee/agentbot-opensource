'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Check } from 'lucide-react'

const plans = [
  {
    id: 'solo',
    name: 'Solo',
    price: '29',
    features: ['1 Creative Agent thread', 'Fan engagement (Telegram)', 'BlockDB queries for A&R'],
    popular: false,
  },
  {
    id: 'collective',
    name: 'Collective',
    price: '69',
    features: ['3 Creative Agent threads', '1 OpenClaw Business seat', 'Email Triage (50/day)', 'x402 USDC Invoicing'],
    popular: true,
  },
  {
    id: 'label',
    name: 'Label',
    price: '149',
    features: ['10 Creative Agent threads', '3 OpenClaw Business seats', 'Multi-inbox (A&R@, Booking@)', 'White-label emails'],
    popular: false,
  },
  {
    id: 'network',
    name: 'Network',
    price: '499',
    features: ['Unlimited Creative Agents', 'Unlimited OpenClaw seats', 'White-label (resell)', '99.9% SLA guarantee'],
    popular: false,
  },
]

const paymentMethods = ['Visa', 'Mastercard', 'Apple Pay', 'Google Pay', 'PayPal', 'USDC']

const faqs = [
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
]

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-32">
        <div className="max-w-2xl">
          <Badge variant="outline" className="mb-8 border-zinc-800 text-blue-500 text-[10px] uppercase tracking-widest">
            Pricing
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-[0.9]">
            One Creative Crew,<br />
            <span className="text-zinc-700">One Business Mind</span>
          </h1>
          <p className="text-zinc-400 text-sm max-w-md leading-relaxed mt-8">
            Agentbot handles your fans. OpenClaw handles your inbox. Pay how you want — card or Apple Pay.
          </p>
        </div>
      </section>

      {/* What's included */}
      <section className="border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid sm:grid-cols-3 gap-12">
            <div>
              <Badge variant="secondary" className="mb-3 text-[10px] uppercase tracking-widest">Agentbot</Badge>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-4">Creative Crew</h4>
              <ul className="space-y-2 text-xs text-zinc-500">
                <li>Fan engagement (Telegram/WhatsApp)</li>
                <li>BlockDB queries for A&R</li>
                <li>Base FM submissions</li>
                <li>Visual artwork generation</li>
              </ul>
            </div>
            <div>
              <Badge variant="secondary" className="mb-3 text-[10px] uppercase tracking-widest">OpenClaw</Badge>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-4">Business Operations</h4>
              <ul className="space-y-2 text-xs text-zinc-500">
                <li>Email inbox management</li>
                <li>Contract/Rider analysis (PDF)</li>
                <li>Web scraping (gig listings)</li>
                <li>x402 USDC invoicing</li>
              </ul>
            </div>
            <div>
              <Badge variant="secondary" className="mb-3 text-[10px] uppercase tracking-widest">You Provide</Badge>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-4">Your Own Keys</h4>
              <ul className="space-y-2 text-xs text-zinc-500">
                <li>Your own AI API key</li>
                <li>OpenAI, Anthropic, Ollama</li>
                <li>No markup — wholesale rates</li>
                <li>Switch models anytime</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Plan Cards — Vercel-style borderless grid */}
      <section className="border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-900">
            {plans.map((plan) => (
              <div key={plan.id} className="bg-black p-8 flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500">{plan.name}</span>
                  {plan.popular && (
                    <Badge variant="outline" className="text-[9px] uppercase tracking-widest text-blue-500 border-blue-500/30">
                      Popular
                    </Badge>
                  )}
                </div>
                <div className="text-3xl font-bold tracking-tighter mb-6">
                  £{plan.price}<span className="text-sm font-normal text-zinc-600">/mo</span>
                </div>
                <ul className="space-y-2 text-xs text-zinc-500 mb-8 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-zinc-600 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.popular ? 'default' : 'outline'}
                  className={`w-full text-xs font-bold uppercase tracking-widest ${
                    plan.popular
                      ? 'bg-white text-black hover:bg-zinc-200'
                      : 'border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
                  }`}
                  onClick={() => window.location.href = `/api/stripe/checkout?plan=${plan.id}`}
                >
                  Select
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Methods */}
      <section className="border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-6">Accepted Payment Methods</div>
          <div className="flex flex-wrap gap-3">
            {paymentMethods.map((method) => (
              <Badge key={method} variant="outline" className="border-zinc-900 text-zinc-500 text-[10px] uppercase tracking-widest">
                {method}
              </Badge>
            ))}
          </div>
          <p className="mt-6 text-xs text-zinc-600">
            Secure payments via Stripe. Crypto optional — use USDC on Base for discounts.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="max-w-2xl">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Support</div>
            <h2 className="text-2xl font-bold tracking-tighter uppercase mb-12">
              Frequently Asked<br /><span className="text-zinc-700">Questions</span>
            </h2>

            <div className="space-y-0">
              {faqs.map((faq, i) => (
                <div key={i}>
                  {i > 0 && <Separator className="bg-zinc-900" />}
                  <div className="py-6">
                    <dt className="text-sm font-bold text-white uppercase tracking-wider">{faq.q}</dt>
                    <dd className="mt-2 text-xs text-zinc-500 leading-relaxed">{faq.a}</dd>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="flex flex-col md:flex-row gap-16 items-start">
            <div className="flex-1">
              <h2 className="text-2xl font-bold tracking-tighter uppercase">
                Ready to<br /><span className="text-zinc-700">automate?</span>
              </h2>
            </div>
            <div className="flex gap-3">
              <Button
                className="bg-white text-black hover:bg-zinc-200 text-xs font-bold uppercase tracking-widest"
                onClick={() => window.location.href = '/signup'}
              >
                Get Started
              </Button>
              <Button
                variant="outline"
                className="border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 text-xs font-bold uppercase tracking-widest"
                onClick={() => window.location.href = 'https://raveculture.mintlify.app'}
              >
                Documentation
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
