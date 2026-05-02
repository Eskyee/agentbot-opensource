'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Loader2, Music2, Radio, Zap } from 'lucide-react'

const SLOTS = [
  {
    key:        'spot',
    name:       '30-Second Spot',
    price:      49,
    broadcasts: 5,
    duration:   '1 week',
    ideal:      'Quick announcements, event promos, product drops',
    features:   ['5 scheduled broadcasts', '1-week run', 'baseFM live placements', 'Mux-hosted audio'],
  },
  {
    key:        'feature',
    name:       '60-Second Feature',
    price:      119,
    broadcasts: 15,
    duration:   '2 weeks',
    ideal:      'Artists, labels, DJ residencies, tech products',
    features:   ['15 scheduled broadcasts', '2-week run', 'baseFM + Agentbot placements', 'Mux-hosted audio', 'Priority scheduling'],
  },
  {
    key:        'campaign',
    name:       '4-Week Campaign',
    price:      299,
    broadcasts: 40,
    duration:   '4 weeks',
    ideal:      'Major campaigns, label releases, platform launches',
    features:   ['40 scheduled broadcasts', '4-week run', 'baseFM + Agentbot network', 'Mux-hosted audio', 'Priority scheduling', 'Admin campaign report'],
    highlighted: true,
  },
] as const

const CATEGORIES = [
  { value: 'ai-tech',    label: 'AI & Tech' },
  { value: 'dj',         label: 'DJ / Producer' },
  { value: 'music',      label: 'Music / Label' },
  { value: 'events',     label: 'Events / Promoter' },
  { value: 'autonomous',label: 'Factory Culture' },
  { value: 'x-creator',  label: 'X / Creator' },
  { value: 'general',    label: 'General' },
]

export default function AdvertisePage() {
  const [selected, setSelected]   = useState<'spot' | 'feature' | 'campaign'>('feature')
  const [step, setStep]           = useState<'select' | 'form' | 'loading'>('select')
  const [error, setError]         = useState('')
  const [form, setForm]           = useState({
    advertiserName:  '',
    advertiserEmail: '',
    advertiserUrl:   '',
    contactHandle:   '',
    title:           '',
    description:     '',
    category:        'general',
  })

  const slot = SLOTS.find((s) => s.key === selected)!

  function update(key: keyof typeof form, val: string) {
    setForm((f) => ({ ...f, [key]: val }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setStep('loading')

    const res = await fetch('/api/ads/campaigns', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ...form, slotType: selected }),
    })
    const data = await res.json()

    if (!res.ok || !data.checkoutUrl) {
      setError(data.error || 'Something went wrong. Please try again.')
      setStep('form')
      return
    }

    window.location.href = data.checkoutUrl
  }

  return (
    <main className="min-h-screen bg-black px-4 py-16 sm:px-8">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="mb-12">
          <div className="mb-4 flex items-center gap-2.5">
            <Radio className="h-5 w-5 text-zinc-500" />
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-600">baseFM Advertising</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Reach the autonomous.
          </h1>
          <p className="mt-4 max-w-xl text-zinc-400">
            Advertise on baseFM and Agentbot — the platform for AI agents, DJs, producers, and music culture.
            Your audio ad airs as a sponsored broadcast between live sets, heard by an engaged community of
            early adopters, artists, and technologists.
          </p>
          <div className="mt-5 flex flex-wrap gap-4 text-sm text-zinc-500">
            <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-green-600" /> Audio-first advertising</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-green-600" /> Scheduled baseFM broadcasts</span>
            <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-amber-500" /> 50% off with active Agentbot plan</span>
          </div>
        </div>

        {step === 'select' && (
          <>
            {/* Slot selection */}
            <div className="grid gap-4 sm:grid-cols-3 mb-8">
              {SLOTS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSelected(s.key)}
                  className={`relative rounded-[24px] border p-5 text-left transition-all ${
                    selected === s.key
                      ? 'border-white bg-zinc-900'
                      : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                  }`}
                >
                  {'highlighted' in s && s.highlighted && (
                    <span className="absolute -top-2.5 left-4 rounded-full bg-white px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-black">
                      Best Value
                    </span>
                  )}
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">{s.duration}</p>
                  <p className="mt-2 text-base font-bold text-white">{s.name}</p>
                  <p className="mt-1 text-2xl font-bold text-white">£{s.price}</p>
                  <p className="mt-0.5 text-[10px] text-zinc-600">{s.broadcasts} broadcasts</p>
                  <ul className="mt-4 space-y-1.5">
                    {s.features.map((f) => (
                      <li key={f} className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <CheckCircle className="h-3 w-3 shrink-0 text-zinc-600" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-[10px] text-zinc-600 italic">{s.ideal}</p>
                </button>
              ))}
            </div>

            {/* Subscriber discount callout */}
            <div className="mb-8 rounded-[20px] border border-amber-500/20 bg-amber-500/5 px-5 py-4">
              <div className="flex items-start gap-3">
                <Zap className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-300">Active Agentbot subscribers get 50% off</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Log in with your Agentbot account before submitting — the discount is applied automatically at checkout.
                    {' '}<Link href="/dashboard" className="text-amber-400 hover:text-amber-300 underline underline-offset-2">Go to dashboard →</Link>
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep('form')}
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-black transition-colors hover:bg-zinc-200"
            >
              Continue with {slot.name}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </>
        )}

        {(step === 'form' || step === 'loading') && (
          <form onSubmit={submit} className="space-y-6">
            <button
              type="button"
              onClick={() => setStep('select')}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              ← Back to slot selection
            </button>

            <div className="rounded-[20px] border border-zinc-800 bg-zinc-900/60 px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Selected</p>
              <p className="mt-1 text-sm font-bold text-white">{slot.name} — £{slot.price}</p>
              <p className="text-xs text-zinc-500">{slot.broadcasts} broadcasts · {slot.duration}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.16em] text-zinc-500 mb-1.5">Your Name / Brand *</label>
                <input
                  value={form.advertiserName}
                  onChange={(e) => update('advertiserName', e.target.value)}
                  placeholder="Jungle Lab Records"
                  required
                  disabled={step === 'loading'}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.16em] text-zinc-500 mb-1.5">Email *</label>
                <input
                  type="email"
                  value={form.advertiserEmail}
                  onChange={(e) => update('advertiserEmail', e.target.value)}
                  placeholder="you@label.com"
                  required
                  disabled={step === 'loading'}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.16em] text-zinc-500 mb-1.5">Website / Link</label>
                <input
                  value={form.advertiserUrl}
                  onChange={(e) => update('advertiserUrl', e.target.value)}
                  placeholder="https://yourlabel.com"
                  disabled={step === 'loading'}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.16em] text-zinc-500 mb-1.5">X / Social Handle</label>
                <input
                  value={form.contactHandle}
                  onChange={(e) => update('contactHandle', e.target.value)}
                  placeholder="@yourhandle"
                  disabled={step === 'loading'}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.16em] text-zinc-500 mb-1.5">Campaign Title *</label>
              <input
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder="New EP out now — Jungle Lab Records"
                required
                disabled={step === 'loading'}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.16em] text-zinc-500 mb-1.5">Description / Brief</label>
              <textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                placeholder="What you're promoting, tone, key message, any links to include in show notes..."
                rows={3}
                disabled={step === 'loading'}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none disabled:opacity-50 resize-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.16em] text-zinc-500 mb-1.5">Category</label>
              <select
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
                disabled={step === 'loading'}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white focus:border-zinc-600 focus:outline-none disabled:opacity-50"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {error && (
              <div className="rounded-xl border border-orange-500/20 bg-orange-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="rounded-[20px] border border-zinc-800/60 bg-zinc-900/40 px-5 py-4 text-xs text-zinc-500 space-y-1">
              <p>After payment you&apos;ll upload your audio file (MP3, WAV — up to your slot length).</p>
              <p>Our team reviews and approves all campaigns within 24 hours. Audio must comply with our content policy.</p>
              <p>Broadcasts are scheduled and run automatically on baseFM between live DJ sets.</p>
            </div>

            <button
              type="submit"
              disabled={step === 'loading'}
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {step === 'loading' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
              {step === 'loading' ? 'Redirecting to checkout…' : `Pay £${slot.price} and Continue`}
            </button>
          </form>
        )}

        {/* Trust signals */}
        <div className="mt-16 grid gap-6 sm:grid-cols-3 border-t border-zinc-900 pt-12">
          {[
            { icon: Radio,   title: 'Live Radio Placement',  body: 'Ads broadcast between DJ sets on baseFM — not banner ads, real audio.' },
            { icon: Music2,  title: 'Culture-First Audience', body: 'Factory music, AI agents, sound systems, and early adopters.' },
            { icon: Zap,     title: 'Agentbot Network',       body: 'Your ad is heard across the baseFM and Agentbot platform simultaneously.' },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="space-y-2">
              <Icon className="h-5 w-5 text-zinc-600" />
              <p className="text-sm font-semibold text-zinc-300">{title}</p>
              <p className="text-xs text-zinc-500">{body}</p>
            </div>
          ))}
        </div>

      </div>
    </main>
  )
}
