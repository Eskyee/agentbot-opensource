'use client'

import { useState, useRef, useEffect } from 'react'
import { Streamdown } from 'streamdown'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatWindowProps {
  userId?: string
  botUsername?: string
  isOpen: boolean
  onClose: () => void
}

export default function ChatWindow({ userId, botUsername, isOpen, onClose }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          message: userMessage.content,
          conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get response')
      }

      const assistantMessage: Message = {
        id: (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)),
        role: 'assistant',
        content: (data?.response ?? '(no response)').toString(),
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed bottom-4 right-4 w-96 max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-2rem] bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-700 flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-700 bg-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-xl">
            {botUsername ? ' telegram' : 'bot'}
          </div>
          <div>
            <h3 className="font-semibold">Chat with your Agent</h3>
            {botUsername && (
              <a 
                href={`https://t.me/${botUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:underline"
              >
                @{botUsername} on Telegram
              </a>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
          aria-label="Close chat"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-zinc-400 py-8">
            <div className="text-4xl mb-4">lobster</div>
            <p className="text-sm">Start chatting with your OpenClaw agent</p>
            {botUsername && (
              <a
                href={`https://t.me/${botUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 text-blue-400 hover:underline text-sm"
              >
                Or chat on Telegram @{botUsername}
              </a>
            )}
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-green-500 text-black'
                  : 'bg-zinc-700 text-white'
              }`}
            >
              {message.role === 'assistant' ? (
                <Streamdown>{message.content}</Streamdown>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              )}
              <p className={`text-xs mt-1 ${
                message.role === 'user' ? 'text-black/60' : 'text-zinc-400'
              }`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-700 rounded-2xl px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="text-center text-red-400 text-sm py-2">
            {error}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 border-t border-zinc-700">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={loading}
            className="flex-1 bg-zinc-800 border border-zinc-600 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            title="Send message"
            aria-label="Send message"
            className="bg-green-500 hover:bg-green-400 disabled:bg-zinc-600 disabled:cursor-not-allowed text-black font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  )
}