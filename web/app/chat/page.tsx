'use client'

import { useState, useRef, useEffect, type FormEvent } from 'react'
import { useCustomSession } from '@/app/lib/useCustomSession'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

function SetupInstructions() {
  const [secret, setSecret] = useState('')

  return (
    <div className="border border-zinc-800 bg-zinc-950/60 p-6 space-y-6">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-2">Connect Your OpenClaw</h3>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Chat with your local OpenClaw from any device. Runs on your machine — your data stays with you.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Step 1 — Generate a secret</div>
          <div className="flex gap-2">
            <code className="flex-1 bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs font-mono text-zinc-300">
              openssl rand -hex 32
            </code>
            <button
              onClick={() => {
                const bytes = new Uint8Array(32)
                crypto.getRandomValues(bytes)
                setSecret(Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(''))
              }}
              className="px-3 py-2 text-[10px] uppercase tracking-widest border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white transition-colors"
            >
              Generate
            </button>
          </div>
          {secret && (
            <div className="mt-2 bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs font-mono text-green-400 break-all select-all">
              {secret}
            </div>
          )}
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Step 2 — Add to Vercel</div>
          <p className="text-xs text-zinc-500">
            Add <code className="text-zinc-300">BRIDGE_SECRET</code> to your Vercel project&apos;s environment variables.
          </p>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Step 3 — Start the bridge</div>
          <div className="bg-zinc-900 border border-zinc-800 px-4 py-3 text-xs font-mono text-zinc-300 space-y-1">
            <div><span className="text-zinc-500"># Install the bridge client</span></div>
            <div>curl -sSL https://agentbot.sh/bridge/client.js -o ~/.openclaw/bridge/client.js</div>
            <div className="mt-2"><span className="text-zinc-500"># Run it</span></div>
            <div>BRIDGE_SECRET={secret || '***'} \</div>
            <div>&nbsp;&nbsp;OPENCLAW_CMD=openclaw \</div>
            <div>&nbsp;&nbsp;node ~/.openclaw/bridge/client.js</div>
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Step 4 — Refresh this page</div>
          <p className="text-xs text-zinc-500">
            Once the bridge is running, the chat will connect automatically.
          </p>
        </div>
      </div>

      <div className="bg-orange-500/10 border border-orange-500/30 px-4 py-3 text-xs text-orange-400">
        <strong>Requirements:</strong> macOS or Linux with OpenClaw installed and running locally.
      </div>
    </div>
  )
}

export default function ChatPage() {
  const { data: session } = useCustomSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [bridgeStatus, setBridgeStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [showSetup, setShowSetup] = useState(false)
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
        if (r.status === 503) {
          setBridgeStatus('offline')
          setShowSetup(true)
        } else if (r.ok) {
          setBridgeStatus('online')
        } else {
          setBridgeStatus('offline')
        }
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
          setShowSetup(true)
          setError('Your OpenClaw is offline. Start the bridge client on your machine.')
        } else {
          setError(data.message || data.error || 'Something went wrong')
        }
        return
      }

      setBridgeStatus('online')
      setShowSetup(false)
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

  if (!session) {
    return (
      <main className="min-h-screen bg-black text-white font-mono flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <div className="text-5xl">🦞</div>
          <h1 className="text-xl font-bold uppercase tracking-tighter">Atlas Chat</h1>
          <p className="text-sm text-zinc-400">Sign in to chat with your local OpenClaw from anywhere.</p>
          <a href="/login" className="inline-block bg-white text-black px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors">
            Sign In
          </a>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white font-mono flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 px-4 py-3 flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">🦞</span>
          <span className="text-sm font-bold uppercase tracking-wider">Atlas</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => setShowSetup(!showSetup)}
            className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
          >
            Setup
          </button>
          <div className="flex items-center gap-2">
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
        </div>
      </header>

      {/* Setup instructions (collapsible) */}
      {showSetup && (
        <div className="border-b border-zinc-800 p-4">
          <SetupInstructions />
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !showSetup && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🦞</div>
            <h1 className="text-xl font-bold uppercase tracking-tighter mb-2">Atlas Chat</h1>
            <p className="text-zinc-500 text-sm max-w-md mx-auto">
              Chat with your local OpenClaw from anywhere. Messages are relayed through
              the agentbot.sh bridge to your machine.
            </p>
            {bridgeStatus === 'offline' && (
              <button
                onClick={() => setShowSetup(true)}
                className="mt-6 bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
              >
                Set Up Bridge →
              </button>
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
          disabled={loading || (bridgeStatus === 'offline' && messages.length === 0)}
          className="flex-1 bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-white text-black px-5 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </main>
  )
}
