import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The Agentic Infrastructure Shift — Agentbot',
  description: 'Vercel declares the era of Agentic Infrastructure. 30% of deployments are now initiated by coding agents. Here\'s what it means for Agentbot.',
  keywords: ['agentic infrastructure', 'Vercel', 'AI agents', 'coding agents', 'deployment'],
  openGraph: {
    title: 'The Agentic Infrastructure Shift',
    description: '30% of Vercel deployments are now by coding agents. The infrastructure is adapting.',
    url: 'https://agentbot.sh/blog/posts/agentic-infrastructure-shift',
  },
}

export default function AgenticInfrastructurePost() {
  return (
    <main className="min-h-screen bg-black text-white font-mono px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-zinc-400 hover:text-white mb-8 inline-block">
          ← Back to Blog
        </Link>

        <article className="prose prose-invert max-w-none">
          <div className="mb-8">
            <p className="text-sm text-zinc-500 mb-2">9 April 2026</p>
            <h1 className="text-4xl font-bold uppercase tracking-tighter mb-4">
              The Agentic Infrastructure Shift
            </h1>
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs px-2 py-1 border border-red-800/50 text-zinc-400">Industry</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">AI Agents</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Infrastructure</span>
            </div>
          </div>

          <p className="text-zinc-300 mb-8 text-lg">
            Tom Occhino, Vercel&apos;s Chief Product Officer, just published the clearest articulation 
            of what&apos;s happening in our industry. The headline stat: <strong className="text-white">30% of Vercel deployments 
            are now initiated by coding agents</strong>, up 1000% from six months ago. Claude Code accounts for 75%.
          </p>

          <p className="text-zinc-300 mb-6">
            This validates everything we&apos;ve been building at Agentbot. We&apos;re not just riding a trend — 
            we&apos;re building the infrastructure layer for it.
          </p>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            Three Evolutions of Agentic Infrastructure
          </h2>

          <div className="space-y-6 mb-8">
            <div className="border border-zinc-800 bg-zinc-950 p-5">
              <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-2">1. Infrastructure for Agents to Deploy To</div>
              <p className="text-sm text-zinc-400 leading-relaxed mb-3">
                Agents need programmatic, deterministic deployment surfaces. Preview URLs, instant rollbacks, 
                immutable deployments — these aren&apos;t DX upgrades anymore. They&apos;re prerequisites for machine-driven development.
              </p>
              <div className="text-[10px] text-zinc-600">
                <strong className="text-zinc-400">Agentbot angle:</strong> Our Factory Droids (agent-provisioner, skill-builder, 
                user-manager) are exactly this — agents deploying agents. Programmatic provisioning via API, not clicks.
              </div>
            </div>

            <div className="border border-zinc-800 bg-zinc-950 p-5">
              <div className="text-[10px] uppercase tracking-widest text-orange-500 font-bold mb-2">2. Infrastructure for Building & Running Agents</div>
              <p className="text-sm text-zinc-400 leading-relaxed mb-3">
                Agent workloads are different from serverless. They need long-lived execution, multi-step orchestration, 
                model routing, cost controls, sandboxed code execution, and abuse resistance.
              </p>
              <div className="text-[10px] text-zinc-600">
                <strong className="text-zinc-400">Agentbot angle:</strong> We have this today — Docker-isolated agent instances, 
                ClawRouter (500+ models, zero markup), x402 payments, A2A bus, skill marketplace. 
                Our multi-tenant architecture gives each user their own isolated agent.
              </div>
            </div>

            <div className="border border-zinc-800 bg-zinc-950 p-5">
              <div className="text-[10px] uppercase tracking-widest text-orange-400 font-bold mb-2">3. Infrastructure That Is Itself Agentic</div>
              <p className="text-sm text-zinc-400 leading-relaxed mb-3">
                The platform itself becomes an agent — monitoring production, investigating anomalies, 
                reading logs, inspecting source code, performing root-cause analysis, and proposing fixes.
              </p>
              <div className="text-[10px] text-zinc-600">
                <strong className="text-zinc-400">Agentbot angle:</strong> Atlas (our Chief of Staff) already does this — 
                monitoring 7 services, auto-healing, deploying, engaging on social. The platform IS an agent.
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            What This Means for Agentbot
          </h2>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-zinc-500 mb-1">Vercel says:</div>
                <div className="text-white">&quot;Agents need deployment surfaces&quot;</div>
              </div>
              <div>
                <div className="text-zinc-500 mb-1">We have:</div>
                <div className="text-emerald-400">Factory Droids — agents deploy agents</div>
              </div>
              <div>
                <div className="text-zinc-500 mb-1">Vercel says:</div>
                <div className="text-white">&quot;Agent workloads need orchestration&quot;</div>
              </div>
              <div>
                <div className="text-zinc-500 mb-1">We have:</div>
                <div className="text-emerald-400">A2A bus, x402 payments, Docker isolation</div>
              </div>
              <div>
                <div className="text-zinc-500 mb-1">Vercel says:</div>
                <div className="text-white">&quot;Infrastructure should be agentic&quot;</div>
              </div>
              <div>
                <div className="text-zinc-500 mb-1">We have:</div>
                <div className="text-emerald-400">Atlas — self-healing, self-monitoring</div>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            The Key Numbers
          </h2>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="border border-zinc-800 bg-zinc-950 p-4 text-center">
              <div className="text-3xl font-bold text-white">30%</div>
              <div className="text-[10px] text-zinc-500 uppercase">Deployments by agents</div>
            </div>
            <div className="border border-zinc-800 bg-zinc-950 p-4 text-center">
              <div className="text-3xl font-bold text-white">20x</div>
              <div className="text-[10px] text-zinc-500 uppercase">More AI calls by agents</div>
            </div>
            <div className="border border-zinc-800 bg-zinc-950 p-4 text-center">
              <div className="text-3xl font-bold text-white">1000%</div>
              <div className="text-[10px] text-zinc-500 uppercase">Growth in 6 months</div>
            </div>
          </div>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            What We&apos;re Doing About It
          </h2>

          <ul className="list-disc pl-6 text-zinc-300 mb-6 space-y-2">
            <li><strong className="text-white">Workflow SDK integration</strong> — durable, resumable workflows (feature branch ready)</li>
            <li><strong className="text-white">Browser automation</strong> — real Playwright backend deployed (not a placeholder)</li>
            <li><strong className="text-white">Factory Droids</strong> — agents provisioning agents programmatically</li>
            <li><strong className="text-white">Onchain payments</strong> — agents paying each other via x402</li>
            <li><strong className="text-white">Multi-tenant isolation</strong> — Docker containers per user</li>
          </ul>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-bold uppercase tracking-tight mb-3">Bottom Line</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Vercel just declared that agentic infrastructure is the future. We&apos;ve been building it since day one. 
              The market is waking up. Our architecture is ahead — now we need the marketing, the social proof, 
              and the Product Hunt launch to match.
            </p>
          </div>

          <p className="text-zinc-400 text-sm">
            Source: <a href="https://vercel.com/blog/agentic-infrastructure" className="text-white underline">Vercel Blog — Agentic Infrastructure</a> by Tom Occhino<br/>
            Agentbot: <a href="https://github.com/Eskyee/agentbot-opensource" className="text-white underline">github.com/Eskyee/agentbot-opensource</a>
          </p>
        </article>
      </div>
    </main>
  )
}
