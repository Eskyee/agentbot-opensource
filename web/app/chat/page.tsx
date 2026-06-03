'use client'

import { useState, useRef, useEffect, type FormEvent } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [bridgeStatus, setBridgeStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  // Check bridge status on mount
  useEffect(() => {
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'ping' }] }),
    })
      .then(r => {
        if (r.status === 503) setBridgeStatus('offline')
        else setBridgeStatus('online')
      })
      .catch(() => setBridgeStatus('offline'))
  }, [])

  const send = async (text?: string) => {
    const msg = (text || input).trim()
    if (!msg || loading) return

    setInput('')
    setError('')
    const newMessages: Message[] = [...messages, { role: 'user', content: msg }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'bridge_offline') {
          setBridgeStatus('offline')
          setError('Your local OpenClaw is offline. Start the bridge client on your Mac mini.')
        } else {
          setError(data.message || data.error || 'Something went wrong')
        }
        return
      }

      setBridgeStatus('online')
      setMessages([...newMessages, { role: 'assistant', content: data.reply }])
    } catch {
      setError('Network error. Try again.')
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    send()
  }

  return (
    <main className="min-h-screen bg-black text-white font-mono flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 px-4 py-3 flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">🦞</span>
          <span className="text-sm font-bold uppercase tracking-wider">Atlas</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            bridgeStatus === 'online' ? 'bg-green-500' :
            bridgeStatus === 'offline' ? 'bg-red-500' :
            'bg-yellow-500 animate-pulse'
          }`} />
          <span className="text-[10px] uppercase tracking-widest text-zinc-500">
            {bridgeStatus === 'online' ? 'Connected' :
             bridgeStatus === 'offline' ? 'Offline' :
             'Checking...'}
          </span>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🦞</div>
            <h1 className="text-xl font-bold uppercase tracking-tighter mb-2">Atlas Chat</h1>
            <p className="text-zinc-500 text-sm max-w-md mx-auto">
              Chat with your local OpenClaw from anywhere. Messages are relayed through
              the agentbot.sh bridge to your Mac mini.
            </p>
            {bridgeStatus === 'offline' && (
              <div className="mt-6 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs px-4 py-3 max-w-md mx-auto">
                <p className="font-bold mb-1">Bridge not connected</p>
                <p className="text-zinc-400">Run this on your Mac mini:</p>
                <code className="block mt-2 text-left bg-zinc-900 p-2 text-[11px] text-zinc-300 overflow-x-auto">
                  BRIDGE_SECRET=your-secret \<br/>
                  OPENCLAW_TOKEN=your-token \<br/>
                  node ~/.openclaw/bridge/client.js
                </code>
              </div>
            )}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] sm:max-w-[70%] px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-white text-black'
                : 'bg-zinc-900 text-zinc-300 border border-zinc-800'
            }`}>
              {msg.role === 'assistant' && (
                <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Atlas</div>
              )}
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-900 border border-zinc-800 px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center">
            <div className="inline-block bg-orange-500/10 border border-orange-500/30 text-red-400 text-xs px-4 py-2">
              {error}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-zinc-800 p-3 sm:p-4 flex gap-2 shrink-0">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message Atlas..."
          disabled={loading || bridgeStatus === 'offline'}
          className="flex-1 bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim() || bridgeStatus === 'offline'}
          className="bg-white text-black px-5 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </main>
  )
}
