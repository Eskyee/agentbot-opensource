import { Metadata } from 'next'
import { DashboardShell, DashboardHeader, DashboardContent } from '@/components/shared/DashboardShell'
import Link from 'next/link'
import { paidTools } from '@/app/lib/paidTools'

export const metadata: Metadata = {
  title: 'Paid Tools — Agentbot',
  description: 'Agentbot paid tools catalog and workflow chains.',
}

export default function PaidToolsPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        title="Paid Tools"
        subtitle="Machine-readable, quote-first paid tools for research, social ops, jobs, and technical topics."
      />
      <DashboardContent>
        <div className="mb-8 border border-zinc-800 bg-zinc-950 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-600">Discovery</div>
              <p className="mt-2 text-sm text-zinc-400">
                Agentbot paid tools use a shared `/api/tools/:tool` surface, exact quotes before payment, `Payment-Receipt` on success, and idempotent replay behavior.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/openapi.json" className="text-xs uppercase tracking-widest text-blue-400 hover:text-white">
                OpenAPI →
              </Link>
              <Link href="/dashboard/x402" className="text-xs uppercase tracking-widest text-blue-400 hover:text-white">
                Seller UX →
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-px bg-zinc-800 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="bg-zinc-950 border border-zinc-800 p-5">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Catalog</div>
            <div className="space-y-4">
              {paidTools.map((tool) => (
                <div key={tool.id} className="border border-zinc-800 bg-black p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-zinc-600">{tool.category}</div>
                      <h2 className="text-lg font-bold uppercase tracking-tight text-white mt-1">{tool.name}</h2>
                      <p className="text-sm text-zinc-400 mt-2">{tool.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-widest text-zinc-600">Range</div>
                      <div className="text-sm font-mono text-emerald-400 mt-1">{tool.priceRange}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {tool.networks.map((network) => (
                      <span key={network} className="border border-zinc-800 px-2 py-1 text-[10px] uppercase tracking-widest text-zinc-500">
                        {network}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Workflow chains</div>
                    <div className="flex flex-wrap gap-2">
                      {tool.workflowChain.map((chain) => (
                        <span key={chain} className="border border-blue-500/20 bg-blue-500/5 px-2 py-1 text-[10px] uppercase tracking-widest text-blue-300">
                          {chain}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 text-xs text-zinc-500 font-mono">
                    POST /api/tools/{tool.id}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 p-5">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Agent Workflows</div>
            <div className="space-y-4 text-sm text-zinc-400">
              <div className="border border-zinc-800 bg-black p-4">
                <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Research</div>
                <p>Trend Intel → X Ops</p>
                <p className="mt-2 text-xs text-zinc-500">Start broad, then turn the highest-signal themes into social operations.</p>
              </div>
              <div className="border border-zinc-800 bg-black p-4">
                <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Hiring</div>
                <p>Job Intel → Repo Intel</p>
                <p className="mt-2 text-xs text-zinc-500">Find demand, then enrich it with GitHub and GitLawb technical context.</p>
              </div>
              <div className="border border-zinc-800 bg-black p-4">
                <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Payments</div>
                <p>Quote → Pay → Receipt</p>
                <p className="mt-2 text-xs text-zinc-500">A successful call now returns a `Payment-Receipt`, and retries can reuse the same `Idempotency-Key`.</p>
              </div>
            </div>
          </div>
        </div>
      </DashboardContent>
    </DashboardShell>
  )
}
