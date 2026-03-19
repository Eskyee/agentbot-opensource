'use client'

import { useState, Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

type Step = 'telegram' | 'token' | 'userid' | 'agenttype' | 'ai' | 'model' | 'skills' | 'deploy' | 'done'

const FLOW_STEPS: Step[] = ['telegram', 'token', 'userid', 'agenttype', 'ai', 'model', 'skills', 'deploy', 'done']

function OnboardContent() {
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan') || 'free'
  const mode = searchParams.get('mode') || 'create' // link, create, deploy
  const isPaid = searchParams.get('paid') === '1'
  const paymentError = searchParams.get('payment_error')
  const paymentCancelled = searchParams.get('payment_cancelled') === '1'
  
  const [step, setStep] = useState<Step>('telegram')
  const [telegramToken, setTelegramToken] = useState('')
  const [telegramUserId, setTelegramUserId] = useState('')
  const [aiProvider, setAiProvider] = useState('openrouter')
  const [apiKey, setApiKey] = useState('')
  const [selectedModel, setSelectedModel] = useState('openrouter/meta-llama/llama-3.3-70b-instruct')
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['web-search', 'file-handler'])
  const [agentType, setAgentType] = useState('general')
  const [isValidating, setIsValidating] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ userId: string; subdomain: string; url: string; streamKey?: string; liveStreamId?: string } | null>(null)
  const [botInfo, setBotInfo] = useState<{ username: string } | null>(null)
  const [openclawVersion, setOpenclawVersion] = useState('2026.2.26')

  // Available models (Tiered for OpenClaw) - via OpenRouter
  const AVAILABLE_MODELS = [
    { id: 'openrouter/mistralai/mistral-7b-instruct', name: 'Mistral 7B (OpenClaw Free)', provider: 'openrouter', description: 'Lightweight & fast. Free for all users.', recommended: true, tier: 'free' },
    { id: 'openrouter/meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 (Underground Optimized)', provider: 'openrouter', description: 'Advanced general assistant. Requires Underground plan.', tier: 'underground' },
    { id: 'openrouter/qwen/qwen-2.5-coder-32b-instruct', name: 'Qwen 2.5 (Collective Tuned)', provider: 'openrouter', description: 'Smart contracts & coding logic. Requires Collective plan.', tier: 'collective' },
    { id: 'openrouter/deepseek/deepseek-r1', name: 'DeepSeek R1 (Label Reasoning)', provider: 'openrouter', description: 'Maximum intelligence. Requires Label plan.', tier: 'label' },
  ]

  // Available ready-to-use skills
  const AVAILABLE_SKILLS = [
    { id: 'web-search', name: 'Web Search', description: 'Search the web for information', icon: '🔍' },
    { id: 'file-handler', name: 'File Handler', description: 'Read, write, and process files', icon: '📁' },
    { id: 'code-interpreter', name: 'Code Runner', description: 'Execute code snippets safely', icon: '💻' },
    { id: 'image-analyzer', name: 'Image Analyzer', description: 'Analyze and describe images', icon: '🖼️' },
    { id: ' scheduler', name: 'Scheduler', description: 'Schedule tasks and reminders', icon: '⏰' },
    { id: 'email-sender', name: 'Email Sender', description: 'Send emails via SMTP', icon: '📧' },
    { id: 'api-caller', name: 'API Caller', description: 'Make HTTP requests', icon: '🌐' },
    { id: 'database-query', name: 'Database Query', description: 'Query databases', icon: '🗄️' }
  ]

  // Agent types - each with different default config
  const AGENT_TYPES = [
    { id: 'general', name: 'General Assistant', description: 'Versatile agent for any task', icon: '🤖', color: 'purple' },
    { id: 'dj', name: 'Music DJ', description: '24/7 music streaming with track selection', icon: '🎵', color: 'green' },
    { id: 'business', name: 'Business Assistant', description: 'Email, calendar, and admin tasks', icon: '💼', color: 'blue' },
    { id: 'social', name: 'Social Media', description: 'Post to Twitter, generate content', icon: '📱', color: 'pink' },
    { id: 'support', name: 'Customer Support', description: 'FAQ, tickets, and helpdesk', icon: '🎫', color: 'orange' },
    { id: 'research', name: 'Research Agent', description: 'Web search, analysis, and reports', icon: '🔬', color: 'cyan' },
  ]

  useEffect(() => {
    // Handle payment status messages
    if (paymentError) {
      setError(`Payment error: ${paymentError}`)
    }
    if (paymentCancelled) {
      setError('Payment was cancelled. You can try again when ready.')
    }
  }, [paymentError, paymentCancelled])

  useEffect(() => {
    const loadVersion = async () => {
      try {
        const res = await fetch('/api/openclaw-version')
        const data = await res.json()
        if (data?.openclawVersion) {
          setOpenclawVersion(data.openclawVersion)
        }
      } catch {
        // keep default
      }
    }
    loadVersion()
  }, [])

  const validateToken = async () => {
    setIsValidating(true)
    setError('')
    
    try {
      const res = await fetch('/api/validate-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: telegramToken })
      })
      
      const data = await res.json()
      
      if (data.valid) {
        setBotInfo(data.bot)
        setStep('ai')
      } else {
        setError(data.error || 'Invalid token')
      }
    } catch (e) {
      setError('Failed to validate token')
    } finally {
      setIsValidating(false)
    }
  }

  const deploy = async () => {
    setIsDeploying(true)
    setError('')
    
    try {
      const res = await fetch('/api/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramToken,
          telegramUserId,
          aiProvider,
          apiKey,
          plan,
          model: selectedModel,
          skills: selectedSkills,
          agentType
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        // Save to localStorage for dashboard
        localStorage.setItem('agentbot_instance', JSON.stringify({
          userId: data.userId,
          botUsername: botInfo?.username,
          subdomain: data.subdomain,
          url: data.url,
          streamKey: data.streamKey,
          liveStreamId: data.liveStreamId
        }))
        setResult(data)
        setStep('done')
      } else {
        setError(data.error || 'Deployment failed')
      }
    } catch (e) {
      setError('Failed to deploy')
    } finally {
      setIsDeploying(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Mode Selector */}
      {step === 'telegram' && (
        <div className="mb-8">
          <div className="grid grid-cols-3 gap-3 bg-gray-900 p-2 rounded-xl border border-gray-800">
            <button
              onClick={() => window.location.href = '/onboard?mode=link'}
              className={`py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                mode === 'link' 
                  ? 'bg-white text-black' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              Link Existing
            </button>
            <button
              onClick={() => window.location.href = '/onboard?mode=create'}
              className={`py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                mode === 'create' 
                  ? 'bg-white text-black' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              Create New
            </button>
            <button
              onClick={() => window.location.href = '/onboard?mode=deploy'}
              className={`py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                mode === 'deploy' 
                  ? 'bg-white text-black' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              One-Click Deploy
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-12">
        <div className="text-5xl mb-4">🦞</div>
        {isPaid && (
          <div className="mb-4 bg-green-500/20 border border-green-500/50 text-green-400 px-4 py-2 rounded-lg inline-block">
            ✓ Payment successful! Your {plan.charAt(0).toUpperCase() + plan.slice(1)} plan is activated.
          </div>
        )}
        <h1 className="text-3xl font-bold">
          {mode === 'link' && 'Link Existing OpenClaw'}
          {mode === 'create' && 'Create Agentbot'}
          {mode === 'deploy' && 'Deploy OpenClaw with One Click'}
        </h1>
        <p className="text-gray-400 mt-2">
          {mode === 'link' && 'Connect your existing OpenClaw instance'}
          {mode === 'create' && 'Build your custom AI agent from scratch'}
          {mode === 'deploy' && 'Launch a pre-configured OpenClaw agent instantly'}
        </p>
        <p className="text-gray-500 text-sm mt-1">
          {plan === 'free' ? 'Starter plan' : `${plan.charAt(0).toUpperCase() + plan.slice(1)} plan`}
        </p>
      </div>
      
      {/* Progress */}
      <div className="mb-12 overflow-x-auto pb-2">
        <div className="flex min-w-max items-center justify-center gap-2 px-2">
          {FLOW_STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step === s ? 'bg-white text-black' : 
                FLOW_STEPS.indexOf(step) > i ? 'bg-green-500 text-white' : 'bg-gray-3 text-gray-7'
              }`}>
                {FLOW_STEPS.indexOf(step) > i ? '✓' : i + 1}
              </div>
              {i < FLOW_STEPS.length - 1 && <div className="w-8 h-0.5 bg-gray-3" />}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 sm:p-8">
        
        {/* Step 1: Create Telegram Bot */}
        {step === 'telegram' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Step 1: Create Telegram Bot</h2>
            
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="font-semibold mb-4">Follow these steps:</h3>
                <ol className="space-y-4 text-gray-300">
                  <li className="flex gap-3">
                    <span className="bg-white text-black w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">1</span>
                    <span>Open Telegram and search for <code className="bg-gray-700 px-2 py-0.5 rounded">@BotFather</code></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="bg-white text-black w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">2</span>
                    <span>Send the command <code className="bg-gray-700 px-2 py-0.5 rounded">/newbot</code></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="bg-white text-black w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">3</span>
                    <span>Choose a name for your bot (e.g., "My AI Assistant")</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="bg-white text-black w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">4</span>
                    <span>Choose a username ending in <code className="bg-gray-700 px-2 py-0.5 rounded">_bot</code></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="bg-white text-black w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">5</span>
                    <span>Copy the <strong>API token</strong> BotFather gives you</span>
                  </li>
                </ol>
              </div>
              
              <a 
                href="https://t.me/BotFather" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block w-full bg-blue-500 text-white py-3 rounded-lg text-center font-semibold hover:bg-blue-400 transition-colors"
              >
                Open @BotFather →
              </a>
              
              <button
                onClick={() => setStep('token')}
                className="block w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                I have my token →
              </button>
            </div>
          </div>
        )}
        
        {/* Step 2: Enter Token */}
        {step === 'token' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Step 2: Enter Your Bot Token</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Telegram Bot Token
                </label>
                <input
                  type="text"
                  value={telegramToken}
                  onChange={(e) => setTelegramToken(e.target.value)}
                  placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-white"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Paste the token you received from @BotFather
                </p>
              </div>
              
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg px-4 py-3 text-red-400">
                  {error}
                </div>
              )}
              
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <button
                  onClick={() => setStep('telegram')}
                  className="w-full rounded-lg border border-gray-700 px-6 py-3 hover:bg-gray-800 transition-colors sm:w-auto"
                >
                  ← Back
                </button>
                <button
                  onClick={validateToken}
                  disabled={!telegramToken || isValidating}
                  className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed sm:flex-1"
                >
                  {isValidating ? 'Validating...' : 'Validate Token →'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Step 3: Your Telegram ID */}
        {step === 'userid' && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Step 3: Your Telegram ID</h2>
            {botInfo && (
              <p className="text-green-400 mb-6">✓ Bot validated: @{botInfo.username}</p>
            )}
            
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="font-semibold mb-4">How to get your Telegram ID:</h3>
                <ol className="space-y-4 text-gray-300">
                  <li className="flex gap-3">
                    <span className="bg-white text-black w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">1</span>
                    <span>Open Telegram and message <code className="bg-gray-700 px-2 py-0.5 rounded">@userinfobot</code></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="bg-white text-black w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">2</span>
                    <span>It will reply with your user ID (a number like <code className="bg-gray-700 px-2 py-0.5 rounded">123456789</code>)</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="bg-white text-black w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">3</span>
                    <span>Copy and paste that number below</span>
                  </li>
                </ol>
              </div>
              
              <a 
                href="https://t.me/userinfobot" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block w-full bg-blue-500 text-white py-3 rounded-lg text-center font-semibold hover:bg-blue-400 transition-colors"
              >
                Open @userinfobot →
              </a>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Your Telegram User ID
                </label>
                <input
                  type="text"
                  value={telegramUserId}
                  onChange={(e) => setTelegramUserId(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456789"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-white"
                />
                <p className="text-sm text-gray-500 mt-2">
                  This ensures only YOU can chat with your bot
                </p>
              </div>
              
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <button
                  onClick={() => setStep('token')}
                  className="w-full rounded-lg border border-gray-700 px-6 py-3 hover:bg-gray-800 transition-colors sm:w-auto"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep('agenttype')}
                  disabled={!telegramUserId}
                  className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed sm:flex-1"
                >
                  Continue →
                </button>
              </div>
            </div>
          </div>
          )}
        
        {/* Step 4: Choose Agent Type */}
        {step === 'agenttype' && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Choose Your Agent Type</h2>
            <p className="text-gray-400 mb-6">Select the type of agent that best fits your needs. Each comes pre-configured with relevant skills.</p>
            
            <div className="grid gap-4 sm:grid-cols-2">
              {AGENT_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setAgentType(type.id)}
                  className={`text-left p-4 rounded-xl border transition-all ${
                    agentType === type.id 
                      ? 'border-white bg-white/10' 
                      : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{type.icon}</div>
                    <div>
                      <div className="font-semibold">{type.name}</div>
                      <div className="text-sm text-gray-400">{type.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setStep('token')}
                className="px-6 py-3 border border-gray-700 text-gray-300 rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep('agenttype')}
                className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Continue →
              </button>
            </div>
          </div>
        )}
        
        {/* Step 4: Choose AI - BYOK */}
        {step === 'ai' && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Step 4: Bring Your Own Key (BYOK)</h2>
            <p className="text-gray-400 mb-6">Choose your AI provider and enter your own API key. You pay directly—no markup.</p>
            
            <div className="space-y-6">
              <div className="space-y-3">
                {[
                  { id: 'openrouter', name: 'OpenRouter', desc: 'Kimi K2.5, Llama, GPT, DeepSeek - Fast and reliable', recommended: true },
                  { id: 'groq', name: 'Groq', desc: 'Llama 3 — Ultra fast free tier' },
                  { id: 'gemini', name: 'Google Gemini', desc: 'Gemini 2.0 Flash — Direct from Google' },
                  { id: 'anthropic', name: 'Anthropic', desc: 'Claude — Best quality (requires API key)' },
                  { id: 'openai', name: 'OpenAI', desc: 'GPT-4 — Popular choice (requires API key)' }
                ].map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => setAiProvider(provider.id)}
                    className={`w-full text-left p-4 rounded-xl border ${
                      aiProvider === provider.id 
                        ? 'border-white bg-white/10' 
                        : 'border-gray-700 hover:border-gray-600'
                    } transition-colors`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{provider.name}</div>
                        <div className="text-sm text-gray-400">{provider.desc}</div>
                      </div>
                      {provider.recommended && (
                        <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">
                          Recommended
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              
              {/* OpenRouter instructions */}
              {aiProvider === 'openrouter' && (
                <div className="bg-gray-800 rounded-xl p-6">
                  <h3 className="font-semibold mb-4">Get your free OpenRouter API key:</h3>
                  <ol className="space-y-3 text-gray-300 text-sm">
                    <li className="flex gap-3">
                      <span className="bg-white text-black w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">1</span>
                      <span>Go to <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-white underline">openrouter.ai/keys</a></span>
                    </li>
                    <li className="flex gap-3">
                      <span className="bg-white text-black w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">2</span>
                      <span>Sign up with Google (free, no credit card)</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="bg-white text-black w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">3</span>
                      <span>Click "Create Key" and copy it</span>
                    </li>
                  </ol>
                  <p className="text-xs text-gray-500 mt-4">
                    We default to a stable OpenRouter model for reliable deployment.
                  </p>
                </div>
              )}
              
              {/* Gemini instructions */}
              {aiProvider === 'gemini' && (
                <div className="bg-gray-800 rounded-xl p-6">
                  <h3 className="font-semibold mb-4">Get your Gemini API key:</h3>
                  <ol className="space-y-3 text-gray-300 text-sm">
                    <li className="flex gap-3">
                      <span className="bg-white text-black w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">1</span>
                      <span>Go to <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-white underline">aistudio.google.com/apikey</a></span>
                    </li>
                    <li className="flex gap-3">
                      <span className="bg-white text-black w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">2</span>
                      <span>Sign in with Google and click "Create API key"</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="bg-white text-black w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">3</span>
                      <span>Copy the key and paste below</span>
                    </li>
                  </ol>
                </div>
              )}
              
              {/* API Key - optional for Groq, required for others */}
              {(aiProvider === 'openrouter' || aiProvider === 'gemini' || aiProvider === 'anthropic' || aiProvider === 'openai' || aiProvider === 'groq') && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    {aiProvider === 'groq' ? 'Groq API Key (optional - free tier available)' : 
                     aiProvider === 'openrouter' ? 'OpenRouter API Key' : 
                     aiProvider === 'gemini' ? 'Gemini API Key' :
                     aiProvider === 'anthropic' ? 'Anthropic API Key' : 'OpenAI API Key'}
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={
                      aiProvider === 'openrouter' ? 'sk-or-v1-...' :
                      aiProvider === 'gemini' ? 'AIza...' :
                      aiProvider === 'anthropic' ? 'sk-ant-...' : 
                      aiProvider === 'groq' ? 'gsk_...' : 'sk-...'
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-white"
                  />
                </div>
              )}
              
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <button
                  onClick={() => setStep('token')}
                  className="w-full rounded-lg border border-gray-700 px-6 py-3 hover:bg-gray-800 transition-colors sm:w-auto"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(aiProvider === 'openrouter' ? 'model' : 'skills')}
                  disabled={(aiProvider !== 'openrouter' && aiProvider !== 'groq') && !apiKey}
                  className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed sm:flex-1"
                >
                  {aiProvider === 'openrouter' ? 'Select Model →' : 'Continue →'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Step 5: Choose Model */}
        {step === 'model' && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Step 5: Choose Your AI Model</h2>
            {botInfo && (
              <p className="text-green-400 mb-6">✓ Bot validated: @{botInfo.username}</p>
            )}
            
            <div className="space-y-6">
              <div className="space-y-3">
                {AVAILABLE_MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={`w-full text-left p-4 rounded-xl border ${
                      selectedModel === model.id 
                        ? 'border-white bg-white/10' 
                        : 'border-gray-700 hover:border-gray-600'
                    } transition-colors`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{model.name}</div>
                        <div className="text-sm text-gray-400">{model.description}</div>
                      </div>
                      {model.recommended && (
                        <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">
                          Recommended
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <button
                  onClick={() => setStep('agenttype')}
                  className="w-full rounded-lg border border-gray-700 px-6 py-3 hover:bg-gray-800 transition-colors sm:w-auto"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep('skills')}
                  className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors sm:flex-1"
                >
                  Continue →
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Step 6: Choose Skills */}
        {step === 'skills' && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Step 6: Ready-to-Use Skills</h2>
            {botInfo && (
              <p className="text-green-400 mb-6">✓ Bot validated: @{botInfo.username}</p>
            )}
            
            <div className="mb-6">
              <p className="text-gray-400 text-sm">Select skills for your agent. You can always add more later from the dashboard.</p>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {AVAILABLE_SKILLS.map((skill) => {
                  const isSelected = selectedSkills.includes(skill.id)
                  return (
                    <button
                      key={skill.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedSkills(selectedSkills.filter(s => s !== skill.id))
                        } else {
                          setSelectedSkills([...selectedSkills, skill.id])
                        }
                      }}
                      className={`text-left p-4 rounded-xl border transition-colors ${
                        isSelected 
                          ? 'border-white bg-white/10' 
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{skill.icon}</span>
                        <div>
                          <div className="font-semibold">{skill.name}</div>
                          <div className="text-xs text-gray-400">{skill.description}</div>
                        </div>
                        {isSelected && (
                          <span className="ml-auto text-green-400">✓</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
              
              <div className="bg-gray-800 rounded-xl p-4">
                <p className="text-sm text-gray-400">
                  Selected: <span className="text-white">{selectedSkills.length}</span> skills
                </p>
              </div>
              
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <button
                  onClick={() => setStep('model')}
                  className="w-full rounded-lg border border-gray-700 px-6 py-3 hover:bg-gray-800 transition-colors sm:w-auto"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep('deploy')}
                  className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors sm:flex-1"
                >
                  Continue to Deploy →
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Step 7: Deploy */}
        {step === 'deploy' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Step 7: Deploy Your Assistant</h2>
            
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="font-semibold mb-4">Summary</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-400">Telegram Bot</dt>
                    <dd>@{botInfo?.username}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-400">AI Provider</dt>
                    <dd>{aiProvider === 'openrouter' ? 'OpenRouter (Free)' : 
                         aiProvider === 'gemini' ? 'Google Gemini' :
                         aiProvider === 'groq' ? 'Groq' : 
                         aiProvider.charAt(0).toUpperCase() + aiProvider.slice(1)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-400">AI Model</dt>
                    <dd>{AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name || selectedModel}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-400">Skills</dt>
                    <dd>{selectedSkills.length} selected</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-400">Plan</dt>
                    <dd>{plan === 'free' ? 'Sign up for plan' : plan}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-400">OpenClaw Version</dt>
                    <dd className="font-mono">{openclawVersion}</dd>
                  </div>
                </dl>
              </div>
              
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg px-4 py-3 text-red-400">
                  {error}
                </div>
              )}
              
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <button
                  onClick={() => setStep('agenttype')}
                  className="w-full rounded-lg border border-gray-700 px-6 py-3 hover:bg-gray-800 transition-colors sm:w-auto"
                >
                  ← Back
                </button>
                <button
                  onClick={deploy}
                  disabled={isDeploying}
                  className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 sm:flex-1"
                >
                  {isDeploying ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Deploying...
                    </span>
                  ) : (
                    '🚀 Deploy Now'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Step 5: Done */}
        {step === 'done' && result && (
          <div className="text-center">
            <div className="text-6xl mb-6">🎉</div>
            <h2 className="text-2xl font-bold mb-2">You're Live!</h2>
            <p className="text-gray-400 mb-8">Your AI assistant is ready to chat.</p>
            
            <div className="bg-gray-800 rounded-xl p-6 mb-8 text-left">
              <p className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
                <span className="text-lg">📡</span> Broadcast Credentials (OBS)
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Server URL</label>
                  <p className="text-sm font-mono bg-black/30 p-2 rounded border border-gray-700 break-all select-all">rtmps://global-live.mux.com:443/app</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Stream Key</label>
                  <p className="text-sm font-mono bg-black/30 p-2 rounded border border-gray-700 break-all select-all">{result.streamKey || 'Generating...'}</p>
                </div>
              </div>
              <p className="text-[10px] text-gray-500 mt-4">
                Paste these into OBS to start your station. Do not share your Stream Key.
              </p>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-6 mb-8">
              <p className="text-sm text-gray-400 mb-2">Open Telegram and message:</p>
              <p className="text-xl font-mono">@{botInfo?.username}</p>
            </div>
            
            <div className="space-y-4">
              <a
                href={`https://t.me/${botInfo?.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-blue-500 py-3 rounded-lg font-semibold hover:bg-blue-400 transition-colors"
              >
                Open in Telegram →
              </a>
              <a
                href={`/dashboard?id=${result.userId}`}
                className="block w-full bg-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
              >
                Go to Dashboard
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Onboard() {
  return (
    <main className="min-h-screen py-12 px-6">
      <Suspense fallback={
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-5xl mb-4">🦞</div>
          <p className="text-gray-400">Loading...</p>
        </div>
      }>
        <OnboardContent />
      </Suspense>
    </main>
  )
}
