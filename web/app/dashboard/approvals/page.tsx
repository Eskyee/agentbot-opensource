'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Shield, CheckCircle, XCircle, Clock, AlertTriangle,
  DollarSign, MessageSquare, Globe, Settings, Filter,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'

interface Approval {
  id: string
  agentId: string
  agentName: string
  action: string
  category: string // 'payment' | 'message' | 'api_call' | 'config' | 'external'
  description: string
  payload: Record<string, unknown> | null
  risk: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'approved' | 'denied' | 'expired'
  requestedAt: string
  resolvedAt: string | null
  resolvedBy: string | null
  autoApprove: boolean
}

const riskConfig: Record<string, { color: string; bg: string; label: string }> = {
  low: { color: 'text-emerald-400', bg: 'bg-emerald-400', label: 'Low' },
  medium: { color: 'text-amber-400', bg: 'bg-amber-400', label: 'Medium' },
  high: { color: 'text-orange-400', bg: 'bg-orange-400', label: 'High' },
  critical: { color: 'text-red-400', bg: 'bg-red-400', label: 'Critical' },
}

const categoryConfig: Record<string, { icon: typeof Shield; color: string }> = {
  payment: { icon: DollarSign, color: 'text-purple-400' },
  message: { icon: MessageSquare, color: 'text-blue-400' },
  api_call: { icon: Globe, color: 'text-orange-400' },
  config: { icon: Settings, color: 'text-zinc-400' },
  external: { icon: Globe, color: 'text-sky-400' },
}

export default function ApprovalsPage() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('all')
  const [riskFilter, setRiskFilter] = useState<string>('all')

  const { data: approvals, isLoading } = useQuery<Approval[]>({
    queryKey: ['approvals', filter, riskFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filter !== 'all') params.set('status', filter)
      if (riskFilter !== 'all') params.set('risk', riskFilter)
      const res = await fetch(`/api/dashboard/approvals?${params}`)
      if (!res.ok) throw new Error('Failed to load approvals')
      return res.json()
    },
    refetchInterval: 10_000,
  })

  const resolveMutation = useMutation({
    mutationFn: async ({ id, decision }: { id: string; decision: 'approved' | 'denied' }) => {
      const res = await fetch('/api/dashboard/approvals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, decision }),
      })
      if (!res.ok) throw new Error('Failed to resolve')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] })
    },
  })

  const list = approvals ?? []
  const pending = list.filter((a) => a.status === 'pending')
  const resolved = list.filter((a) => a.status !== 'pending')

  return (
    <DashboardShell>
      <DashboardHeader
        title="Approvals"
        subtitle="Human-in-the-loop — approve or deny agent actions before execution"
        icon={<Shield className="h-5 w-5 text-orange-400" />}
        action={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-px bg-zinc-800 border border-zinc-700">
              {['all', 'pending', 'approved', 'denied'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as typeof filter)}
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 transition-colors',
                    filter === f ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-px bg-zinc-800 border border-zinc-700">
              {['all', 'critical', 'high', 'medium', 'low'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRiskFilter(r)}
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 transition-colors',
                    riskFilter === r ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        }
      />

      <DashboardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-zinc-800">
          {[
            { label: 'Pending', value: pending.length, icon: Clock, color: 'text-amber-400' },
            { label: 'Approved', value: list.filter((a) => a.status === 'approved').length, icon: CheckCircle, color: 'text-emerald-400' },
            { label: 'Denied', value: list.filter((a) => a.status === 'denied').length, icon: XCircle, color: 'text-red-400' },
            { label: 'Critical', value: list.filter((a) => a.risk === 'critical').length, icon: AlertTriangle, color: 'text-red-400' },
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

        {/* Pending approvals */}
        {pending.length > 0 && (
          <div className="border border-amber-500/20 bg-zinc-950 p-5">
            <h2 className="text-sm font-bold text-amber-400 uppercase tracking-tight mb-4">
              ⏳ Pending Approval ({pending.length})
            </h2>
            <div className="space-y-3">
              {pending.map((approval) => {
                const risk = riskConfig[approval.risk]
                const catCfg = categoryConfig[approval.category] ?? categoryConfig.config
                const CatIcon = catCfg.icon
                return (
                  <div
                    key={approval.id}
                    className="border border-zinc-800 bg-black p-4"
                  >
                    <div className="flex items-start gap-4">
                      <CatIcon className={cn('h-5 w-5 shrink-0 mt-0.5', catCfg.color)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-bold text-white">{approval.action}</span>
                          <span className={cn(
                            'text-[9px] uppercase tracking-widest px-1.5 py-0.5 border',
                            risk.color, 'border-current/20'
                          )}>
                            {risk.label} risk
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">{approval.agentName}</span>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">{approval.description}</p>
                        {approval.payload && (
                          <pre className="mt-2 text-[10px] text-zinc-600 font-mono bg-zinc-950 p-2 border border-zinc-800 overflow-x-auto">
                            {JSON.stringify(approval.payload, null, 2)}
                          </pre>
                        )}
                        <div className="text-[10px] text-zinc-600 mt-2">
                          Requested {new Date(approval.requestedAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => resolveMutation.mutate({ id: approval.id, decision: 'approved' })}
                          disabled={resolveMutation.isPending}
                          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-2 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                        >
                          <CheckCircle className="h-3 w-3" />
                          Approve
                        </button>
                        <button
                          onClick={() => resolveMutation.mutate({ id: approval.id, decision: 'denied' })}
                          disabled={resolveMutation.isPending}
                          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <XCircle className="h-3 w-3" />
                          Deny
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* All approvals */}
        <div className="border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-tight mb-4">
            Approval History ({list.length})
          </h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-zinc-800 border-t-orange-500 rounded-full animate-spin" />
            </div>
          ) : list.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">🛡️</p>
              <h3 className="text-sm font-bold text-white uppercase tracking-tight mb-2">No approvals yet</h3>
              <p className="text-xs text-zinc-500">
                When your agents need permission for high-risk actions, approval requests will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {list.map((approval) => {
                const risk = riskConfig[approval.risk]
                const catCfg = categoryConfig[approval.category] ?? categoryConfig.config
                const CatIcon = catCfg.icon
                return (
                  <div
                    key={approval.id}
                    className={cn(
                      'border border-zinc-800 bg-black p-4 flex items-center gap-4',
                      approval.status === 'pending' && 'border-l-2 border-l-amber-400'
                    )}
                  >
                    <CatIcon className={cn('h-4 w-4 shrink-0', catCfg.color)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{approval.action}</span>
                        <span className={cn('text-[9px] uppercase tracking-widest', risk.color)}>
                          {risk.label}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-600 mt-0.5">
                        {approval.agentName} · {new Date(approval.requestedAt).toLocaleString()}
                      </div>
                    </div>
                    <span className={cn(
                      'text-[9px] uppercase tracking-widest px-2 py-0.5 border',
                      approval.status === 'approved' ? 'text-emerald-400 border-emerald-400/20'
                        : approval.status === 'denied' ? 'text-red-400 border-red-400/20'
                        : 'text-amber-400 border-amber-400/20'
                    )}>
                      {approval.status}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DashboardContent>
    </DashboardShell>
  )
}
