'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DollarSign, TrendingUp, Zap, BarChart3, Settings,
  CheckCircle, ArrowRight, Clock, Target,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'

interface PricingTier {
  id: string
  name: string
  model: string // 'subscription' | 'per_resolution' | 'per_task' | 'per_token' | 'hybrid'
  basePrice: number
  unitPrice: number
  unit: string
  description: string
  active: boolean
}

interface UsageMetrics {
  totalResolutions: number
  totalTasks: number
  totalTokens: number
  totalRevenue: number
  avgRevenuePerUnit: number
  conversionRate: number
}

const pricingModels = [
  {
    id: 'subscription',
    name: 'Subscription',
    desc: 'Flat monthly fee. Predictable revenue. Best for steady workloads.',
    icon: Clock,
    color: 'text-blue-400',
    example: '£29/mo — unlimited within plan limits',
  },
  {
    id: 'per_resolution',
    name: 'Per Resolution',
    desc: 'Pay per successful outcome. Agent only earns when it delivers. Best for support.',
    icon: CheckCircle,
    color: 'text-emerald-400',
    example: '$0.99 per resolved ticket',
  },
  {
    id: 'per_task',
    name: 'Per Task',
    desc: 'Pay per completed task. Clear unit economics. Best for automation.',
    icon: Target,
    color: 'text-orange-400',
    example: '$0.50 per task executed',
  },
  {
    id: 'per_token',
    name: 'Per Token',
    desc: 'Pay-as-you-go. Scales with usage. Best for variable workloads.',
    icon: Zap,
    color: 'text-orange-400',
    example: '$0.001 per 1K tokens',
  },
  {
    id: 'hybrid',
    name: 'Hybrid',
    desc: 'Base subscription + usage overage. Best of both worlds.',
    icon: BarChart3,
    color: 'text-sky-400',
    example: '£29/mo base + $0.05 per 1K tokens over quota',
  },
]

export default function PricingModelPage() {
  const queryClient = useQueryClient()
  const [selectedModel, setSelectedModel] = useState<string>('subscription')

  const { data: metrics } = useQuery<UsageMetrics>({
    queryKey: ['pricing-metrics'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/pricing-model')
      if (!res.ok) throw new Error('Failed to load metrics')
      return res.json()
    },
  })

  const { data: tiers } = useQuery<PricingTier[]>({
    queryKey: ['pricing-tiers'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/pricing-model?tiers=true')
      if (!res.ok) return []
      return res.json()
    },
  })

  return (
    <DashboardShell>
      <DashboardHeader
        title="Pricing Models"
        subtitle="Configure how your agents charge — subscriptions, per-resolution, per-task, or hybrid"
        icon={<DollarSign className="h-5 w-5 text-orange-400" />}
      />

      <DashboardContent className="space-y-6">
        {/* Revenue metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-zinc-800">
          {[
            { label: 'Total Revenue', value: `$${(metrics?.totalRevenue ?? 0).toFixed(2)}`, icon: DollarSign, color: 'text-emerald-400' },
            { label: 'Resolutions', value: metrics?.totalResolutions?.toLocaleString() ?? '0', icon: CheckCircle, color: 'text-blue-400' },
            { label: 'Tasks Completed', value: metrics?.totalTasks?.toLocaleString() ?? '0', icon: Target, color: 'text-orange-400' },
            { label: 'Avg Revenue/Unit', value: `$${(metrics?.avgRevenuePerUnit ?? 0).toFixed(4)}`, icon: TrendingUp, color: 'text-orange-400' },
          ].map((s) => (
            <div key={s.label} className="bg-zinc-950 p-5 border border-zinc-800">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-zinc-600 mb-1">
                <s.icon className={cn('h-3 w-3', s.color)} />
                {s.label}
              </div>
              <div className={cn('text-2xl font-mono font-bold', s.color)}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Pricing model selector */}
        <div className="border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-tight mb-4">
            Choose Pricing Model
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-800">
            {pricingModels.map((model) => {
              const Icon = model.icon
              return (
                <div
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className={cn(
                    'bg-zinc-950 p-5 cursor-pointer transition-all border-2',
                    selectedModel === model.id
                      ? 'border-orange-500 bg-orange-500/5'
                      : 'border-transparent hover:bg-zinc-900'
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={cn('h-4 w-4', model.color)} />
                    <span className="text-xs font-bold text-white uppercase tracking-tight">
                      {model.name}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed mb-2">{model.desc}</p>
                  <code className="text-[9px] font-mono text-zinc-600 bg-black px-2 py-0.5 border border-zinc-800">
                    {model.example}
                  </code>
                </div>
              )
            })}
          </div>
        </div>

        {/* Outcome-based deep dive */}
        {selectedModel === 'per_resolution' && (
          <div className="border border-emerald-500/20 bg-zinc-950 p-5">
            <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-tight mb-4">
              Per-Resolution Pricing
            </h2>
            <div className="space-y-4 text-zinc-400 text-sm leading-relaxed max-w-lg">
              <p>
                Your agent only charges when it successfully resolves a task. If the customer
                isn't satisfied or the issue escalates to a human — no charge. This aligns
                your incentives with your users.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="border border-zinc-800 bg-black p-3">
                  <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Resolution Rate</div>
                  <div className="text-lg font-bold text-emerald-400">
                    {metrics ? `${((metrics.conversionRate ?? 0) * 100).toFixed(0)}%` : '—'}
                  </div>
                </div>
                <div className="border border-zinc-800 bg-black p-3">
                  <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Price Per Resolution</div>
                  <div className="text-lg font-bold text-white">$0.99</div>
                </div>
              </div>
              <p className="text-[10px] text-zinc-600">
                Inspired by Intercom's Fin model. Configure your resolution price below.
              </p>
            </div>
          </div>
        )}

        {/* Token-based deep dive */}
        {selectedModel === 'per_token' && (
          <div className="border border-orange-500/20 bg-zinc-950 p-5">
            <h2 className="text-sm font-bold text-orange-400 uppercase tracking-tight mb-4">
              Per-Token Pricing
            </h2>
            <div className="space-y-4 text-zinc-400 text-sm leading-relaxed max-w-lg">
              <p>
                Pure pay-as-you-go. Users buy token credits and your agent consumes them
                per request. Best for variable workloads where usage spikes unpredictably.
              </p>
              <div className="border border-zinc-800 bg-black p-3">
                <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Tokens Used</div>
                <div className="text-lg font-bold text-orange-400">
                  {metrics?.totalTokens?.toLocaleString() ?? '0'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hybrid deep dive */}
        {selectedModel === 'hybrid' && (
          <div className="border border-sky-500/20 bg-zinc-950 p-5">
            <h2 className="text-sm font-bold text-sky-400 uppercase tracking-tight mb-4">
              Hybrid Pricing
            </h2>
            <div className="space-y-4 text-zinc-400 text-sm leading-relaxed max-w-lg">
              <p>
                Base subscription covers predictable usage. Overage charges kick in when
                users exceed their plan quota. This is how Agentbot's current plans work —
                and it's the most popular model in SaaS right now (43% of companies use hybrid).
              </p>
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="border border-zinc-800 bg-black p-3">
                  <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Base</div>
                  <div className="text-lg font-bold text-white">£29</div>
                </div>
                <div className="border border-zinc-800 bg-black p-3">
                  <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Included</div>
                  <div className="text-lg font-bold text-white">500K</div>
                </div>
                <div className="border border-zinc-800 bg-black p-3">
                  <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Overage</div>
                  <div className="text-lg font-bold text-sky-400">$0.05/1K</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* All plans comparison */}
        <div className="border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-tight mb-4">
            Current Plan Structure
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-800">
            {[
              { name: 'Solo', price: '£29', tokens: '500K', agents: 1, features: ['1 Agent', 'MiMo V2.5 Pro', 'Telegram + Discord'] },
              { name: 'Collective', price: '£69', tokens: '2M', agents: 3, features: ['3 Agents', 'Custom Workflows', 'Priority Support'] },
              { name: 'Label', price: '£149', tokens: '5M', agents: 10, features: ['10 Agents', 'Team Management', 'API Access'] },
              { name: 'Network', price: '£499', tokens: '20M', agents: 999, features: ['Unlimited Agents', 'Dedicated Infra', 'Custom Models'] },
            ].map((plan) => (
              <div key={plan.name} className="bg-zinc-950 p-5">
                <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">{plan.name}</div>
                <div className="text-2xl font-bold text-white mb-1">{plan.price}<span className="text-xs text-zinc-500">/mo</span></div>
                <div className="text-xs text-zinc-500 mb-3">{plan.tokens} tokens included</div>
                <div className="space-y-1">
                  {plan.features.map((f) => (
                    <div key={f} className="text-[10px] text-zinc-600 flex items-center gap-1.5">
                      <CheckCircle className="h-3 w-3 text-emerald-400" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DashboardContent>
    </DashboardShell>
  )
}
