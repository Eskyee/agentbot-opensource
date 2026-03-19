'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  model?: string
}

interface Model {
  id: string
  name: string
  provider: string
}

const DEFAULT_MODELS: Model[] = [
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'google/gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', provider: 'Google' },
  { id: 'minimax/minimax-chat', name: 'MiniMax M2.7', provider: 'MiniMax' },
]

export default function DemoPage() {
  const [mode, setMode] = useState<'single' | 'compare'>('single')
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODELS[0].id)
  const [compareModels, setCompareModels] = useState([DEFAULT_MODELS[0].id, DEFAULT_MODELS[1].id])
  const [messages, setMessages] = useState<Message[]>([])
  const [compareMessages, setCompareMessages] = useState<{ [model: string]: Message[] }>({})
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [compareLoading, setCompareLoading] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [showApiKeyInput, setShowApiKeyInput] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, compareMessages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const conversation = messages.map(m => ({ role: m.role, content: m.content }))
      conversation.push({ role: 'user', content: input })
      
      const res = await fetch('/api/demo/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          model: selectedModel,
          conversation,
          apiKey
        })
      })

      const data = await res.json()
      
      if (data.error) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Error: ${data.error}`
        }])
      } else {
        setMessages(prev => [...prev, {
          id: data.id || Date.now().toString(),
          role: 'assistant',
          content: data.message,
          model: selectedModel
        }])
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Failed to get response'
      }])
    } finally {
      setLoading(false)
    }
  }

  const sendCompareMessage = async () => {
    if (!input.trim() || compareLoading) return
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    }

    const newCompareMessages: { [model: string]: Message[] } = {}
    compareModels.forEach(modelId => {
      newCompareMessages[modelId] = [...(compareMessages[modelId] || []), userMessage]
    })
    setCompareMessages(newCompareMessages)
    setInput('')
    setCompareLoading(true)

    try {
      const conversation = messages.map(m => ({ role: m.role, content: m.content }))
      conversation.push({ role: 'user', content: input })
      
      const results = await Promise.all(
        compareModels.map(async (modelId) => {
          const res = await fetch('/api/demo/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: input,
              model: modelId,
              conversation,
              apiKey
            })
          })
          const data = await res.json()
          return { modelId, data }
        })
      )

      const updatedCompareMessages: { [model: string]: Message[] } = { ...compareMessages }
      
      results.forEach(({ modelId, data }) => {
        const current = updatedCompareMessages[modelId] || []
        updatedCompareMessages[modelId] = [...current, {
          id: data.id || Date.now().toString(),
          role: 'assistant' as const,
          content: data.error || data.message || 'No response',
          model: modelId
        }]
      })
      
      setCompareMessages(updatedCompareMessages)
    } catch (error) {
      console.error('Compare error:', error)
    } finally {
      setCompareLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'single') {
      sendMessage()
    } else {
      sendCompareMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
    setCompareMessages({})
  }

  const getModelName = (modelId: string) => {
    const model = DEFAULT_MODELS.find(m => m.id === modelId)
    return model?.name || modelId
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-gray-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-2xl">🦞</span>
            <span className="font-black tracking-tighter text-xl">AGENTBOT</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link
              href="/signup"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-500 transition-colors"
            >
              Deploy Your Fleet →
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* API Key Input */}
        {showApiKeyInput && (
          <div className="mb-8 p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-bold text-blue-400">🔑 OpenRouter API Key</label>
              <button
                onClick={() => setShowApiKeyInput(false)}
                className="text-xs text-gray-500 hover:text-white"
              >
                Hide
              </button>
            </div>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-or-v1-..."
              className="w-full bg-gray-900 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <p className="mt-2 text-xs text-gray-500">
              Get free key at{' '}
              <a href="https://openrouter.ai" target="_blank" rel="noopener" className="text-blue-400 hover:underline">
                openrouter.ai
              </a>
              {' '}&middot; Demo runs on your key
            </p>
          </div>
        )}

        {!showApiKeyInput && (
          <div className="mb-8 text-center">
            <button
              onClick={() => setShowApiKeyInput(true)}
              className="text-sm text-gray-500 hover:text-white"
            >
              🔑 {apiKey ? 'API key saved' : 'Add API key'}
            </button>
          </div>
        )}

        {/* Mode Selector */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <button
            onClick={() => setMode('single')}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${
              mode === 'single' 
                ? 'bg-white text-black' 
                : 'bg-gray-900 border border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            💬 Chat Demo
          </button>
          <button
            onClick={() => setMode('compare')}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${
              mode === 'compare' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-900 border border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            ⚡ Compare Models
          </button>
        </div>

        {/* Single Chat Mode */}
        {mode === 'single' && (
          <div className="max-w-3xl mx-auto">
            {/* Model Selector */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <label className="text-sm font-bold text-gray-400">Model:</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="bg-gray-900 border border-white/10 rounded-lg px-4 py-2 text-sm font-medium text-white focus:outline-none focus:border-blue-500"
                >
                  {DEFAULT_MODELS.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name} ({model.provider})
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={clearChat}
                className="text-sm text-gray-500 hover:text-white transition-colors"
              >
                Clear ↻
              </button>
            </div>

            {/* Chat Messages */}
            <div className="bg-gray-900/50 border border-white/10 rounded-2xl min-h-[400px] max-h-[500px] overflow-y-auto mb-4 p-6">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <div className="text-4xl mb-4">🤖</div>
                  <p className="text-lg font-medium mb-2">Try Agentbot for free</p>
                  <p className="text-sm mb-4">Send a message to chat with AI models</p>
                  
                  {/* Quick Help Links */}
                  <div className="text-xs space-y-2 mt-4">
                    <p className="text-gray-400">Need help choosing?</p>
                    <div className="flex gap-2 flex-wrap justify-center">
                      <Link href="/pricing" className="text-blue-400 hover:underline">View Plans →</Link>
                      <span className="text-gray-600">|</span>
                      <span className="text-gray-500">Solo £29 (chat) • Collective £69 (+ business) • Label £149 (full back office)</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        msg.role === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-800 text-gray-100'
                      }`}>
                        <div className="text-xs font-bold mb-1 opacity-70">
                          {msg.role === 'user' ? 'You' : getModelName(msg.model || '')}
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-800 rounded-2xl px-4 py-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything..."
                className="flex-1 bg-gray-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send →
              </button>
            </form>
          </div>
        )}

        {/* Compare Mode */}
        {mode === 'compare' && (
          <div>
            {/* Compare Model Selectors */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <label className="text-sm font-bold text-gray-400">Compare:</label>
                {compareModels.map((modelId, idx) => (
                  <select
                    key={idx}
                    value={modelId}
                    onChange={(e) => {
                      const newModels = [...compareModels]
                      newModels[idx] = e.target.value
                      setCompareModels(newModels)
                    }}
                    className="bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-sm font-medium text-white focus:outline-none focus:border-blue-500"
                  >
                    {DEFAULT_MODELS.map(model => (
                      <option key={model.id} value={model.id} disabled={compareModels.includes(model.id) && compareModels[idx] !== model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                ))}
              </div>
              <button
                onClick={clearChat}
                className="text-sm text-gray-500 hover:text-white transition-colors"
              >
                Clear ↻
              </button>
            </div>

            {/* Compare Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {compareModels.map((modelId) => (
                <div key={modelId} className="bg-gray-900/50 border border-white/10 rounded-2xl overflow-hidden">
                  <div className="bg-gray-800 px-4 py-2 border-b border-white/10">
                    <span className="font-bold text-sm">{getModelName(modelId)}</span>
                  </div>
                  <div className="min-h-[300px] max-h-[400px] overflow-y-auto p-4">
                    {(compareMessages[modelId] || []).length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-500 py-12">
                        <p className="text-sm">Send a message to compare</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {(compareMessages[modelId] || []).map((msg) => (
                          <div key={msg.id} className={`rounded-xl px-3 py-2 ${
                            msg.role === 'user' ? 'bg-blue-600/20 text-blue-100' : 'bg-gray-800 text-gray-100'
                          }`}>
                            <div className="text-[10px] font-bold mb-1 opacity-70">
                              {msg.role === 'user' ? 'You' : 'AI'}
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        ))}
                        {compareLoading && (
                          <div className="flex items-center gap-2 text-gray-500 text-sm">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            <span>Thinking...</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="flex gap-3 mt-4 max-w-2xl mx-auto">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question to compare models..."
                className="flex-1 bg-gray-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                disabled={compareLoading}
              />
              <button
                type="submit"
                disabled={compareLoading || !input.trim()}
                className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Compare →
              </button>
            </form>
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-400 mb-4">Like what you see?</p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-4 text-sm font-bold text-black hover:bg-gray-200 transition-all"
          >
            DEPLOY YOUR FLEET →
          </Link>
          <p className="mt-4 text-xs text-gray-600">
            No credit card required. Your own API key required for production use.
          </p>
        </div>
      </div>
    </div>
  )
}
