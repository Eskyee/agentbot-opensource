'use client'

import { useState, useRef, useEffect, memo } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export default memo(function AgentChat({ agentName }: { agentName?: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const activeJobRef = useRef<string | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    return () => {
      activeJobRef.current = null
    }
  }, [])

  const pollQueuedReply = async (jobId: string) => {
    activeJobRef.current = jobId

    for (let attempt = 0; attempt < 45; attempt += 1) {
      if (activeJobRef.current !== jobId) return

      const res = await fetch(`/api/jobs/${jobId}`, { cache: 'no-store' })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Queued chat failed')
      }

      const job = data.job
      if (job?.status === 'failed') {
        throw new Error(job.error || 'Queued chat failed')
      }

      if (job?.status === 'completed' && job?.result?.reply) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: String(job.result.reply),
          },
        ])
        return
      }

      await new Promise((resolve) => setTimeout(resolve, 2000))
    }

    throw new Error('Queued chat timed out')
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content }),
      })

      const data = await res.json()

      if (res.status === 202 && data?.queued && data?.jobId) {
        await pollQueuedReply(String(data.jobId))
        return
      }

      if (!res.ok) {
        setError(data.error || 'Failed to send message')
        return
      }

      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.reply || 'No response',
        },
      ])
    } catch (e: any) {
      setError(e.message || 'Connection error')
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 flex flex-col" style={{ height: '400px' }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600">Agent Chat</span>
          {agentName && (
            <span className="text-[10px] text-zinc-500">— {agentName}</span>
          )}
        </div>
        <button
          onClick={() => setMessages([])}
          className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-zinc-600 text-xs mt-8">
            <p>Send a message to your agent</p>
            <p className="text-zinc-700 mt-1">Connected via Gateway WebSocket</p>
          </div>
        )}

        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-3 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-white text-black'
                  : 'bg-zinc-800 text-zinc-200'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 px-3 py-2">
              <span className="text-zinc-500 text-sm animate-pulse">● ● ●</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-400">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-zinc-800 shrink-0">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600 resize-none font-mono"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-white text-black px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors shrink-0"
          >
            {loading ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
})
