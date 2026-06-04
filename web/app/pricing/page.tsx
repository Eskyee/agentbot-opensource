'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Check, ChevronDown } from 'lucide-react'

function FAQItem({ question, answer, isFirst }: { question: string; answer: string; isFirst: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      {!isFirst && <Separator className="bg-zinc-800" />}
      <button onClick={() => setOpen(!open)} className="w-full py-6 flex items-center justify-between text-left">
        <dt className="text-sm font-bold text-white uppercase tracking-wider pr-4">{question}</dt>
        <ChevronDown className={`h-4 w-4 text-zinc-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <dd className="pb-6 text-sm text-zinc-400 leading-relaxed">{answer}</dd>}
    </div>
  )
}

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '0',
    features: ['1 agent, 24/7 runtime', 'All channels (Telegram, Discord, WhatsApp, X)', 'All 50+ skills', 'Full dashboard + approval queue', 'Bring your own MiMo key (plans from $6/mo)'],
    popular: false,
    badge: 'BYOK',
  },
  {
    id: 'solo',
    name: 'Solo',
    price: '29',
    features: ['1 agent, 24/7 runtime', 'MiMo Standard included — 11B credits/mo', 'All channels (Telegram, Discord, WhatsApp, X)', 'All 50+ skills + daily digests', 'Flat rate — no per-token charges, no surprise bills'],
    popular: false,
  },
  {
    id: 'collective',
    name: 'Collective',
    price: '69',
    features: ['3 agents, 24/7 runtime', 'MiMo Pro included — 38B credits/mo', 'All channels + custom workflows', 'Thread drafting + auto-replies', 'Priority support (24h response)'],
    popular: true,
  },
  {
    id: 'label',
    name: 'Label',
    price: '149',
    features: ['10 agents, 24/7 runtime', 'MiMo Max included — 82B credits/mo', 'Team management (roles, permissions)', 'API access + webhooks', 'White-label (your brand, our infra)'],
    popular: false,
  },
  {
    id: 'network',
    name: 'Network',
    price: '499',
    features: ['Unlimited agents, 24/7 runtime', 'Everything in Label', 'Dedicated infrastructure (isolated)', 'Custom models (bring any provider)', '99.9% SLA guarantee'],
    popular: false,
  },
]

const paymentMethods = ['Visa', 'Mastercard', 'Apple Pay', 'Google Pay', 'PayPal', 'USDC']

const faqs = [
  {
    q: 'What is the Free plan?',
    a: 'The Free plan gives you a full Agentbot agent — all channels, all skills, full dashboard — for £0/mo. You just need to bring your own MiMo API key from mimo.xiaomi.com. MiMo Token Plans start at $6/mo (Lite, 4.1B credits) and go up to $100/mo (Max, 82B credits). We charge nothing for the platform.',
  },
  {
    q: 'What MiMo plan should I buy for BYOK?',
    a: 'For most users, the Standard plan ($16/mo, 11B credits) is plenty. If your agent runs heavy workloads (24/7 monitoring, multiple channels, code generation), go Pro ($50/mo, 38B credits). The Max plan ($100/mo, 82B credits) is for power users running multiple agents. The Lite plan ($6/mo, 4.1B credits) works for light use — a few messages per day. All plans include 20% off during off-peak hours (9AM-5PM PDT) and free TTS access for a limited time.',
  },
  {
    q: 'What is BYOK?',
    a: 'BYOK stands for Bring Your Own Key. You provide your own MiMo subscription API key, and your agent runs on your credits. This is how we offer the free plan — you pay MiMo directly, we handle the platform.',
  },
  {
    q: 'What does "MiMo included" mean?',
    a: 'Each paid plan includes a specific MiMo Token Plan tier — you dont need to buy a separate subscription. Solo includes Standard (11B credits/mo), Collective includes Pro (38B credits/mo), and Label includes Max (82B credits/mo). Your agent runs on these credits — no per-token charges, no surprise bills.',
  },
  {
    q: 'What is the difference between Free and Solo?',
    a: 'Free requires your own MiMo key (BYOK). Solo includes MiMo Standard credits (11B/mo) — no key needed, we handle everything. Both give you 1 agent with full features, all channels, all skills.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit cards through Stripe, or USDC on Base via x402.',
  },
  {
    q: 'Can I change plans later?',
    a: 'Yes. Upgrade or downgrade at any time from your dashboard. OpenClaw seats can be added incrementally on Collective+ tiers.',
  },
  {
    q: 'Is 1 vCPU / 2 GB enough for OpenClaw?',
    a: 'It is enough to boot and run light workloads, but we treat it as a trial/light-use floor. For serious production we recommend at least 2 vCPU / 4 GB, and more if you rely on browser automation, multiple channels, or heavier tool use.',
  },
]

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Hero */}
        <section className="mb-16">
          <div className="max-w-2xl">
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-8">Pricing</span>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-[0.9]">
              Start free. Scale <span className="text-orange-500">when ready.</span>
            </h1>
            <p className="text-zinc-400 text-sm max-w-md leading-relaxed mt-8">
              Bring your own MiMo key and use Agentbot for free — forever. Or let us handle everything from £29/mo.
            </p>
          </div>
        </section>

        {/* What's included */}
        <section className="border-t border-zinc-800 pt-16 mb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-3">Agentbot</span>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-4">Creative Crew</h4>
              <ul className="space-y-2 text-xs text-zinc-500">
                <li>Fan engagement (Telegram/WhatsApp)</li>
                <li>BlockDB queries for A&R</li>
                <li>Base FM submissions</li>
                <li>Visual artwork generation</li>
              </ul>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-3">OpenClaw</span>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-4">Business Operations</h4>
              <ul className="space-y-2 text-xs text-zinc-500">
                <li>Email inbox management</li>
                <li>Contract/Rider analysis (PDF)</li>
                <li>Web scraping (gig listings)</li>
                <li>x402 USDC invoicing</li>
              </ul>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-3">You Provide</span>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-4">Your Own Keys</h4>
              <ul className="space-y-2 text-xs text-zinc-500">
                <li>MiMo Token Plan (from $6/mo)</li>
                <li>Or use any OpenAI, Anthropic, Ollama key</li>
                <li>No markup — wholesale rates</li>
                <li>Switch models anytime</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Plan Cards */}
        <section className="border-t border-zinc-800 pt-16 mb-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-px bg-zinc-800">
            {plans.map((plan) => (
              <div key={plan.id} className="bg-black p-8 flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500">{plan.name}</span>
                  {plan.badge && (
                    <span className="text-[9px] uppercase tracking-widest text-orange-500 border border-orange-500/30 px-2 py-0.5">
                      {plan.badge}
                    </span>
                  )}
                  {plan.popular && (
                    <span className="text-[9px] uppercase tracking-widest text-orange-500 border border-orange-500/30 px-2 py-0.5">
                      Popular
                    </span>
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
                      : 'border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500'
                  }`}
                  onClick={() => window.location.href = plan.id === 'free' ? '/signup?plan=free' : `/api/stripe/checkout?plan=${plan.id}`}
                >
                  {plan.id === 'free' ? 'Start Free' : 'Deploy'}
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* MiMo Token Plans (BYOK) */}
        <section className="border-t border-zinc-800 pt-16 mb-16">
          <div className="max-w-2xl mb-12">
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-4">Powered By</span>
            <h2 className="text-2xl font-bold tracking-tighter uppercase mb-4">
              Xiaomi MiMo Token Plans
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              All Agentbot agents run on MiMo V2.5 Pro. BYOK users buy a MiMo subscription directly — we never markup or resell. Choose the plan that fits your usage.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-800">
            {[
              { name: 'Lite', price: '$6', credits: '4.1B', use: 'Light use — a few messages/day', badge: '' },
              { name: 'Standard', price: '$16', credits: '11B', use: 'Most users — plenty for daily agent use', badge: 'Popular' },
              { name: 'Pro', price: '$50', credits: '38B', use: 'Heavy workloads — 24/7 monitoring, multi-channel', badge: '' },
              { name: 'Max', price: '$100', credits: '82B', use: 'Power users — multiple agents, code generation', badge: 'Best Value' },
            ].map((plan) => (
              <div key={plan.name} className="bg-black p-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500">MiMo {plan.name}</span>
                  {plan.badge && (
                    <span className="text-[9px] uppercase tracking-widest text-orange-500 border border-orange-500/30 px-2 py-0.5">
                      {plan.badge}
                    </span>
                  )}
                </div>
                <div className="text-2xl font-bold tracking-tighter mb-1">
                  {plan.price}<span className="text-sm font-normal text-zinc-600">/mo</span>
                </div>
                <div className="text-xs text-orange-500 font-bold mb-4">{plan.credits} credits</div>
                <p className="text-xs text-zinc-500 mb-4">{plan.use}</p>
                <ul className="space-y-1 text-[11px] text-zinc-600">
                  <li>• All 9 MiMo models included</li>
                  <li>• 20% off off-peak (9AM-5PM PDT)</li>
                  <li>• Free TTS (limited time)</li>
                </ul>
                <Button
                  variant="outline"
                  className="w-full mt-6 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 text-[10px] font-bold uppercase tracking-widest"
                  onClick={() => window.open('https://mimo.xiaomi.com', '_blank')}
                >
                  Subscribe at mimo.xiaomi.com
                </Button>
              </div>
            ))}
          </div>
          <p className="mt-6 text-[11px] text-zinc-600">
            All plans include access to mimo-v2.5-pro, mimo-v2.5, mimo-v2.5-asr, mimo-v2.5-tts, and the full V2 series. Cancel anytime.
          </p>

          {/* Pay-as-you-go rates */}
          <div className="mt-12 border border-zinc-800 p-8">
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-4">Pay-as-you-go Rates</span>
            <p className="text-xs text-zinc-500 mb-6">No subscription? Use MiMo pay-as-you-go. Cache hits are 120x cheaper thanks to HiCache optimization.</p>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <div className="text-xs font-bold text-white uppercase tracking-wider mb-2">MiMo-V2.5-Pro</div>
                <ul className="space-y-1 text-[11px] text-zinc-500">
                  <li>Input (cache hit): <span className="text-orange-500">$0.0036</span> / 1M tokens</li>
                  <li>Input (cache miss): $0.435 / 1M tokens</li>
                  <li>Output: $0.87 / 1M tokens</li>
                </ul>
              </div>
              <div>
                <div className="text-xs font-bold text-white uppercase tracking-wider mb-2">MiMo-V2.5</div>
                <ul className="space-y-1 text-[11px] text-zinc-500">
                  <li>Input (cache hit): <span className="text-orange-500">$0.0028</span> / 1M tokens</li>
                  <li>Input (cache miss): $0.14 / 1M tokens</li>
                  <li>Output: $0.28 / 1M tokens</li>
                </ul>
              </div>
            </div>
            <p className="mt-4 text-[10px] text-zinc-600">TTS models remain free for a limited time. All V2 models auto-route to V2.5.</p>
          </div>
        </section>

        {/* Expert Setup CTA */}
        <section className="border-t border-zinc-800 pt-16 mb-16">
          <div className="max-w-2xl">
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-4">Need Help?</span>
            <h2 className="text-2xl font-bold tracking-tighter uppercase mb-4">
              Live 1-on-1 Setup
            </h2>
            <p className="text-sm text-zinc-400 mb-6">
              Don't want to figure it out alone? Book a 1-hour live screen share session with our team to get your agent configured and running.
            </p>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-3xl font-bold">£49</span>
              <span className="text-zinc-500 text-sm">/ session</span>
            </div>
            <Button
              variant="outline"
              className="border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 text-xs font-bold uppercase tracking-widest"
              onClick={() => window.location.href = '/expert-setup'}
            >
              Book Expert Setup
            </Button>
          </div>
        </section>

        {/* Payment Methods */}
        <section className="border-t border-zinc-800 pt-16 mb-16">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-6">Accepted Payment Methods</div>
          <div className="flex flex-wrap gap-3">
            {paymentMethods.map((method) => (
              <span key={method} className="border border-zinc-800 text-zinc-500 text-[10px] uppercase tracking-widest px-3 py-1">
                {method}
              </span>
            ))}
          </div>
          <p className="mt-6 text-xs text-zinc-600">
            Secure payments via Stripe. Crypto optional — use USDC on Base for discounts.
          </p>
        </section>

        {/* FAQ */}
        <section className="border-t border-zinc-800 pt-20 mb-16">
          <div className="max-w-2xl">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Support</div>
            <h2 className="text-2xl font-bold tracking-tighter uppercase mb-12">
              Frequently Asked<br /><span className="text-zinc-700">Questions</span>
            </h2>

            <div className="space-y-0">
              {faqs.map((faq, i) => (
                <FAQItem key={i} question={faq.q} answer={faq.a} isFirst={i === 0} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-zinc-800 pt-20">
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
                className="border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 text-xs font-bold uppercase tracking-widest"
                onClick={() => window.location.href = 'https://raveculture.mintlify.app'}
              >
                Documentation
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
