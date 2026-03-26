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
}

const DEFAULT_MODELS: Model[] = [
  { id: 'xiaomi/mimo-v2-pro', name: 'MiMo-V2-Pro' },
  { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4' },
  { id: 'openai/gpt-4o', name: 'GPT-4o' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1' },
]

export default function DemoPage() {
  const [mode, setMode] = useState<'single' | 'compare'>('single')
  const [selectedModel, setSelectedModel] = useState('xiaomi/mimo-v2-pro')
  const [compareModels, setCompareModels] = useState(['xiaomi/mimo-v2-pro', 'anthropic/claude-sonnet-4'])
  const [messages, setMessages] = useState<Message[]>([])
  const [compareMessages, setCompareMessages] = useState<{ [model: string]: Message[] }>({})
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [compareLoading, setCompareLoading] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [showApiKeyInput, setShowApiKeyInput] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Force scroll to top on mount (mobile browsers are finicky)
  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      document.body.scrollTop = 0
      document.documentElement.scrollTop = 0
    }
    
    scrollToTop()
    const timeout = setTimeout(scrollToTop, 100)
    window.addEventListener('load', scrollToTop)
    
    return () => {
      clearTimeout(timeout)
      window.removeEventListener('load', scrollToTop)
    }
  }, [])

  // Scroll to bottom of messages when they update
  useEffect(() => {
    if (messages.length > 0 || Object.keys(compareMessages).length > 0) {
      scrollToBottom()
    }
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
          content: `Error: ${data.message || data.error}`
        }])
      } else {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.message
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
          id: Date.now().toString(),
          role: 'assistant' as const,
          content: data.error || data.message || 'No response'
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
    <main className="min-h-screen bg-black text-white font-mono flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex flex-col max-w-5xl mx-auto px-6 py-8 sm:py-12 w-full">
        {/* Page Title */}
        <div className="mb-8 sm:mb-12">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4 block">Live Demo</span>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tighter uppercase leading-none">
            Try Agentbot
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed mt-3 max-w-xl">
            Test AI models directly in your browser. Compare responses side by side.
          </p>
        </div>

        {/* API Key Input - Collapsible */}
        {showApiKeyInput && (
          <div className="mb-6 sm:mb-8 p-4 sm:p-6 border border-zinc-800 bg-black max-w-3xl mx-auto w-full">
            <div className="flex items-center justify-between mb-3">
              <label className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">Your API Key (Optional)</label>
              <button
                onClick={() => setShowApiKeyInput(false)}
                className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-white p-2 -mr-2"
              >
                Hide
              </button>
            </div>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-or-v1-..."
              className="w-full bg-black border border-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono min-h-[44px]"
            />
            <p className="mt-2 text-[10px] uppercase tracking-widest text-zinc-600">
              Optional: Add your own key for higher rate limits.
            </p>
          </div>
        )}

        {!showApiKeyInput && (
          <div className="mb-6 sm:mb-8 text-left">
            <button
              onClick={() => setShowApiKeyInput(true)}
              className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-white py-2 px-4 min-h-[44px] font-bold"
            >
              {apiKey ? 'API key saved' : 'Add API key'}
            </button>
          </div>
        )}

        {/* Mode Selector */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 sm:pb-0">
          <button
            onClick={() => setMode('single')}
            className={`px-6 py-3 font-bold text-xs uppercase tracking-widest transition-all whitespace-nowrap flex-shrink-0 min-h-[44px] ${
              mode === 'single' 
                ? 'bg-white text-black' 
                : 'border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
            }`}
          >
            Deployment Guide
          </button>
          <button
            onClick={() => setMode('compare')}
            className={`px-6 py-3 font-bold text-xs uppercase tracking-widest transition-all whitespace-nowrap flex-shrink-0 min-h-[44px] ${
              mode === 'compare' 
                ? 'bg-white text-black' 
                : 'border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
            }`}
          >
            Compare Models
          </button>
        </div>

        {/* Single Chat Mode */}
        {mode === 'single' && (
          <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full">
            {/* Model Selector */}
            <div className="mb-4 sm:mb-6 flex items-center justify-between gap-2 border-t border-zinc-800 pt-4">
              <div className="flex items-center gap-3 overflow-x-auto">
                <label className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold whitespace-nowrap">Model:</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="bg-black border border-zinc-800 px-4 py-2 text-sm text-white focus:outline-none focus:border-zinc-500 min-h-[44px] font-mono"
                >
                  {DEFAULT_MODELS.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={clearChat}
                className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-white transition-colors py-2 px-3 min-h-[44px] whitespace-nowrap font-bold"
              >
                Clear
              </button>
            </div>

            {/* Chat Messages */}
            <div className="border border-zinc-800 bg-black flex-1 min-h-[300px] sm:min-h-[400px] max-h-[calc(100vh-380px)] sm:max-h-[500px] overflow-y-auto mb-4 p-4 sm:p-6">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-start justify-center text-zinc-500 px-4">
                  <p className="text-sm font-bold uppercase tracking-widest mb-2 text-zinc-400">AI Agent SaaS Platform</p>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-6">Subscribe. Deploy in 60s. Scale as you grow.</p>
                  
                  {/* SaaS Plans */}
                  <div className="w-full max-w-lg mb-4 border-t border-zinc-800 pt-4">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold mb-3 text-left">Subscription Plans</p>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setInput('What\'s included in Solo £29/mo?')} className="text-xs bg-zinc-950 border border-zinc-800 px-3 py-1.5 hover:bg-zinc-800 hover:text-white text-zinc-400 transition-colors min-h-[32px] font-mono">
                        Solo £29/mo
                      </button>
                      <button onClick={() => setInput('What\'s included in Collective £69/mo?')} className="text-xs bg-zinc-950 border border-zinc-800 px-3 py-1.5 hover:bg-zinc-800 hover:text-white text-zinc-400 transition-colors min-h-[32px] font-mono">
                        Collective £69/mo
                      </button>
                      <button onClick={() => setInput('What\'s included in Label £149/mo?')} className="text-xs bg-zinc-950 border border-zinc-800 px-3 py-1.5 hover:bg-zinc-800 hover:text-white text-zinc-400 transition-colors min-h-[32px] font-mono">
                        Label £149/mo
                      </button>
                    </div>
                  </div>
                  
                  {/* SaaS Value */}
                  <div className="w-full max-w-lg mb-4 border-t border-zinc-800 pt-4">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold mb-3 text-left">SaaS Benefits</p>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setInput('What does the subscription include?')} className="text-xs bg-zinc-950 border border-zinc-800 px-3 py-1.5 hover:bg-zinc-800 hover:text-white text-zinc-400 transition-colors min-h-[32px] font-mono">
                        What&apos;s included?
                      </button>
                      <button onClick={() => setInput('How fast can I deploy?')} className="text-xs bg-zinc-950 border border-zinc-800 px-3 py-1.5 hover:bg-zinc-800 hover:text-white text-zinc-400 transition-colors min-h-[32px] font-mono">
                        Deploy speed?
                      </button>
                      <button onClick={() => setInput('Why SaaS vs self-hosted?')} className="text-xs bg-zinc-950 border border-zinc-800 px-3 py-1.5 hover:bg-zinc-800 hover:text-white text-zinc-400 transition-colors min-h-[32px] font-mono">
                        SaaS vs self-hosted?
                      </button>
                    </div>
                  </div>
                  
                  {/* Pricing & Costs */}
                  <div className="w-full max-w-lg border-t border-zinc-800 pt-4">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold mb-3 text-left">Pricing & Costs</p>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setInput('Are there any hidden fees?')} className="text-xs bg-zinc-950 border border-zinc-800 px-3 py-1.5 hover:bg-zinc-800 hover:text-white text-zinc-400 transition-colors min-h-[32px] font-mono">
                        Hidden fees?
                      </button>
                      <button onClick={() => setInput('How do AI costs work?')} className="text-xs bg-zinc-950 border border-zinc-800 px-3 py-1.5 hover:bg-zinc-800 hover:text-white text-zinc-400 transition-colors min-h-[32px] font-mono">
                        AI costs explained
                      </button>
                      <button onClick={() => setInput('Can I upgrade or downgrade?')} className="text-xs bg-zinc-950 border border-zinc-800 px-3 py-1.5 hover:bg-zinc-800 hover:text-white text-zinc-400 transition-colors min-h-[32px] font-mono">
                        Change plans?
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[90%] sm:max-w-[80%] px-4 py-3 ${
                        msg.role === 'user' 
                          ? 'bg-blue-500 text-white' 
                          : 'border border-zinc-800 bg-zinc-950 text-zinc-100'
                      }`}>
                        <div className="text-[10px] uppercase tracking-widest font-bold mb-1 opacity-70">
                          {msg.role === 'user' ? 'You' : 'Agentbot'}
                        </div>
                        <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="border border-zinc-800 bg-zinc-950 px-4 py-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-zinc-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-zinc-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-zinc-500 animate-bounce" style={{ animationDelay: '300ms' }} />
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
                placeholder="Ask about deploying Agentbot..."
                className="flex-1 bg-black border border-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 min-h-[48px] font-mono"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-6 py-3 bg-white text-black font-bold text-xs uppercase tracking-widest hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap min-h-[48px] min-w-[80px]"
              >
                Send
              </button>
            </form>
          </div>
        )}

        {/* Compare Mode */}
        {mode === 'compare' && (
          <div className="flex-1 flex flex-col">
            {/* Compare Model Selectors */}
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 border-t border-zinc-800 pt-4">
              <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto pb-2 sm:pb-0 -mx-3 px-3 sm:mx-0 sm:px-0">
                <label className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold whitespace-nowrap">Compare:</label>
                {compareModels.map((modelId, idx) => (
                  <select
                    key={idx}
                    value={modelId}
                    onChange={(e) => {
                      const newModels = [...compareModels]
                      newModels[idx] = e.target.value
                      setCompareModels(newModels)
                    }}
                    className="bg-black border border-zinc-800 px-4 py-2 text-sm text-white focus:outline-none focus:border-zinc-500 min-h-[44px] flex-shrink-0 font-mono"
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
                className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-white transition-colors py-2 px-3 min-h-[44px] whitespace-nowrap self-start sm:self-auto font-bold"
              >
                Clear
              </button>
            </div>

            {/* Compare Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 min-h-0">
              {compareModels.map((modelId) => (
                <div key={modelId} className="border border-zinc-800 bg-black overflow-hidden flex flex-col min-h-[250px] sm:min-h-[300px]">
                  <div className="bg-zinc-950 px-4 py-2 border-b border-zinc-800 flex-shrink-0">
                    <span className="font-bold text-xs uppercase tracking-widest">{getModelName(modelId)}</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 min-h-0">
                    {(compareMessages[modelId] || []).length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-zinc-600 py-8 sm:py-12">
                        <p className="text-[10px] uppercase tracking-widest">Send a message to compare</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {(compareMessages[modelId] || []).map((msg) => (
                          <div key={msg.id} className={`px-3 py-2 ${
                            msg.role === 'user' ? 'bg-blue-500/20 text-blue-100 border border-blue-500/30' : 'border border-zinc-800 bg-zinc-950 text-zinc-100'
                          }`}>
                            <div className="text-[10px] uppercase tracking-widest font-bold mb-1 opacity-70">
                              {msg.role === 'user' ? 'You' : 'AI'}
                            </div>
                            <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          </div>
                        ))}
                        {compareLoading && (
                          <div className="flex items-center gap-2 text-zinc-500 text-xs">
                            <div className="flex gap-1">
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-zinc-500 animate-bounce" />
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-zinc-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-zinc-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            <span className="text-[10px] uppercase tracking-widest">Thinking...</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="flex gap-3 mt-4 max-w-2xl mx-auto w-full">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about deployment options..."
                className="flex-1 bg-black border border-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 min-h-[48px] font-mono"
                disabled={compareLoading}
              />
              <button
                type="submit"
                disabled={compareLoading || !input.trim()}
                className="px-6 py-3 bg-white text-black font-bold text-xs uppercase tracking-widest hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap min-h-[48px]"
              >
                Compare
              </button>
            </form>
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 sm:mt-16 border-t border-zinc-800 pt-12">
          <p className="text-zinc-400 text-sm mb-4">Like what you see?</p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all min-h-[48px]"
          >
            Deploy Your Fleet
          </Link>
          <p className="mt-4 text-[10px] uppercase tracking-widest text-zinc-600">
            No credit card required.
          </p>
        </div>
      </div>
    </main>
  )
}
