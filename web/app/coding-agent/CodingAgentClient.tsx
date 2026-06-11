'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Terminal, FileCode, Loader2, Copy, Check } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  files?: { name: string; content: string }[]
}

export default function CodingAgentClient() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'I\'m your coding agent. Describe what you want to build — a landing page, an API, a script, anything. I\'ll write the code and run it for you.',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeFile, setActiveFile] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg: Message = { role: 'user', content: input, timestamp: new Date() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/coding-agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      const data = await res.json()

      const assistantMsg: Message = {
        role: 'assistant',
        content: data.response || 'Something went wrong.',
        timestamp: new Date(),
        files: data.files || [],
      }
      setMessages((prev) => [...prev, assistantMsg])
      if (data.files?.length) setActiveFile(data.files[0].name)
    } catch {
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
    <div className="flex h-[calc(100vh-56px)] bg-black text-white font-mono">
      {/* Chat Panel */}
      <div className="flex-1 flex flex-col border-r border-zinc-800">
        <div className="border-b border-zinc-800 px-4 py-3 flex items-center gap-2">
          <Terminal className="h-4 w-4 text-green-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Coding Agent</span>
          <span className="ml-auto text-[10px] text-zinc-600">Powered by OpenClaw</span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-6 ${
                  msg.role === 'user'
                    ? 'bg-green-600 text-white'
                    : 'bg-zinc-900 text-zinc-300 border border-zinc-800'
                }`}
              >
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
                <span className="text-xs text-zinc-500">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="border-t border-zinc-800 px-4 py-3">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe what you want to build..."
              disabled={loading}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-green-500/50 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-green-600 hover:bg-green-500 text-white rounded-lg px-4 py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {['Build a todo app', 'Create a REST API', 'Write a Python script', 'Build a landing page'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setInput(s)}
                className="text-[10px] px-2 py-1 rounded border border-zinc-800 text-zinc-600 hover:text-white hover:border-zinc-600 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Code Panel */}
      <div className="hidden lg:flex w-[450px] flex-col bg-zinc-950">
        <div className="border-b border-zinc-800 px-4 py-3 flex items-center gap-2">
          <FileCode className="h-4 w-4 text-indigo-400" />
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
            {activeFile || 'No file selected'}
          </span>
          {activeFileContent && (
            <button
              onClick={() => navigator.clipboard?.writeText(activeFileContent)}
              className="ml-auto text-zinc-600 hover:text-white transition-colors"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {activeFileContent ? (
            <pre className="text-xs text-zinc-400 whitespace-pre-wrap font-mono leading-5">
              {activeFileContent}
            </pre>
          ) : (
            <div className="flex items-center justify-center h-full text-zinc-700 text-xs">
              Code will appear here when the agent generates files
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
