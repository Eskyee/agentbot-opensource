'use client'

import { useState, useRef, useEffect, type FormEvent } from 'react'
import { useCustomSession } from '@/app/lib/useCustomSession'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

function SetupInstructions({ onConnected }: { onConnected: () => void }) {
  const [step, setStep] = useState<'idle' | 'generating' | 'ready' | 'checking' | 'connected'>('idle')
  const [command, setCommand] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  // Auto-generate secret on mount
  useEffect(() => {
    generateSecret()
  }, [])

  const generateSecret = async () => {
    setStep('generating')
    setError('')
    try {
      const res = await fetch('/api/bridge/setup', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate secret')
      setCommand(data.command)
      setStep('ready')
    } catch (err: any) {
      setError(err.message)
      setStep('idle')
    }
  }

  const copyCommand = async () => {
    await navigator.clipboard.writeText(command)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const checkConnection = async () => {
    setStep('checking')
    // Poll for connection (check every 2s, up to 30s)
    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 2000))
      try {
        const res = await fetch('/api/bridge/status')
        const data = await res.json()
        if (data.connected) {
          setStep('connected')
          onConnected()
          return
        }
      } catch {}
    }
    setStep('ready')
    setError('Bridge not detected. Make sure the command is running.')
  }

  if (step === 'connected') {
    return (
      <div className="border border-green-500/30 bg-green-500/10 p-6 text-center">
        <div className="text-3xl mb-3">✅</div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-green-400 mb-2">Connected!</h3>
        <p className="text-xs text-zinc-400">Your OpenClaw bridge is live. Start chatting.</p>
      </div>
    )
  }

  return (
    <div className="border border-zinc-800 bg-zinc-950/60 p-6 space-y-5">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-2">Connect Your OpenClaw</h3>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Chat with your local OpenClaw from any device. Runs on your machine — your data stays with you.
        </p>
      </div>

      {error && (
        <div className="bg-orange-500/10 border border-orange-500/30 px-4 py-3 text-xs text-orange-400">
          {error}
        </div>
      )}

      {/* Step 1: Copy the command */}
      <div>
        <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">
          Step 1 — Copy & run this command
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="text-[10px] text-zinc-500 mb-2">Paste this in your terminal:</div>
          <code className="block text-xs font-mono text-green-400 break-all leading-relaxed select-all">
            {command || 'Loading...'}
          </code>
          <button
            onClick={copyCommand}
            className="mt-3 px-3 py-1.5 text-[10px] uppercase tracking-widest border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white transition-colors"
          >
            {copied ? '✓ Copied' : 'Copy Command'}
          </button>
        </div>
      </div>

      {/* Step 2: Verify */}
      <div>
        <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">
          Step 2 — Verify connection
        </div>
        <button
          onClick={checkConnection}
          disabled={step === 'checking'}
          className="w-full bg-white text-black px-4 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors disabled:opacity-50"
        >
          {step === 'checking' ? 'Checking...' : 'Check Connection'}
        </button>
      </div>

      <div className="text-[10px] text-zinc-600 leading-relaxed">
        <strong>Requirements:</strong> macOS or Linux with OpenClaw installed. The command installs the bridge client if needed, then connects to Agentbot.
      </div>
    </div>
  )
}

export default function ChatPage() {
  const { data: session, status } = useCustomSession()
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
    fetch('/api/bridge/status')
      .then(r => r.json())
      .then(data => {
        if (data.connected) {
          setBridgeStatus('online')
        } else if (data.hasSecret) {
          // Has secret but bridge not connected — show setup
          setBridgeStatus('offline')
          setShowSetup(true)
        } else {
          // No secret — first time setup
          setBridgeStatus('offline')
          setShowSetup(true)
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
          setError('Your OpenClaw is offline. Start the bridge on your machine.')
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

  if (status === 'loading') {
    return (
      <main className="min-h-screen bg-black text-white font-mono flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🦞</div>
          <p className="text-sm text-zinc-500">Loading...</p>
        </div>
      </main>
    )
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
            {showSetup ? 'Hide Setup' : 'Setup'}
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
          <SetupInstructions onConnected={() => {
            setBridgeStatus('online')
            setShowSetup(false)
          }} />
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
              the Agentbot bridge to your machine.
            </p>
            {bridgeStatus === 'offline' && (
              <button
                onClick={() => setShowSetup(true)}
                className="mt-6 bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
              >
                Connect OpenClaw →
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
