import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Open Agents — Autonomous AI Agents on Agentbot',
  description:
    'Deploy autonomous AI agents that run 24/7, execute tasks, and ship code. Open-source agent platform with sandbox isolation, multi-agent support, and Vercel integration.',
}

export default function OpenAgentsPage() {
  return (
    <main className="min-h-screen bg-black text-white font-mono pt-14">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.08),transparent_60%)]" />
        <div className="relative mx-auto max-w-5xl px-5 sm:px-6 pt-24 pb-16">
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="inline-flex items-center rounded-full border border-green-400/30 bg-green-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-green-300">
              Open Source
            </span>
            <span className="inline-flex items-center rounded-full border border-zinc-700 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              MIT License
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-[0.9]">
            Open <span className="text-green-500">Agents</span>
          </h1>

          <p className="max-w-2xl text-sm leading-7 text-zinc-400 mt-6 sm:text-base">
            An open-source platform that gives you everything you need to build
            and run autonomous AI agents. Deploy agents that work 24/7, execute
            tasks, and ship code — without keeping your laptop involved.
          </p>

          <div className="flex flex-wrap gap-3 mt-8">
            <a
              href="https://github.com/Eskyee/agentbot-opensource"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-zinc-200"
            >
              View Source
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </a>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-green-400 transition-colors hover:bg-green-500/20"
            >
              Deploy Free
            </Link>
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="mx-auto max-w-5xl px-6 mt-16">
        <div className="text-[10px] uppercase tracking-[0.24em] text-zinc-600 mb-4">Architecture</div>
        <h2 className="text-3xl font-bold uppercase tracking-tight">Three-Layer System</h2>
        <p className="max-w-2xl text-sm text-zinc-400 mt-3">
          Agentbot separates agent execution from sandbox execution. The agent
          runs outside the VM and interacts with it through tools — file reads,
          edits, search, and shell commands.
        </p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { step: '01', title: 'Web UI', desc: 'Auth, sessions, chat, streaming UI. The control plane for your agents.', color: 'border-green-500/30' },
            { step: '02', title: 'Agent Runtime', desc: 'Durable multi-step execution. Continues across workflow steps with streaming.', color: 'border-blue-500/30' },
            { step: '03', title: 'Sandbox VM', desc: 'Isolated execution: filesystem, shell, git, dev servers, preview ports.', color: 'border-purple-500/30' },
          ].map((item) => (
            <div key={item.step} className={`rounded-2xl border ${item.color} bg-zinc-950/80 p-6`}>
              <div className="text-3xl font-bold text-green-500">{item.step}</div>
              <h3 className="mt-4 text-sm font-bold text-white uppercase">{item.title}</h3>
              <p className="mt-2 text-xs leading-5 text-zinc-400">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 rounded-xl border border-zinc-800 bg-zinc-950/50">
          <p className="text-zinc-500 text-xs">
            <strong className="text-white">Key insight:</strong> The agent is not the sandbox.
            Agent execution is not tied to a single request lifecycle. Sandbox lifecycle
            can hibernate and resume independently. Model/provider choices and sandbox
            implementation evolve separately.
          </p>
        </div>
      </section>

      {/* Capabilities */}
      <section className="mx-auto max-w-5xl px-6 mt-16">
        <div className="text-[10px] uppercase tracking-[0.24em] text-zinc-600 mb-4">Capabilities</div>
        <h2 className="text-3xl font-bold uppercase tracking-tight">What Open Agents Do</h2>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'Chat-Driven Coding', desc: 'File, search, shell, task, skill, and web tools. Describe what you want — the agent builds it.' },
            { title: 'Durable Execution', desc: 'Workflow SDK-backed runs with streaming, cancellation, and cross-step persistence.' },
            { title: 'Isolated Sandboxes', desc: 'Vercel Sandbox with snapshot-based resume. Ports 3000, 5173, 4321, 8000 exposed.' },
            { title: 'Auto-Commit & PR', desc: 'Optional auto-commit, push, and PR creation after successful runs. Preference-driven.' },
            { title: 'Multi-Agent Support', desc: 'Claude Code, Codex, Gemini CLI, Cursor CLI, Copilot CLI, opencode — choose your agent.' },
            { title: 'Session Sharing', desc: 'Read-only links to share agent sessions. Collaborate and review work.' },
            { title: 'Voice Input', desc: 'Optional voice transcription via ElevenLabs. Speak your tasks.' },
            { title: 'Repo Cloning', desc: 'Clone any GitHub repo, branch, work inside sandbox, push changes automatically.' },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
              <h3 className="text-sm font-bold text-white uppercase">{f.title}</h3>
              <p className="mt-2 text-xs leading-5 text-zinc-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Supported Agents */}
      <section className="mx-auto max-w-5xl px-6 mt-16">
        <div className="text-[10px] uppercase tracking-[0.24em] text-zinc-600 mb-4">Supported Agents</div>
        <h2 className="text-3xl font-bold uppercase tracking-tight">Choose Your Brain</h2>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { name: 'Claude Code', desc: 'Anthropic frontier', color: 'text-orange-400 border-orange-400/30 bg-orange-400/5' },
            { name: 'OpenAI Codex', desc: 'GPT-4o coding', color: 'text-green-400 border-green-400/30 bg-green-400/5' },
            { name: 'Gemini CLI', desc: 'Google AI agent', color: 'text-blue-400 border-blue-400/30 bg-blue-400/5' },
            { name: 'Cursor CLI', desc: 'AI code editor', color: 'text-purple-400 border-purple-400/30 bg-purple-400/5' },
            { name: 'Copilot CLI', desc: 'GitHub assistant', color: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/5' },
            { name: 'opencode', desc: 'Open source', color: 'text-zinc-400 border-zinc-700 bg-zinc-900' },
          ].map((agent) => (
            <div key={agent.name} className={`rounded-xl border px-5 py-4 ${agent.color}`}>
              <div className="text-sm font-bold">{agent.name}</div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.18em] opacity-70">{agent.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="mx-auto max-w-5xl px-6 mt-16">
        <div className="text-[10px] uppercase tracking-[0.24em] text-zinc-600 mb-4">Workflow</div>
        <h2 className="text-3xl font-bold uppercase tracking-tight">How It Works</h2>

        <div className="mt-8 space-y-4">
          {[
            { step: '01', title: 'Sign In', desc: 'Authenticate with GitHub or Vercel OAuth. Your keys, your agents.' },
            { step: '02', title: 'Clone Repo', desc: 'Connect any GitHub repository. The agent clones it into an isolated sandbox.' },
            { step: '03', title: 'Describe Task', desc: 'Chat with your agent. Describe what you want — files, features, fixes, anything.' },
            { step: '04', title: 'Agent Executes', desc: 'The agent reads, writes, searches, and runs commands inside the sandbox.' },
            { step: '05', title: 'Auto-Commit', desc: 'Changes are committed and pushed. Optionally create a PR for review.' },
            { step: '06', title: 'Iterate', desc: 'Keep alive mode lets you follow up. Refine, test, ship — all in one session.' },
          ].map((item) => (
            <div key={item.step} className="flex gap-4 items-start rounded-xl border border-zinc-800 bg-zinc-950/80 p-5">
              <div className="text-2xl font-bold text-green-500 shrink-0">{item.step}</div>
              <div>
                <div className="text-sm font-bold text-white uppercase">{item.title}</div>
                <div className="mt-1 text-xs text-zinc-400">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sandbox */}
      <section className="mx-auto max-w-5xl px-6 mt-16">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-8">
          <div className="text-[10px] uppercase tracking-[0.24em] text-zinc-600 mb-4">Sandbox</div>
          <h2 className="text-2xl font-bold uppercase tracking-tight">Isolated Execution</h2>
          <p className="text-zinc-400 text-sm mt-3 max-w-2xl">
            Each task runs in an isolated Vercel Sandbox with full filesystem, shell,
            git, and dev server access. Sandboxes hibernate after inactivity and
            resume from snapshots.
          </p>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Ports', value: '3000, 5173, 4321, 8000' },
              { label: 'Max Duration', value: '5 min — 5 hours' },
              { label: 'Keep Alive', value: 'Optional' },
              { label: 'Snapshots', value: 'Resume from save' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-zinc-800 bg-black p-4">
                <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">{item.label}</div>
                <div className="mt-2 text-sm font-bold text-white">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Deploy */}
      <section className="mx-auto max-w-5xl px-6 mt-16 mb-24">
        <div className="rounded-2xl border border-green-500/30 bg-green-950/10 p-8 text-center">
          <div className="text-[10px] uppercase tracking-[0.24em] text-green-500 mb-2">Get Started</div>
          <h2 className="text-2xl font-bold uppercase tracking-tight">Deploy Your Own Open Agent</h2>
          <p className="text-zinc-400 text-sm mt-2 max-w-lg mx-auto">
            Fork the repo, deploy to Vercel with one click. Neon database auto-provisioned.
            Configure OAuth, add API keys, start shipping with AI.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <a
              href="https://github.com/Eskyee/agentbot-opensource"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-zinc-200"
            >
              Fork on GitHub
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </a>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-green-400 transition-colors hover:bg-green-500/20"
            >
              Deploy Free on Agentbot
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
