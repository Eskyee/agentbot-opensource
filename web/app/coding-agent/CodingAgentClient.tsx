'use client'

import Link from 'next/link'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Plus, GitBranch, Terminal, FileCode, Search, Edit3, Check, Loader2, ChevronRight, Cpu, Send, Copy } from 'lucide-react'

interface Session {
  id: string
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
  status: 'running' | 'done'
}

interface Message {
  role: 'user' | 'assistant'
  content: string
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

const WELCOME: Message = {
  role: 'assistant',
  content: "I'm your coding agent. I can read, write, edit, and search files in your repository. Describe what you want to build.",
}

export default function CodingAgentClient() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeSession, setActiveSession] = useState<Session | null>(null)
  const [authRequired, setAuthRequired] = useState(false)
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeFile, setActiveFile] = useState<string | null>(null)
  const [showNewSession, setShowNewSession] = useState(false)
  const [newRepo, setNewRepo] = useState('')
  const [newTask, setNewTask] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true)
    try {
      const res = await fetch('/api/coding-agent/sessions', { cache: 'no-store' })
      if (res.status === 401) {
        setAuthRequired(true)
        return
      }
      const data = await res.json()
      if (res.ok && Array.isArray(data.sessions)) {
        setSessions(data.sessions)
        setAuthRequired(false)
        if (data.sessions.length > 0) {
          setActiveSession((current) => current ?? data.sessions[0])
        }
      }
    } catch {
      setError('Failed to load sessions.')
    } finally {
      setSessionsLoading(false)
    }
  }, [])

  useEffect(() => { loadSessions() }, [loadSessions])

  const createSession = async () => {
    if (!newRepo || !newTask) return
    setError('')
    try {
      const res = await fetch('/api/coding-agent/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo: newRepo, task: newTask }),
      })
      if (res.status === 401) {
        setAuthRequired(true)
        return
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create session')
      const created: Session = { ...data.session, status: 'active' }
      setSessions((prev) => [created, ...prev])
      setActiveSession(created)
      setShowNewSession(false)
      setNewRepo('')
      setNewTask('')
      setMessages([{
        role: 'assistant',
        content: `Session started. Working on: ${created.task}\nRepo: ${created.repo}\nBranch: ${created.branch}`,
      }])
      setToolCalls([])
      setActiveFile(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session')
    }
  }

  const selectSession = (s: Session) => {
    setActiveSession(s)
    setMessages([WELCOME])
    setToolCalls([])
    setActiveFile(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading || !activeSession) return

    const userMsg: Message = { role: 'user', content: input }
    const history = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }))
    setMessages((prev) => [...prev, userMsg, { role: 'assistant', content: '' }])
    setInput('')
    setLoading(true)
    setError('')
    setToolCalls([{ type: 'grep', path: 'analysing request…', status: 'running' }])

    try {
      const res = await fetch('/api/coding-agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content, sessionId: activeSession.id, history }),
      })

      if (res.status === 401) {
        setAuthRequired(true)
        return
      }
      if (!res.ok || !res.body) {
        throw new Error(await res.text() || 'Agent request failed')
      }

      // Consume the SSE stream: incremental {content} chunks, final {done, files}
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let files: { name: string; content: string }[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))
            if (event.content) {
              setMessages((prev) => {
                const next = [...prev]
                const last = next[next.length - 1]
                next[next.length - 1] = { ...last, content: last.content + event.content }
                return next
              })
            }
            if (event.done) {
              files = event.files || []
            }
          } catch { /* skip malformed SSE line */ }
        }
      }

      setToolCalls((prev) => prev.map((t) => ({ ...t, status: 'done' as const })))
      if (files.length) {
        setMessages((prev) => {
          const next = [...prev]
          next[next.length - 1] = { ...next[next.length - 1], files }
          return next
        })
        setActiveFile(files[0].name)
      }
    } catch (err) {
      setToolCalls([])
      setMessages((prev) => {
        const next = [...prev]
        const last = next[next.length - 1]
        if (last.role === 'assistant' && !last.content) {
          next[next.length - 1] = { ...last, content: 'Something went wrong. Please try again.' }
        }
        return next
      })
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }

  const activeFileContent = messages
    .flatMap((m) => m.files || [])
    .find((f) => f.name === activeFile)?.content

  if (authRequired) {
    return (
      <div className="min-h-screen bg-black text-white font-mono flex items-center justify-center px-6">
        <div className="max-w-md w-full border border-zinc-900 bg-zinc-950 p-8 text-center">
          <Cpu className="h-6 w-6 text-orange-500 mx-auto" />
          <h1 className="mt-4 text-xl font-bold uppercase tracking-widest">Coding Agent</h1>
          <p className="mt-3 text-sm text-zinc-500">
            Sign in to start coding sessions. The agent reads, writes, and edits files in your repository — sessions persist to your account.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link href="/login?next=/coding-agent" className="block bg-orange-500 hover:bg-orange-400 text-black py-3 text-xs font-bold uppercase tracking-widest transition-colors">
              Sign In
            </Link>
            <Link href="/signup" className="block border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white py-3 text-xs font-bold uppercase tracking-widest transition-colors">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {/* Header */}
      <header className="border-b border-zinc-900 px-4 sm:px-6 py-3">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cpu className="h-4 w-4 text-orange-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Coding Agent</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
            <Link href="/playground" className="hover:text-white transition-colors">Playground</Link>
            <Link href="/vercel-gateway" className="hover:text-white transition-colors hidden sm:inline">Gateway</Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto flex h-[calc(100vh-49px)]">
        {/* Sessions Sidebar */}
        <div className="hidden md:flex w-[260px] border-r border-zinc-900 flex-col">
          <div className="p-3 border-b border-zinc-900 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.24em] text-zinc-600">Sessions</span>
            <button
              onClick={() => setShowNewSession(true)}
              aria-label="New session"
              className="w-6 h-6 rounded border border-zinc-800 flex items-center justify-center text-zinc-600 hover:text-white hover:border-zinc-600 transition-colors"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {showNewSession && (
            <div className="p-3 border-b border-zinc-900 bg-zinc-950 space-y-2">
              <input
                value={newRepo}
                onChange={(e) => setNewRepo(e.target.value)}
                placeholder="owner/repo"
                className="w-full bg-black border border-zinc-800 rounded px-2 py-1.5 text-[11px] text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/50"
              />
              <input
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="What should the agent build?"
                className="w-full bg-black border border-zinc-800 rounded px-2 py-1.5 text-[11px] text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/50"
              />
              <div className="flex gap-1">
                <button onClick={createSession} className="flex-1 bg-orange-500 hover:bg-orange-400 text-black rounded px-2 py-1 text-[10px] font-bold transition-colors">
                  Create
                </button>
                <button onClick={() => setShowNewSession(false)} className="px-2 py-1 rounded border border-zinc-800 text-zinc-600 hover:text-white text-[10px] transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sessionsLoading && (
              <div className="flex items-center gap-2 px-3 py-2 text-[10px] text-zinc-600">
                <Loader2 className="h-3 w-3 animate-spin" /> Loading sessions…
              </div>
            )}
            {!sessionsLoading && sessions.length === 0 && (
              <div className="px-3 py-4 text-[10px] text-zinc-600 leading-5">
                No sessions yet. Create one with the + button to point the agent at a repo.
              </div>
            )}
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => selectSession(s)}
                className={`w-full text-left rounded-lg px-3 py-2.5 transition-colors ${
                  activeSession?.id === s.id
                    ? 'bg-zinc-900 border border-zinc-800'
                    : 'hover:bg-zinc-950'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    s.status === 'active' ? 'bg-green-500' :
                    s.status === 'idle' ? 'bg-yellow-500' : 'bg-zinc-700'
                  }`} />
                  <span className="text-[11px] font-bold text-white truncate">{s.task.slice(0, 30) || 'Session'}</span>
                  <span className="ml-auto text-[9px] text-zinc-600">{s.age}</span>
                </div>
                <div className="mt-1 text-[9px] text-zinc-600 truncate">{s.repo} · {s.branch}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          <div className="flex-1 flex flex-col">
            {/* Session Header */}
            <div className="border-b border-zinc-900 px-4 py-2.5 flex items-center gap-3">
              {activeSession ? (
                <>
                  <div className={`w-2 h-2 rounded-full ${activeSession.status === 'active' ? 'bg-green-500 animate-pulse' : activeSession.status === 'idle' ? 'bg-yellow-500' : 'bg-zinc-700'}`} />
                  <span className="text-xs font-bold truncate">{activeSession.repo}</span>
                  <ChevronRight className="h-3 w-3 text-zinc-700 shrink-0" />
                  <span className="text-xs text-zinc-400 truncate">{activeSession.branch}</span>
                  <span className="ml-auto hidden sm:flex items-center gap-1.5 text-[10px] text-zinc-600 shrink-0">
                    <GitBranch className="h-3 w-3" />
                    {activeSession.model}
                  </span>
                </>
              ) : (
                <span className="text-[10px] uppercase tracking-widest text-zinc-600">
                  Create a session to start
                </span>
              )}
              <button
                onClick={() => setShowNewSession(true)}
                className="md:hidden ml-auto flex items-center gap-1 border border-zinc-800 rounded px-2 py-1 text-[10px] text-zinc-400 hover:text-white"
              >
                <Plus className="h-3 w-3" /> New
              </button>
            </div>

            {/* Mobile new-session form */}
            {showNewSession && (
              <div className="md:hidden p-3 border-b border-zinc-900 bg-zinc-950 space-y-2">
                <input
                  value={newRepo}
                  onChange={(e) => setNewRepo(e.target.value)}
                  placeholder="owner/repo"
                  className="w-full bg-black border border-zinc-800 rounded px-2 py-1.5 text-[11px] text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/50"
                />
                <input
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="What should the agent build?"
                  className="w-full bg-black border border-zinc-800 rounded px-2 py-1.5 text-[11px] text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/50"
                />
                <div className="flex gap-1">
                  <button onClick={createSession} className="flex-1 bg-orange-500 hover:bg-orange-400 text-black rounded px-2 py-1 text-[10px] font-bold transition-colors">
                    Create
                  </button>
                  <button onClick={() => setShowNewSession(false)} className="px-2 py-1 rounded border border-zinc-800 text-zinc-600 hover:text-white text-[10px] transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Tool Activity */}
            {toolCalls.length > 0 && (
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
                        <Icon className={`h-3 w-3 ${TOOL_COLORS[tool.type]}`} />
                        <span className="text-[10px] text-zinc-600 max-w-[160px] truncate">{tool.path}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-6 ${
                    msg.role === 'user'
                      ? 'bg-orange-500 text-black'
                      : 'bg-zinc-900 text-zinc-300 border border-zinc-800'
                  }`}>
                    <pre className="whitespace-pre-wrap font-mono text-xs">{msg.content || (loading && i === messages.length - 1 ? '…' : '')}</pre>
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
              {error && <p className="text-xs text-orange-400">{error}</p>}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-zinc-900 px-4 py-3">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={activeSession ? 'Request changes or ask a question…' : 'Create a session first…'}
                  disabled={loading || !activeSession}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/50 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim() || !activeSession}
                  aria-label="Send"
                  className="bg-orange-500 hover:bg-orange-400 text-black rounded-lg px-4 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </form>
              <div className="mt-2 flex items-center gap-2 overflow-x-auto">
                {['Build a todo app', 'Create a REST API', 'Add auth flow', 'Fix failing tests'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setInput(s)}
                    className="shrink-0 text-[9px] px-2 py-1 rounded border border-zinc-800 text-zinc-600 hover:text-white hover:border-zinc-600 transition-colors"
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
              <FileCode className="h-3.5 w-3.5 text-orange-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                {activeFile || 'No file selected'}
              </span>
              {activeFileContent && (
                <button
                  onClick={() => navigator.clipboard?.writeText(activeFileContent)}
                  aria-label="Copy file contents"
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
                  <span className="text-[10px]">Code appears here when the agent generates files</span>
                </div>
              )}
            </div>

            {/* Session info */}
            {activeSession && (
              <div className="border-t border-zinc-900 p-4">
                <div className="text-[9px] uppercase tracking-[0.24em] text-zinc-600 mb-2">Session</div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'branch', value: activeSession.branch },
                    { label: 'status', value: activeSession.status },
                    { label: 'repo', value: activeSession.repo.split('/').pop() || activeSession.repo },
                    { label: 'model', value: activeSession.model },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="text-[9px] text-zinc-600">{item.label}</div>
                      <div className="text-[11px] text-white font-bold truncate">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
