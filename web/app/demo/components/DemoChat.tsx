'use client'

import { useState, useRef, useEffect, type FormEvent } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'

const SUGGESTIONS = [
  'What can you do?',
  'How do I deploy an agent?',
  'What is x402?',
  'Tell me about baseFM',
  'What models do you support?',
  'How much does it cost?',
]

function getText(content: { parts: Array<{ type: string; text?: string }> }): string {
  return content.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text' && typeof p.text === 'string')
    .map(p => p.text)
    .join('')
}

export function DemoChat() {
  const [input, setInput] = useState('')
  const [playingIdx, setPlayingIdx] = useState<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/demo/chat' }),
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const sendSuggestion = (text: string) => {
    if (isLoading) return
    sendMessage({ text })
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput('')
    inputRef.current?.focus()
  }

  const speak = async (text: string, idx: number) => {
    if (playingIdx === idx) {
      audioRef.current?.pause()
      setPlayingIdx(null)
      return
    }
    audioRef.current?.pause()
    setPlayingIdx(idx)
    try {
      const res = await fetch('/api/demo/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) throw new Error('TTS failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => { setPlayingIdx(null); URL.revokeObjectURL(url) }
      audio.onerror = () => { setPlayingIdx(null); URL.revokeObjectURL(url) }
      audio.play()
    } catch {
      setPlayingIdx(null)
    }
  }

  return (
    <div className="border border-zinc-800 bg-zinc-950/60 flex flex-col h-[600px]">
      {/* Header */}
      <div className="border-b border-zinc-800 px-4 py-3 flex items-center gap-3">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-[10px] uppercase tracking-widest text-zinc-400">Live Demo — Free Model</span>
        <span className="ml-auto text-[10px] text-zinc-600">10 messages free</span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🤖</div>
            <p className="text-zinc-400 text-sm mb-6">Try asking me anything. I&apos;m powered by MiMo V2.5 Pro.</p>
            <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendSuggestion(s)}
                  className="text-left text-xs text-zinc-500 border border-zinc-800 px-3 py-2 hover:border-zinc-600 hover:text-white transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          const text = getText(msg as any)
          return (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-white text-black'
                  : 'bg-zinc-900 text-zinc-300 border border-zinc-800'
              }`}>
                {msg.role === 'assistant' && (
                  <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Agentbot</div>
                )}
                <div className="whitespace-pre-wrap">{text}</div>
                {msg.role === 'assistant' && !isLoading && text && (
                  <button
                    onClick={() => speak(text, i)}
                    className="mt-2 inline-flex items-center gap-1 text-zinc-600 hover:text-zinc-300 transition-colors text-xs"
                    title="Listen"
                  >
                    {playingIdx === i ? (
                      <>
                        <span className="animate-pulse">■</span> Stop
                      </>
                    ) : (
                      <>
                        <span>🔊</span> Speak
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {isLoading && (
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
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-zinc-800 p-4 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Agentbot anything..."
          disabled={isLoading}
          className="flex-1 bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  )
}
