'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, GitBranch, Terminal, FileCode, Search, Edit3, Check, Loader2, ChevronRight, Cpu, Send, Copy } from 'lucide-react'

interface Session {
  id: string
  repo: string
  branch: string
  task: string
  model: string
  status: 'active' | 'idle' | 'done'
  age: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  files?: { name: string; content: string }[]
}

const TOOL_ICONS: Record<string, typeof Terminal> = {
  grep: Search, read: FileCode, write: FileCode, edit: Edit3, bash: Terminal,
}
const TOOL_COLORS: Record<string, string> = {
  grep: 'text-cyan-400', read: 'text-blue-400', write: 'text-green-400', edit: 'text-yellow-400', bash: 'text-purple-400',
}

export default function OpenAgentsClient() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeSession, setActiveSession] = useState<Session | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [newRepo, setNewRepo] = useState('')
  const [newTask, setNewTask] = useState('')
  const [activeFile, setActiveFile] = useState<string | null>(null)
  const [toolCalls, setToolCalls] = useState<{ type: string; path: string; status: 'running' | 'done' }[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load sessions on mount
  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/coding-agent/sessions')
      const data = await res.json()
      if (data.ok) {
        setSessions(data.sessions)
        if (data.sessions.length > 0 && !activeSession) {
          setActiveSession(data.sessions[0])
        }
      }
    } catch {}
  }

  const createSession = async () => {
    if (!newRepo || !newTask) return
    try {
      const res = await fetch('/api/coding-agent/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo: newRepo, task: newTask }),
      })
      const data = await res.json()
      if (data.ok) {
        setSessions((prev) => [data.session, ...prev])
        setActiveSession(data.session)
        setShowNew(false)
        setNewRepo('')
        setNewTask('')
        setMessages([{
          role: 'assistant',
          content: `Session started. Working on: ${newTask}\nRepo: ${newRepo}\nBranch: ${data.session.branch}`,
          timestamp: new Date(),
        }])
      }
    } catch {}
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading || !activeSession) return

    const userMsg: Message = { role: 'user', content: input, timestamp: new Date() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)
    setToolCalls([{ type: 'grep', path: `searching for ${input.slice(0, 20)}...`, status: 'running' }])

    try {
      const res = await fetch('/api/coding-agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          sessionId: activeSession.id,
          history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok) throw new Error('Chat failed')

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No stream')

      let fullContent = ''
      const assistantMsg: Message = { role: 'assistant', content: '', timestamp: new Date(), files: [] }
      setMessages((prev) => [...prev, assistantMsg])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '))

        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6))
            if (data.content) {
              fullContent += data.content
              setMessages((prev) => {
                const msgs = [...prev]
                msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: fullContent }
                return msgs
              })
            }
            if (data.done && data.files) {
              setMessages((prev) => {
                const msgs = [...prev]
                msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], files: data.files }
                return msgs
              })
              if (data.files?.length) setActiveFile(data.files[0].name)
            }
          } catch {}
        }
      }

      setToolCalls((prev) => prev.map((t) => ({ ...t, status: 'done' as const })))
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Error: Failed to get response.', timestamp: new Date() }])
    } finally {
      setLoading(false)
      setToolCalls([])
    }
  }

  const activeFileContent = messages.flatMap((m) => m.files || []).find((f) => f.name === activeFile)?.content

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      <header className="border-b border-zinc-900 px-6 py-3">
        <div className="max-w-[1600px] mx-auto flex items-center gap-3">
          <Cpu className="h-4 w-4 text-green-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Open Agents</span>
          <span className="ml-auto text-[10px] text-zinc-600">Powered by OpenClaw + Claude</span>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto flex h-[calc(100vh-49px)]">
        {/* Sessions Sidebar */}
        <div className="w-[260px] border-r border-zinc-900 flex flex-col">
          <div className="p-3 border-b border-zinc-900 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.24em] text-zinc-600">Sessions</span>
            <button onClick={() => setShowNew(true)} className="w-6 h-6 rounded border border-zinc-800 flex items-center justify-center text-zinc-600 hover:text-white transition-colors">
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {showNew && (
            <div className="p-3 border-b border-zinc-900 bg-zinc-950 space-y-2">
              <input value={newRepo} onChange={(e) => setNewRepo(e.target.value)} placeholder="owner/repo" className="w-full bg-black border border-zinc-800 rounded px-2 py-1.5 text-[11px] text-white placeholder-zinc-600 focus:outline-none focus:border-green-500/50" />
              <input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="What should the agent build?" className="w-full bg-black border border-zinc-800 rounded px-2 py-1.5 text-[11px] text-white placeholder-zinc-600 focus:outline-none focus:border-green-500/50" />
              <div className="flex gap-1">
                <button onClick={createSession} className="flex-1 bg-green-600 hover:bg-green-500 text-white rounded px-2 py-1 text-[10px] font-bold transition-colors">Create</button>
                <button onClick={() => setShowNew(false)} className="px-2 py-1 rounded border border-zinc-800 text-zinc-600 hover:text-white text-[10px] transition-colors">Cancel</button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sessions.length === 0 && (
              <div className="text-[10px] text-zinc-600 text-center py-4">No sessions yet. Create one to start.</div>
            )}
            {sessions.map((s) => (
              <button key={s.id} onClick={() => { setActiveSession(s); setMessages([]) }}
                className={`w-full text-left rounded-lg px-3 py-2.5 transition-colors ${activeSession?.id === s.id ? 'bg-zinc-900 border border-zinc-800' : 'hover:bg-zinc-950'}`}>
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${s.status === 'active' ? 'bg-green-500' : s.status === 'idle' ? 'bg-yellow-500' : 'bg-zinc-700'}`} />
                  <span className="text-[11px] font-bold text-white truncate">{s.task?.slice(0, 25) || 'Untitled'}</span>
                  <span className="ml-auto text-[9px] text-zinc-600">{s.age}</span>
                </div>
                <div className="mt-1 text-[9px] text-zinc-600 truncate">{s.repo}/{s.branch}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          <div className="flex-1 flex flex-col">
            {/* Session Header */}
            {activeSession && (
              <div className="border-b border-zinc-900 px-4 py-2.5 flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${activeSession.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-zinc-700'}`} />
                <span className="text-xs font-bold">{activeSession.repo}</span>
                <ChevronRight className="h-3 w-3 text-zinc-700" />
                <span className="text-xs text-zinc-400">{activeSession.branch}</span>
                <span className="ml-auto text-[10px] text-zinc-600">{activeSession.model}</span>
              </div>
            )}

            {/* Tool Activity */}
            {toolCalls.length > 0 && (
              <div className="border-b border-zinc-900 px-4 py-2">
                <div className="flex items-center gap-4 overflow-x-auto">
                  {toolCalls.map((tool, i) => {
                    const Icon = TOOL_ICONS[tool.type] || Terminal
                    return (
                      <div key={i} className="flex items-center gap-1.5 shrink-0">
                        {tool.status === 'running' ? <Loader2 className={`h-3 w-3 animate-spin ${TOOL_COLORS[tool.type] || 'text-zinc-400'}`} /> : <Check className="h-3 w-3 text-green-500" />}
                        <span className={`text-[10px] font-bold uppercase ${TOOL_COLORS[tool.type] || 'text-zinc-400'}`}>{tool.type}</span>
                        <span className="text-[10px] text-zinc-600 max-w-[120px] truncate">{tool.path}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full text-zinc-700 text-xs">
                  Start a conversation with your coding agent
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-6 ${msg.role === 'user' ? 'bg-green-600 text-white' : 'bg-zinc-900 text-zinc-300 border border-zinc-800'}`}>
                    <pre className="whitespace-pre-wrap font-mono text-xs">{msg.content}</pre>
                    {msg.files && msg.files.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {msg.files.map((f) => (
                          <button key={f.name} onClick={() => setActiveFile(f.name)} className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 text-[10px] text-zinc-400 hover:text-white transition-colors">
                            <FileCode className="h-3 w-3" />{f.name}
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
                <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Request changes or ask a question..." disabled={loading || !activeSession}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-green-500/50 disabled:opacity-50" />
                <button type="submit" disabled={loading || !input.trim() || !activeSession}
                  className="bg-green-600 hover:bg-green-500 text-white rounded-lg px-4 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Code Panel */}
          <div className="hidden lg:flex w-[400px] flex-col border-l border-zinc-900 bg-zinc-950">
            <div className="border-b border-zinc-900 px-4 py-2.5 flex items-center gap-2">
              <FileCode className="h-3.5 w-3.5 text-indigo-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{activeFile || 'No file selected'}</span>
              {activeFileContent && (
                <button onClick={() => navigator.clipboard?.writeText(activeFileContent)} className="ml-auto text-zinc-600 hover:text-white transition-colors"><Copy className="h-3 w-3" /></button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {activeFileContent ? (
                <pre className="text-[11px] text-zinc-400 whitespace-pre-wrap font-mono leading-5">{activeFileContent}</pre>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-zinc-700">
                  <FileCode className="h-8 w-8 mb-2 opacity-30" />
                  <span className="text-[10px]">Code appears here when agent generates files</span>
                </div>
              )}
            </div>
            {activeSession && (
              <div className="border-t border-zinc-900 p-4">
                <div className="text-[9px] uppercase tracking-[0.24em] text-zinc-600 mb-2">Sandbox</div>
                <div className="grid grid-cols-2 gap-3">
                  {[{ label: 'branch', value: activeSession.branch }, { label: 'status', value: activeSession.status },
                    { label: 'repo', value: activeSession.repo.split('/')[1] || '' }, { label: 'cost', value: '$0.00/hr' }].map((item) => (
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
