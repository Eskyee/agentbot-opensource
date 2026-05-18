import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'How to Build an Autonomous AI Agent Team — Agentbot',
  description: 'Step-by-step guide to building a 24/7 AI agent team. One agent per week. File-based coordination. Real costs. Real failures. Real results.',
}

export default function AgentTeamPage() {
  return (
    <main className="min-h-screen bg-black text-white font-mono px-6 py-16 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-2">Guide</div>
          <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-tighter mb-4">
            How to Build an<br/>Autonomous AI Agent Team
          </h1>
          <p className="text-zinc-400 text-sm max-w-xl leading-relaxed">
            A step-by-step guide to building a 24/7 AI agent team that works while you sleep. 
            Not theory — actual steps, real costs, real failures.
          </p>
        </div>

        {/* Week 1 */}
        <section className="mb-12">
          <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-4">Week 1</div>
          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4">One Agent, One Job</h2>
          <div className="space-y-4">
            <div className="border border-zinc-800 bg-zinc-950 p-5">
              <div className="text-xs font-bold text-white mb-2">Day 1: Install & Configure (30 min)</div>
              <ol className="text-sm text-zinc-400 space-y-1 list-decimal pl-4">
                <li>Sign up at agentbot.sh — 7-day free trial, no card</li>
                <li>Your agent deploys in 60 seconds</li>
                <li>Connect Telegram — Settings → Channels</li>
                <li>Choose your first job (research, email triage, content drafting)</li>
              </ol>
            </div>
            <div className="border border-zinc-800 bg-zinc-950 p-5">
              <div className="text-xs font-bold text-white mb-2">Day 2-3: Write SOUL.md (15 min)</div>
              <p className="text-sm text-zinc-400 mb-2">
                Your agent&apos;s identity file. 40-60 lines. Identity → Role → Principles → Output Format.
              </p>
              <p className="text-[10px] text-zinc-600">
                Tip: Use TV character names for instant personality baselines. &quot;Dwight Schrute energy&quot; = thorough, intense, no-nonsense.
              </p>
            </div>
            <div className="border border-zinc-800 bg-zinc-950 p-5">
              <div className="text-xs font-bold text-white mb-2">Day 4-5: Set Up Schedule (15 min)</div>
              <p className="text-sm text-zinc-400">
                Create your first cron job. Agent wakes up, does the work, delivers results. You review when convenient.
              </p>
            </div>
            <div className="border border-zinc-800 bg-zinc-950 p-5">
              <div className="text-xs font-bold text-white mb-2">Day 6-7: Observe & Refine</div>
              <p className="text-sm text-zinc-400">
                Watch output. Give feedback. Update SOUL.md. Expected: 70-80% useful output.
              </p>
            </div>
          </div>
        </section>

        {/* Week 2 */}
        <section className="mb-12">
          <div className="text-[10px] uppercase tracking-widest text-orange-500 font-bold mb-4">Week 2</div>
          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4">Add Memory & Refine</h2>
          <ul className="text-sm text-zinc-400 space-y-2 list-disc pl-4">
            <li>Review daily memory files after each run</li>
            <li>Create MEMORY.md — distill lessons from daily logs</li>
            <li>Set up heartbeat checks for cron job monitoring</li>
            <li>Expected: 85-90% useful output</li>
          </ul>
        </section>

        {/* Week 3 */}
        <section className="mb-12">
          <div className="text-[10px] uppercase tracking-widest text-purple-400 font-bold mb-4">Week 3</div>
          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4">Add a Second Agent</h2>
          <ul className="text-sm text-zinc-400 space-y-2 list-disc pl-4">
            <li>Create second agent&apos;s SOUL.md — different role</li>
            <li>File-based coordination — agent 1 writes, agent 2 reads</li>
            <li>Schedule after agent 1 — dependent agents must be sequential</li>
            <li>Expected: Two agents producing coordinated output</li>
          </ul>
        </section>

        {/* File Pattern */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4">File-Based Coordination</h2>
          <p className="text-sm text-zinc-400 mb-4">
            No API calls between agents. No message queues. Just files. Dwight writes DAILY-INTEL.md. 
            Kelly reads it. The handoff is a markdown document on disk.
          </p>
          <div className="bg-zinc-950 border border-zinc-800 p-4 font-mono text-xs text-zinc-400">
            <div>workspace/</div>
            <div className="pl-4">├── SOUL.md <span className="text-zinc-600"># Main agent</span></div>
            <div className="pl-4">├── MEMORY.md <span className="text-zinc-600"># Long-term memory</span></div>
            <div className="pl-4">├── agents/</div>
            <div className="pl-8">├── researcher/</div>
            <div className="pl-12">├── SOUL.md</div>
            <div className="pl-12">└── memory/</div>
            <div className="pl-8">└── content/</div>
            <div className="pl-12">├── SOUL.md</div>
            <div className="pl-12">└── memory/</div>
            <div className="pl-4">├── intel/</div>
            <div className="pl-8">├── DAILY-INTEL.md <span className="text-zinc-600"># Writer → readers</span></div>
            <div className="pl-8">└── data/2026-04-10.json</div>
            <div className="pl-4">└── memory/</div>
            <div className="pl-8">└── 2026-04-10.md <span className="text-zinc-600"># Daily raw logs</span></div>
          </div>
        </section>

        {/* Costs */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4">Real Costs</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border border-zinc-800 bg-zinc-950 p-4 text-center">
              <div className="text-[10px] text-zinc-500 uppercase mb-1">Solo (1 agent)</div>
              <div className="text-lg font-bold text-white">$40-60</div>
              <div className="text-[10px] text-zinc-600">/month</div>
            </div>
            <div className="border border-zinc-800 bg-zinc-950 p-4 text-center">
              <div className="text-[10px] text-zinc-500 uppercase mb-1">Collective (3)</div>
              <div className="text-lg font-bold text-white">$100-130</div>
              <div className="text-[10px] text-zinc-600">/month</div>
            </div>
            <div className="border border-zinc-800 bg-zinc-950 p-4 text-center">
              <div className="text-[10px] text-zinc-500 uppercase mb-1">Label (10)</div>
              <div className="text-lg font-bold text-white">$250-350</div>
              <div className="text-[10px] text-zinc-600">/month</div>
            </div>
            <div className="border border-orange-500/30 bg-orange-500/5 p-4 text-center">
              <div className="text-[10px] text-orange-500 uppercase mb-1">Network</div>
              <div className="text-lg font-bold text-orange-500">$700-1000</div>
              <div className="text-[10px] text-zinc-600">/month</div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="border border-zinc-800 bg-zinc-950 p-8 text-center">
          <h2 className="text-2xl font-bold uppercase tracking-tight mb-3">Start Today</h2>
          <p className="text-sm text-zinc-400 mb-4">
            One agent. One job. One schedule. That&apos;s all you need to begin.
          </p>
          <Link href="/signup" className="inline-flex items-center justify-center bg-white text-black px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors">
            Start Free Trial →
          </Link>
        </div>
      </div>
    </main>
  )
}
