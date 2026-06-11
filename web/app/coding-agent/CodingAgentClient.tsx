'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, GitBranch, Terminal, FileCode, Search, Edit3, Check, Loader2, ChevronRight, Cpu, Send, Copy, X, MessageSquare } from 'lucide-react'

interface Session {
  id: string
  name: string
  status: 'active' | 'idle' | 'done'
  age: string
  repo: string
  branch: string
  task: string
  model: string
}

interface ToolCall {
  type: 'grep' | 'read' | 'write' | 'edit' | 'bash'
  path: string
  detail?: string
  status: 'running' | 'done'
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  tools?: ToolCall[]
  files?: { name: string; content: string }[]
}

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
  bash: 'text-orange-400',
}

export default function CodingAgentClient() {
  const [sessions, setSessions] = useState<Session[]>([
    { id: '1', name: 'Auth flow', status: 'active', age: '3m', repo: 'Eskyee/agentbot', branch: 'feat/auth', task: 'Build the auth flow with GitHub OAuth', model: 'Claude Sonnet 4.5' },
    { id: '2', name: 'API refactor', status: 'idle', age: '2h', repo: 'Eskyee/agentbot', branch: 'refactor/api', task: 'Refactor API routes to modular structure', model: 'Claude Sonnet 4.5' },
    { id: '3', name: 'Fix tests', status: 'done', age: '1d', repo: 'Eskyee/agentbot', branch: 'fix/tests', task: 'Fix failing test suite', model: 'Claude Sonnet 4.5' },
  ])
  const [activeSession, setActiveSession] = useState(sessions[0])
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'I\'m your coding agent. I can read, write, edit, and search files in your repository. Describe what you want to build.',
      timestamp: new Date(),
    },
  ])
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([
    { type: 'grep', path: 'auth patterns in src/', status: 'done' },
    { type: 'read', path: 'lib/session.ts', status: 'done' },
    { type: 'write', path: 'app/api/auth/route.ts', status: 'done' },
    { type: 'write', path: 'app/api/auth/callback/route.ts', status: 'done' },
    { type: 'edit', path: 'middleware.ts', status: 'done' },
    { type: 'bash', path: 'pnpm typecheck', status: 'done' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeFile, setActiveFile] = useState<string | null>(null)
  const [showNewSession, setShowNewSession] = useState(false)
  const [newRepo, setNewRepo] = useState('')
  const [newTask, setNewTask] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const createSession = () => {
    if (!newRepo || !newTask) return
    const newSession: Session = {
      id: String(Date.now()),
      name: newTask.slice(0, 30),
      status: 'active',
      age: 'now',
      repo: newRepo,
      branch: `feat/${newTask.toLowerCase().replace(/\s+/g, '-').slice(0, 20)}`,
      task: newTask,
      model: 'Claude Sonnet 4.5',
    }
    setSessions((prev) => [newSession, ...prev])
    setActiveSession(newSession)
    setShowNewSession(false)
    setNewRepo('')
    setNewTask('')
    setMessages([{
      role: 'assistant',
      content: `Session started. Working on: ${newTask}\nRepo: ${newRepo}\nBranch: ${newSession.branch}`,
      timestamp: new Date(),
    }])
    setToolCalls([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg: Message = { role: 'user', content: input, timestamp: new Date() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    // Simulate tool calls
    const simulatedTools: ToolCall[] = [
      { type: 'grep', path: `searching for ${input.slice(0, 20)}...`, status: 'done' },
    ]
    setToolCalls(simulatedTools)

    try {
      const res = await fetch('/api/coding-agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
          session: { repo: activeSession.repo, branch: activeSession.branch },
        }),
      })

      const data = await res.json()

      // Complete tool calls
      setToolCalls((prev) => prev.map((t) => ({ ...t, status: 'done' as const })))

      const assistantMsg: Message = {
        role: 'assistant',
        content: data.response || 'Something went wrong.',
        timestamp: new Date(),
        files: data.files || [],
        tools: data.tools || [],
      }
      setMessages((prev) => [...prev, assistantMsg])
      if (data.files?.length) setActiveFile(data.files[0].name)
    } catch {
      setToolCalls((prev) => prev.map((t) => ({ ...t, status: 'done' as const })))
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Network error. Please try again.', timestamp: new Date() },
      ])
    } finally {
      setLoading(false)
    }
  }

  const activeFileContent = messages
    .flatMap((m) => m.files || [])
    .find((f) => f.name === activeFile)?.content

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {/* Header */}
      <header className="border-b border-zinc-900 px-6 py-3">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cpu className="h-4 w-4 text-green-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Coding Agent</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-600">Powered by OpenClaw + Claude</span>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto flex h-[calc(100vh-49px)]">
        {/* Sessions Sidebar */}
        <div className="w-[260px] border-r border-zinc-900 flex flex-col">
          <div className="p-3 border-b border-zinc-900 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.24em] text-zinc-600">Sessions</span>
            <button
              onClick={() => setShowNewSession(true)}
              className="w-6 h-6 rounded border border-zinc-800 flex items-center justify-center text-zinc-600 hover:text-white hover:border-zinc-600 transition-colors"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {/* New Session Form */}
          {showNewSession && (
            <div className="p-3 border-b border-zinc-900 bg-zinc-950 space-y-2">
              <input
                value={newRepo}
                onChange={(e) => setNewRepo(e.target.value)}
                placeholder="owner/repo"
                className="w-full bg-black border border-zinc-800 rounded px-2 py-1.5 text-[11px] text-white placeholder-zinc-600 focus:outline-none focus:border-green-500/50"
              />
              <input
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="What should the agent build?"
                className="w-full bg-black border border-zinc-800 rounded px-2 py-1.5 text-[11px] text-white placeholder-zinc-600 focus:outline-none focus:border-green-500/50"
              />
              <div className="flex gap-1">
                <button onClick={createSession} className="flex-1 bg-green-600 hover:bg-green-500 text-white rounded px-2 py-1 text-[10px] font-bold transition-colors">
                  Create
                </button>
                <button onClick={() => setShowNewSession(false)} className="px-2 py-1 rounded border border-zinc-800 text-zinc-600 hover:text-white text-[10px] transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
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
                  <span className="text-[11px] font-bold text-white truncate">{s.name}</span>
                  <span className="ml-auto text-[9px] text-zinc-600">{s.age}</span>
                </div>
                <div className="mt-1 text-[9px] text-zinc-600 truncate">{s.repo}/{s.branch}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Chat + Tools */}
          <div className="flex-1 flex flex-col">
            {/* Session Header */}
            <div className="border-b border-zinc-900 px-4 py-2.5 flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${activeSession.status === 'active' ? 'bg-green-500 animate-pulse' : activeSession.status === 'idle' ? 'bg-yellow-500' : 'bg-zinc-700'}`} />
              <span className="text-xs font-bold">{activeSession.repo}</span>
              <ChevronRight className="h-3 w-3 text-zinc-700" />
              <span className="text-xs text-zinc-400">{activeSession.branch}</span>
              <span className="ml-auto flex items-center gap-1.5 text-[10px] text-zinc-600">
                <GitBranch className="h-3 w-3" />
                {activeSession.model}
              </span>
            </div>

            {/* Tool Activity */}
            <div className="border-b border-zinc-900 px-4 py-2">
              <div className="flex items-center gap-4 overflow-x-auto">
                {toolCalls.map((tool, i) => {
                  const Icon = TOOL_ICONS[tool.type]
                  return (
                    <div key={i} className="flex items-center gap-1.5 shrink-0">
                      {tool.status === 'running' ? (
                        <Loader2 className={`h-3 w-3 animate-spin ${TOOL_COLORS[tool.type]}`} />
                      ) : (
                        <Check className="h-3 w-3 text-green-500" />
                      )}
                      <span className={`text-[10px] font-bold uppercase ${TOOL_COLORS[tool.type]}`}>
                        {tool.type}
                      </span>
                      <span className="text-[10px] text-zinc-600 max-w-[120px] truncate">{tool.path}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-6 ${
                    msg.role === 'user'
                      ? 'bg-green-600 text-white'
                      : 'bg-zinc-900 text-zinc-300 border border-zinc-800'
                  }`}>
                    <pre className="whitespace-pre-wrap font-mono text-xs">{msg.content}</pre>
                    {msg.files && msg.files.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {msg.files.map((f) => (
                          <button
                            key={f.name}
                            onClick={() => setActiveFile(f.name)}
                            className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 text-[10px] text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                          >
                            <FileCode className="h-3 w-3" />
                            {f.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 text-green-500 animate-spin" />
                    <span className="text-xs text-zinc-500">Agent working...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-zinc-900 px-4 py-3">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Request changes or ask a question..."
                  disabled={loading}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-green-500/50 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="bg-green-600 hover:bg-green-500 text-white rounded-lg px-4 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
              <div className="mt-2 flex items-center gap-2">
                {['Build a todo app', 'Create a REST API', 'Add auth flow', 'Fix failing tests'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setInput(s)}
                    className="text-[9px] px-2 py-1 rounded border border-zinc-800 text-zinc-600 hover:text-white hover:border-zinc-600 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Code Panel */}
          <div className="hidden lg:flex w-[400px] flex-col border-l border-zinc-900 bg-zinc-950">
            <div className="border-b border-zinc-900 px-4 py-2.5 flex items-center gap-2">
              <FileCode className="h-3.5 w-3.5 text-indigo-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                {activeFile || 'No file selected'}
              </span>
              {activeFileContent && (
                <button
                  onClick={() => navigator.clipboard?.writeText(activeFileContent)}
                  className="ml-auto text-zinc-600 hover:text-white transition-colors"
                >
                  <Copy className="h-3 w-3" />
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {activeFileContent ? (
                <pre className="text-[11px] text-zinc-400 whitespace-pre-wrap font-mono leading-5">
                  {activeFileContent}
                </pre>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-zinc-700">
                  <FileCode className="h-8 w-8 mb-2 opacity-30" />
                  <span className="text-[10px]">Code appears here when agent generates files</span>
                </div>
              )}
            </div>

            {/* Sandbox Status */}
            <div className="border-t border-zinc-900 p-4">
              <div className="text-[9px] uppercase tracking-[0.24em] text-zinc-600 mb-2">Sandbox</div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'branch', value: activeSession.branch },
                  { label: 'status', value: activeSession.status },
                  { label: 'repo', value: activeSession.repo.split('/')[1] },
                  { label: 'cost', value: '$0.00/hr' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="text-[9px] text-zinc-600">{item.label}</div>
                    <div className="text-[11px] text-white font-bold truncate">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
