'use client'

import { useState } from 'react'
import { Plus, GitBranch, Terminal, FileCode, Search, Edit3, Check, Loader2, ChevronRight, Cpu } from 'lucide-react'

interface Session {
  id: string
  name: string
  status: 'active' | 'idle' | 'done'
  age: string
  repo: string
  branch: string
}

interface ToolCall {
  type: 'grep' | 'read' | 'write' | 'edit' | 'bash'
  path: string
  detail?: string
}

const DEMO_SESSIONS: Session[] = [
  { id: '1', name: 'Auth flow', status: 'active', age: '3m', repo: 'agentbot/feat/auth-flow', branch: 'feat/auth' },
  { id: '2', name: 'API refactor', status: 'idle', age: '2h', repo: 'agentbot/api-refactor', branch: 'refactor/api' },
  { id: '3', name: 'Fix tests', status: 'done', age: '1d', repo: 'agentbot/fix-tests', branch: 'fix/tests' },
]

const DEMO_TOOLS: ToolCall[] = [
  { type: 'grep', path: 'auth patterns in src/' },
  { type: 'read', path: 'lib/session.ts' },
  { type: 'write', path: 'app/api/auth/route.ts' },
  { type: 'write', path: 'app/api/auth/callback/route.ts' },
  { type: 'edit', path: 'middleware.ts' },
  { type: 'bash', path: 'pnpm typecheck' },
]

const TOOL_ICONS: Record<string, typeof Terminal> = {
  grep: Search,
  read: FileCode,
  write: FileCode,
  edit: Edit3,
  bash: Terminal,
}

const TOOL_COLORS: Record<string, string> = {
  grep: 'text-cyan-400',
  read: 'text-blue-400',
  write: 'text-green-400',
  edit: 'text-yellow-400',
  bash: 'text-purple-400',
}

export default function OpenAgentsClient() {
  const [sessions] = useState<Session[]>(DEMO_SESSIONS)
  const [activeSession, setActiveSession] = useState(DEMO_SESSIONS[0])
  const [input, setInput] = useState('')
  const [showInfra, setShowInfra] = useState(false)

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {/* Header */}
      <header className="border-b border-zinc-900 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cpu className="h-5 w-5 text-green-500" />
            <span className="text-sm font-bold uppercase tracking-widest">Open Agents</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="https://github.com/Eskyee/agentbot-opensource" target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero */}
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter">
            Open <span className="text-green-500">Agents.</span>
          </h1>
          <p className="mt-3 text-sm text-zinc-400 max-w-xl">
            Spawn coding agents that run infinitely in the cloud. Powered by OpenClaw, MiMo, and Agentbot Sandbox.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Sessions Sidebar */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.24em] text-zinc-600">Sessions</span>
              <button className="w-6 h-6 rounded border border-zinc-800 flex items-center justify-center text-zinc-600 hover:text-white hover:border-zinc-600 transition-colors">
                <Plus className="h-3 w-3" />
              </button>
            </div>

            <div className="space-y-1">
              {sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSession(s)}
                  className={`w-full text-left rounded-lg px-3 py-2.5 transition-colors ${
                    activeSession.id === s.id
                      ? 'bg-zinc-900 border border-zinc-800'
                      : 'hover:bg-zinc-950'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      s.status === 'active' ? 'bg-green-500' :
                      s.status === 'idle' ? 'bg-yellow-500' : 'bg-zinc-700'
                    }`} />
                    <span className="text-xs font-bold text-white truncate">{s.name}</span>
                    <span className="ml-auto text-[10px] text-zinc-600">{s.age}</span>
                  </div>
                  <div className="mt-1 text-[10px] text-zinc-600 truncate">{s.repo}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Panel */}
          <div className="space-y-6">
            {/* Session Header */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-bold">{activeSession.repo}</span>
                <span className="text-zinc-600">/</span>
                <span className="text-xs text-zinc-400">{activeSession.name}</span>
                <span className="ml-auto flex items-center gap-1.5 text-[10px] text-zinc-600">
                  <GitBranch className="h-3 w-3" />
                  {activeSession.branch}
                </span>
              </div>
            </div>

            {/* Tool Activity */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
              <div className="text-[10px] uppercase tracking-[0.24em] text-zinc-600 mb-3">Agent Activity</div>
              <div className="space-y-2">
                {DEMO_TOOLS.map((tool, i) => {
                  const Icon = TOOL_ICONS[tool.type]
                  return (
                    <div key={i} className="flex items-center gap-3 py-1.5">
                      <span className={`text-[10px] font-bold uppercase w-12 ${TOOL_COLORS[tool.type]}`}>
                        {tool.type}
                      </span>
                      <Icon className={`h-3.5 w-3.5 ${TOOL_COLORS[tool.type]}`} />
                      <span className="text-xs text-zinc-400">{tool.path}</span>
                      {i < DEMO_TOOLS.length - 1 && (
                        <span className="ml-auto text-zinc-800">
                          <ChevronRight className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-800 text-xs text-zinc-500">
                auth flow complete. 2 routes, middleware, callback. typecheck passes.
              </div>
            </div>

            {/* Sandbox Status */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
              <div className="text-[10px] uppercase tracking-[0.24em] text-zinc-600 mb-3">Sandbox</div>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'sandbox', value: activeSession.branch, icon: Terminal },
                  { label: 'status', value: 'provisioning', icon: Loader2 },
                  { label: 'branch', value: activeSession.branch, icon: GitBranch },
                  { label: 'cost', value: '$0.00/hr', icon: FileCode },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="text-[10px] text-zinc-600 flex items-center gap-1">
                      <item.icon className="h-3 w-3" />
                      {item.label}
                    </div>
                    <div className="mt-1 text-xs text-white font-bold">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Input */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Request changes or ask a question..."
                  className="flex-1 bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-green-500/50"
                />
                <button className="bg-green-600 hover:bg-green-500 text-white rounded-lg px-4 py-2.5 text-sm font-bold transition-colors">
                  Send
                </button>
              </div>
              <div className="mt-2 flex items-center gap-2 text-[10px] text-zinc-600">
                <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">Claude Opus 4.6</span>
                <span>1%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Agents that ship real code',
              desc: 'Each agent gets a full sandbox environment with filesystem, network, and runtime access. Describe what to build and let the agent work autonomously.',
              items: ['File ops, search, shell, and task delegation', 'Explorer and executor subagents', 'Multi-model support via OpenRouter'],
            },
            {
              title: 'Cloud sandboxes, not local machines',
              desc: 'Every session runs in an isolated sandbox with its own branch. Work is committed and pushed automatically.',
              items: ['Ephemeral environments with full git integration', 'Auto-hibernate on inactivity', 'Snapshot and restore filesystem state'],
            },
            {
              title: 'Durable workflows that survive anything',
              desc: 'Agent loops run as durable workflows that survive restarts, retry on failure, and coordinate multi-step operations.',
              items: ['Resumable agent loops with checkpointing', 'Usage tracking and auto-commit', 'Reconnect from any client'],
            },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6">
              <h3 className="text-sm font-bold text-white uppercase">{f.title}</h3>
              <p className="mt-2 text-xs text-zinc-400 leading-5">{f.desc}</p>
              <ul className="mt-4 space-y-2">
                {f.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-[11px] text-zinc-500">
                    <Check className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Infrastructure */}
        <div className="mt-16 mb-16">
          <h2 className="text-2xl font-bold uppercase tracking-tight mb-8">Infrastructure that ships.</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { num: '001', title: 'OpenClaw Runtime', desc: 'Open-source AI agent runtime with persistent memory and tools.' },
              { num: '002', title: 'OpenRouter Gateway', desc: 'Route requests across 500+ models with fallbacks and rate limiting.' },
              { num: '003', title: 'Docker Sandbox', desc: 'Secure, isolated environments for every session with full access.' },
              { num: '004', title: 'Workflow Engine', desc: 'Durable, resumable agent workflows that survive restarts.' },
            ].map((infra) => (
              <div key={infra.num} className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5">
                <div className="text-[10px] text-zinc-700 font-bold">{infra.num}</div>
                <h3 className="mt-2 text-sm font-bold text-white">{infra.title}</h3>
                <p className="mt-1 text-[11px] text-zinc-500 leading-4">{infra.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
