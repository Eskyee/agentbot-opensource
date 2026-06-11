import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Coding Agent — AI-Powered Code Generation | Agentbot',
  description:
    'Deploy AI coding agents that write, test, and ship code autonomously. Powered by Claude, Codex, Gemini, and OpenClaw.',
}

export default function CodingAgentPage() {
  return (
    <main className="min-h-screen bg-black text-white font-mono pt-14">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.08),transparent_60%)]" />
        <div className="relative mx-auto max-w-5xl px-5 sm:px-6 pt-24 pb-16">
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="inline-flex items-center rounded-full border border-indigo-400/30 bg-indigo-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-300">
              AI Agents
            </span>
            <span className="inline-flex items-center rounded-full border border-zinc-700 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              Open Source
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-[0.9]">
            Coding <span className="text-indigo-400">Agent</span>
          </h1>

          <p className="max-w-2xl text-sm leading-7 text-zinc-400 mt-6 sm:text-base">
            Deploy AI coding agents that write, test, and ship code autonomously.
            Powered by Claude Code, OpenAI Codex, Gemini CLI, and OpenClaw
            for isolated, secure code execution.
          </p>

          <div className="flex flex-wrap gap-3 mt-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-indigo-400"
            >
              Deploy Coding Agent
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto max-w-5xl px-6 mt-16">
        <div className="text-[10px] uppercase tracking-[0.24em] text-zinc-600 mb-4">Capabilities</div>
        <h2 className="text-3xl font-bold uppercase tracking-tight">What Coding Agents Do</h2>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'Multi-Agent Support', desc: 'Choose from Claude Code, OpenAI Codex CLI, GitHub Copilot CLI, Cursor CLI, Google Gemini CLI, or opencode.' },
            { title: 'Vercel Sandbox', desc: 'Runs code in isolated, secure sandboxes. Each task gets its own environment with full tool access.' },
            { title: 'Git Integration', desc: 'Automatically creates branches, commits changes, and pushes to your repository with AI-generated branch names.' },
            { title: 'Real-Time Monitoring', desc: 'Watch live logs as the agent works. Track task progress with real-time updates.' },
            { title: 'MCP Server Support', desc: 'Connect MCP servers to extend Claude Code with additional tools and integrations.' },
            { title: 'Multi-User', desc: 'Each user has their own tasks, API keys, and GitHub connection. Full isolation.' },
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
        <h2 className="text-3xl font-bold uppercase tracking-tight">Choose Your Agent</h2>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { name: 'Claude Code', desc: 'Anthropic frontier model', color: 'text-orange-400 border-orange-400/30 bg-orange-400/5' },
            { name: 'OpenAI Codex', desc: 'GPT-4o powered coding', color: 'text-green-400 border-green-400/30 bg-green-400/5' },
            { name: 'Gemini CLI', desc: 'Google AI coding agent', color: 'text-blue-400 border-blue-400/30 bg-blue-400/5' },
            { name: 'Cursor CLI', desc: 'AI-native code editor', color: 'text-purple-400 border-purple-400/30 bg-purple-400/5' },
            { name: 'Copilot CLI', desc: 'GitHub AI assistant', color: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/5' },
            { name: 'opencode', desc: 'Open source alternative', color: 'text-zinc-400 border-zinc-700 bg-zinc-900' },
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
            { step: '01', title: 'Sign In', desc: 'Authenticate with GitHub or Vercel OAuth' },
            { step: '02', title: 'Create Task', desc: 'Enter a repository URL and describe what you want the AI to do' },
            { step: '03', title: 'Monitor Progress', desc: 'Watch real-time logs as the agent works in an isolated sandbox' },
            { step: '04', title: 'Review Results', desc: 'See the changes made and the branch created automatically' },
          ].map((item) => (
            <div key={item.step} className="flex gap-4 items-start rounded-xl border border-zinc-800 bg-zinc-950/80 p-5">
              <div className="text-2xl font-bold text-indigo-400 shrink-0">{item.step}</div>
              <div>
                <div className="text-sm font-bold text-white uppercase">{item.title}</div>
                <div className="mt-1 text-xs text-zinc-400">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="mx-auto max-w-5xl px-6 mt-16">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-8">
          <div className="text-[10px] uppercase tracking-[0.24em] text-zinc-600 mb-4">Tech Stack</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {['OpenClaw Runtime', 'Claude Code', 'OpenAI Codex', 'Gemini CLI', 'Docker Isolation', 'USDC Payments', 'Base Network', 'Agentbot Platform'].map((t) => (
              <div key={t} className="flex items-center gap-2 text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Deploy CTA */}
      <section className="mx-auto max-w-5xl px-6 mt-16 mb-24">
        <Link
          href="/dashboard"
          className="block rounded-2xl border border-indigo-500/30 bg-indigo-950/10 p-8 text-center transition-colors hover:bg-indigo-950/20"
        >
          <div className="text-[10px] uppercase tracking-[0.24em] text-indigo-400 mb-2">Deploy Now</div>
          <h2 className="text-2xl font-bold uppercase tracking-tight">Deploy Your Coding Agent</h2>
          <p className="text-zinc-400 text-sm mt-2 max-w-lg mx-auto">
            Deploy an AI coding agent on Agentbot in seconds.
            Configure your AI model, connect your repo, and start shipping with AI.
          </p>
          <span className="inline-flex items-center gap-2 mt-4 rounded-full bg-indigo-500 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white">
            Open Dashboard
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </span>
        </Link>
      </section>
    </main>
  )
}
