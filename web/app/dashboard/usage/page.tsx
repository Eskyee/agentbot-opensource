'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, BarChart3, Globe2, Zap } from 'lucide-react'

type UsageData = {
  plan: string
  subscriptionStatus: string
  isAdmin: boolean
  isPaid: boolean
  usage: {
    generationsToday: number
    dailyLimit: number | string
    remaining: number | string
  }
  projects: number
  published: number
}

export default function UsagePage() {
  const [data, setData] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/playground/usage')
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white font-mono">
        <div className="max-w-4xl mx-auto px-6 py-24">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600">Loading…</div>
        </div>
      </main>
    )
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-black text-white font-mono">
        <div className="max-w-4xl mx-auto px-6 py-24">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600">Sign in to view usage</div>
        </div>
      </main>
    )
  }

  const usagePercent = typeof data.usage.dailyLimit === 'number'
    ? Math.min(100, (data.usage.generationsToday / data.usage.dailyLimit) * 100)
    : 0

  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <div className="max-w-4xl mx-auto px-6 py-24">
        <Link href="/playground" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-600 hover:text-white mb-8">
          <ArrowLeft className="h-3 w-3" />
          Back to Playground
        </Link>

        <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Dashboard / Usage</div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter uppercase leading-[0.9]">
          Your usage
        </h1>
        <p className="mt-4 text-sm text-zinc-500">
          Track your playground activity, generations, and deployments.
        </p>

        <div className="mt-12 grid gap-px bg-zinc-900 sm:grid-cols-3">
          <div className="bg-black p-6">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-600">
              <Zap className="h-3 w-3" />
              Generations today
            </div>
            <div className="mt-3 text-3xl font-bold tracking-tighter">
              {data.usage.generationsToday}
              <span className="text-sm font-normal text-zinc-600">
                / {data.usage.dailyLimit}
              </span>
            </div>
            {typeof data.usage.dailyLimit === 'number' && (
              <div className="mt-3 h-1.5 bg-zinc-900">
                <div
                  className={`h-full transition-all ${usagePercent > 80 ? 'bg-red-500' : usagePercent > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            )}
            <div className="mt-2 text-[10px] text-zinc-600">
              {typeof data.usage.remaining === 'number'
                ? `${data.usage.remaining} remaining today`
                : 'Unlimited'}
            </div>
          </div>

          <div className="bg-black p-6">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-600">
              <BarChart3 className="h-3 w-3" />
              Projects
            </div>
            <div className="mt-3 text-3xl font-bold tracking-tighter">{data.projects}</div>
            <div className="mt-2 text-[10px] text-zinc-600">Total saved projects</div>
          </div>

          <div className="bg-black p-6">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-600">
              <Globe2 className="h-3 w-3" />
              Published
            </div>
            <div className="mt-3 text-3xl font-bold tracking-tighter">{data.published}</div>
            <div className="mt-2 text-[10px] text-zinc-600">Deployed to production</div>
          </div>
        </div>

        <div className="mt-8 border border-zinc-900 p-6">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Plan details</div>
          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Current plan</span>
              <span className="text-white font-bold uppercase">{data.plan}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Status</span>
              <span className={data.isPaid ? 'text-green-500' : 'text-zinc-400'}>
                {data.isPaid ? 'Active' : data.isAdmin ? 'Admin' : 'Free'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Daily limit</span>
              <span className="text-white">{data.usage.dailyLimit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Generations today</span>
              <span className="text-white">{data.usage.generationsToday}</span>
            </div>
          </div>
          {!data.isPaid && !data.isAdmin && (
            <Link
              href="/pricing"
              className="mt-6 block w-full bg-white py-3 text-center text-[10px] font-bold uppercase tracking-widest text-black hover:bg-zinc-200"
            >
              Upgrade for unlimited
            </Link>
          )}
        </div>
      </div>
    </main>
  )
}
