'use client'

import { FormEvent, useState } from 'react'
import { Download, Medal, ShieldCheck, Vote } from 'lucide-react'
import type { CommunityProgramData } from '@/app/lib/communityProgram'

interface CommunityProgramPanelProps {
  initialProgram: CommunityProgramData
  admin: boolean
}

function formatDate(value: string | null) {
  if (!value) return 'Open'
  return new Date(value).toLocaleDateString()
}

export function CommunityProgramPanel({
  initialProgram,
  admin,
}: CommunityProgramPanelProps) {
  const [program, setProgram] = useState(initialProgram)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pendingVote, setPendingVote] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    title: '',
    summary: '',
    details: '',
    endsAt: '',
  })

  const refreshProgram = async () => {
    const res = await fetch('/api/community/program')
    if (!res.ok) {
      throw new Error('Unable to refresh community program')
    }
    const next = await res.json()
    setProgram(next)
  }

  const submitVote = async (proposalId: string, choice: 'yes' | 'no' | 'abstain') => {
    setPendingVote(`${proposalId}:${choice}`)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch(`/api/community/governance/${proposalId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ choice }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Vote failed')
      await refreshProgram()
      setSuccess('Vote recorded.')
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Vote failed')
    } finally {
      setPendingVote(null)
    }
  }

  const createProposal = async (event: FormEvent) => {
    event.preventDefault()
    setCreating(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/community/governance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Failed to create proposal')
      await refreshProgram()
      setForm({ title: '', summary: '', details: '', endsAt: '' })
      setSuccess('Proposal created.')
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to create proposal')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[28px] border border-zinc-800 bg-zinc-950/80 p-6">
          <div className="flex items-start gap-3">
            <Medal className="mt-0.5 h-5 w-5 text-amber-300" />
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Founding Badge</div>
              <div className="mt-3 text-lg font-bold uppercase tracking-tight text-white">
                {program.foundingBadge?.title || 'Locked'}
              </div>
              <div className="mt-2 text-sm leading-6 text-zinc-400">
                {program.foundingBadge
                  ? `${program.foundingBadge.detail || 'Founding badge active'} Claimed ${formatDate(program.foundingBadge.createdAt)}.`
                  : 'Claim your holder rewards to mint your founding community status inside Agentbot.'}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-zinc-800 bg-zinc-950/80 p-6">
          <div className="flex items-start gap-3">
            <Vote className="mt-0.5 h-5 w-5 text-orange-500" />
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Governance Power</div>
              <div className="mt-3 text-lg font-bold uppercase tracking-tight text-white">
                {program.governance.eligible ? `${program.governance.votingPower}x vote power` : 'Claim required'}
              </div>
              <div className="mt-2 text-sm leading-6 text-zinc-400">
                {program.governance.eligible
                  ? 'You can vote on community proposals tied to product perks, roadmap priorities, and holder utility.'
                  : 'Wallet claim status unlocks community governance inside Agentbot.'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-zinc-800 bg-zinc-950/80 p-6">
        <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Unlocked Perks</div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {program.perks.map((perk) => (
            <div
              key={perk.key}
              className={`rounded-2xl border p-5 ${
                perk.unlocked
                  ? 'border-emerald-500/20 bg-emerald-500/10'
                  : 'border-zinc-800 bg-black'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-bold uppercase tracking-[0.12em] text-white">{perk.title}</div>
                {perk.unlocked ? <ShieldCheck className="h-4 w-4 text-emerald-300" /> : null}
              </div>
              <div className="mt-2 text-sm leading-6 text-zinc-400">{perk.detail}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[28px] border border-zinc-800 bg-zinc-950/80 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Governance</div>
            <div className="mt-3 text-xl font-bold uppercase tracking-tight text-white">Community proposals</div>
          </div>

          {admin ? (
            <a
              href="/api/community/export?format=csv"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-200 hover:border-zinc-500 hover:text-white"
            >
              <Download className="h-3.5 w-3.5" />
              Export holders
            </a>
          ) : null}
        </div>

        <div className="mt-6 space-y-4">
          {program.governance.proposals.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-black p-5 text-sm text-zinc-400">
              No active community proposals yet.
            </div>
          ) : (
            program.governance.proposals.map((proposal) => (
              <div key={proposal.id} className="rounded-2xl border border-zinc-800 bg-black p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="max-w-2xl">
                    <div className="text-sm font-bold uppercase tracking-[0.12em] text-white">{proposal.title}</div>
                    <div className="mt-2 text-sm leading-6 text-zinc-400">{proposal.summary}</div>
                    {proposal.details ? (
                      <div className="mt-2 text-xs leading-6 text-zinc-500">{proposal.details}</div>
                    ) : null}
                    <div className="mt-3 text-[10px] uppercase tracking-[0.18em] text-zinc-600">
                      {proposal.status} · ends {formatDate(proposal.endsAt)}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs uppercase tracking-widest">
                    <div className="rounded-xl border border-zinc-800 px-3 py-2 text-zinc-300">
                      <div className="text-zinc-600">Yes</div>
                      <div className="mt-1 text-sm font-bold text-white">{proposal.totals.yes}</div>
                    </div>
                    <div className="rounded-xl border border-zinc-800 px-3 py-2 text-zinc-300">
                      <div className="text-zinc-600">No</div>
                      <div className="mt-1 text-sm font-bold text-white">{proposal.totals.no}</div>
                    </div>
                    <div className="rounded-xl border border-zinc-800 px-3 py-2 text-zinc-300">
                      <div className="text-zinc-600">Abstain</div>
                      <div className="mt-1 text-sm font-bold text-white">{proposal.totals.abstain}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {(['yes', 'no', 'abstain'] as const).map((choice) => (
                    <button
                      key={choice}
                      onClick={() => submitVote(proposal.id, choice)}
                      disabled={!program.governance.eligible || pendingVote !== null || proposal.status !== 'active'}
                      className="rounded-full border border-zinc-700 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-200 hover:border-zinc-500 hover:text-white disabled:opacity-40"
                    >
                      {pendingVote === `${proposal.id}:${choice}` ? 'Saving…' : choice}
                    </button>
                  ))}

                  {proposal.userVote ? (
                    <div className="text-[10px] uppercase tracking-[0.18em] text-emerald-300">
                      You voted {proposal.userVote.choice} · {proposal.userVote.votingPower}x power
                    </div>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>

        {admin ? (
          <form onSubmit={createProposal} className="mt-6 rounded-2xl border border-zinc-800 bg-black p-5">
            <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Admin Proposal Creator</div>
            <div className="mt-4 grid gap-3">
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Proposal title"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600"
              />
              <input
                value={form.summary}
                onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
                placeholder="One-line summary"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600"
              />
              <textarea
                value={form.details}
                onChange={(event) => setForm((current) => ({ ...current, details: event.target.value }))}
                placeholder="More context for holders"
                className="min-h-[120px] w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600"
              />
              <input
                type="datetime-local"
                value={form.endsAt}
                onChange={(event) => setForm((current) => ({ ...current, endsAt: event.target.value }))}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white focus:outline-none focus:border-zinc-600"
              />
              <button
                type="submit"
                disabled={creating}
                className="rounded-full border border-white bg-white px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-black hover:bg-zinc-200 disabled:opacity-50"
              >
                {creating ? 'Creating…' : 'Create proposal'}
              </button>
            </div>
          </form>
        ) : null}

        {error ? <div className="mt-4 rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}
        {success ? <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{success}</div> : null}
      </div>
    </div>
  )
}
