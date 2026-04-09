'use client'

import { useState, Suspense, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'

type Step = 'telegram' | 'token' | 'userid' | 'agenttype' | 'ai' | 'model' | 'skills' | 'deploy' | 'done'

const FLOW_STEPS: Step[] = ['telegram', 'token', 'userid', 'agenttype', 'ai', 'model', 'skills', 'deploy', 'done']
const DEPLOY_FLOW_STEPS: Step[] = ['ai', 'deploy', 'done']
// Note: Payment is handled inline — deploy() redirects to Stripe if !isPaid

const ADMIN_EMAILS = ['eskyjunglelab@gmail.com', 'admin@agentbot.raveculture.xyz', 'rbasefm@icloud.com']

function OnboardContent() {
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan') || 'solo'
  const mode = searchParams.get('mode') || 'deploy' // deploy (default), create, link
  const [isAdmin, setIsAdmin] = useState(false)
  const isPaid = searchParams.get('paid') === '1' || isAdmin
  const paymentError = searchParams.get('payment_error')
  const paymentCancelled = searchParams.get('payment_cancelled') === '1'
  
  const [step, setStep] = useState<Step>('telegram')
  const [telegramToken, setTelegramToken] = useState('')
  const [telegramUserId, setTelegramUserId] = useState('')
  const [aiProvider, setAiProvider] = useState('openrouter')
  const [apiKey, setApiKey] = useState('')
  const [selectedModel, setSelectedModel] = useState('openrouter/xiaomi/mimo-v2-pro')
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['web-search', 'file-handler'])
  const [agentType, setAgentType] = useState('general')
  const [isValidating, setIsValidating] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{
    userId: string
    jobId?: string
    subdomain?: string
    url: string
    status?: string
    streamKey?: string
    liveStreamId?: string
  } | null>(null)
  const [botInfo, setBotInfo] = useState<{ username: string } | null>(null)
  const [openclawVersion, setOpenclawVersion] = useState('unknown')
  const [showConfetti, setShowConfetti] = useState(false)
  const [accountStats, setAccountStats] = useState<{
    agents?: { active: number; total: number; limit: number; newToday: number }
    skills?: { installed: number }
    tasks?: { total: number }
  } | null>(null)
  const [deploymentStats, setDeploymentStats] = useState<{
    deployment?: {
      provider?: string
      environment?: string
      region?: string | null
      deploymentUrl?: string | null
      commitSha?: string | null
    }
  } | null>(null)
  const [runtimeState, setRuntimeState] = useState<'idle' | 'provisioning' | 'running' | 'unreachable'>('idle')
  const [runtimeMessage, setRuntimeMessage] = useState('')

  // Team mode (for Collective/Label plans)
  const [teamMode, setTeamMode] = useState<'single' | 'team'>('single')
  const [teamTemplate, setTeamTemplate] = useState('dev_team')

  // Available models
  const AVAILABLE_MODELS = [
    { id: 'openrouter/xiaomi/mimo-v2-pro', name: 'MiMo V2 Pro (Recommended)', provider: 'openrouter', description: 'Xiaomi latest model. Fast, capable, great value.', recommended: true, tier: 'free' },
    { id: 'openrouter/mistralai/mistral-7b-instruct', name: 'Mistral 7B (Free Tier)', provider: 'openrouter', description: 'Lightweight & fast. Free for all users.', tier: 'free' },
    { id: 'openrouter/meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 (Advanced)', provider: 'openrouter', description: 'Advanced general assistant. Requires Solo plan.', tier: 'solo' },
    { id: 'openrouter/qwen/qwen-2.5-coder-32b-instruct', name: 'Qwen 2.5 (Coding)', provider: 'openrouter', description: 'Smart contracts & coding logic. Requires Collective plan.', tier: 'collective' },
    { id: 'openrouter/deepseek/deepseek-r1', name: 'DeepSeek R1 (Reasoning)', provider: 'openrouter', description: 'Maximum intelligence. Requires Label plan.', tier: 'label' },
    { id: 'openrouter/solana/solana-agent-kit', name: 'Solana Agent Kit', provider: 'openrouter', description: 'DeFi, NFTs, token ops. 60+ Solana actions via MCP. Requires Label plan.', tier: 'label' },
  ]

  // Available ready-to-use skills
  const AVAILABLE_SKILLS = [
    { id: 'web-search', name: 'Web Search', description: 'Search the web for information', icon: '🔍' },
    { id: 'file-handler', name: 'File Handler', description: 'Read, write, and process files', icon: '📁' },
    { id: 'code-interpreter', name: 'Code Runner', description: 'Execute code snippets safely', icon: '💻' },
    { id: 'image-analyzer', name: 'Image Analyzer', description: 'Analyze and describe images', icon: '🖼️' },
    { id: 'scheduler', name: 'Scheduler', description: 'Schedule tasks and reminders', icon: '⏰' },
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

  // Check admin status from session
  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(data => {
        const email = data?.user?.email?.toLowerCase() || ''
        if (ADMIN_EMAILS.includes(email)) setIsAdmin(true)
      })
      .catch(() => {})
  }, [])

  // Deploy mode: skip Telegram setup, start at AI key step
  useEffect(() => {
    if (mode === 'deploy') {
      setStep('ai')
      setAgentType('business')
    }
  }, [mode])

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

  useEffect(() => {
    const loadPlatformStats = async () => {
      try {
        const [dashboardRes, runtimeRes] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/stats'),
        ])

        if (dashboardRes.ok) {
          const dashboardData = await dashboardRes.json()
          setAccountStats(dashboardData)
        }

        if (runtimeRes.ok) {
          const runtimeData = await runtimeRes.json()
          setDeploymentStats(runtimeData)
        }
      } catch {
        // Onboarding still works without the snapshot panel.
      }
    }

    loadPlatformStats()
  }, [])

  useEffect(() => {
    if (mode !== 'deploy' || step !== 'done' || !result?.userId) {
      return
    }

    let cancelled = false

    const pollRuntime = async () => {
      setRuntimeState('provisioning')
      setRuntimeMessage('Provisioning Railway service and waiting for OpenClaw to boot...')

      for (let attempt = 0; attempt < 45 && !cancelled; attempt += 1) {
        try {
          const openclawRes = await fetch('/api/user/openclaw', { cache: 'no-store' })
          if (openclawRes.ok) {
            const openclaw = await openclawRes.json()
            const nextUserId = openclaw.openclawInstanceId || result.userId
            const nextUrl = openclaw.openclawUrl || result.url

            if (nextUrl || nextUserId) {
              localStorage.setItem('agentbot_instance', JSON.stringify({
                userId: nextUserId,
                url: nextUrl,
              }))
              setResult((current) => current ? {
                ...current,
                userId: nextUserId,
                url: nextUrl || current.url,
              } : current)
            }

            if (nextUserId) {
              const statsRes = await fetch(`/api/instance/${nextUserId}/stats`, { cache: 'no-store' })
              if (statsRes.ok) {
                const stats = await statsRes.json()
                if (stats.status === 'running') {
                  setRuntimeState('running')
                  setRuntimeMessage('Runtime is live. OpenClaw is ready to use.')
                  return
                }
              }
            }
          }
        } catch {
          // Keep polling — the runtime may still be coming up.
        }

        setRuntimeMessage(
          attempt < 10
            ? 'Railway service created. Waiting for OpenClaw to finish booting...'
            : 'OpenClaw is still starting. Mission Control will keep syncing in the background.'
        )

        await new Promise((resolve) => setTimeout(resolve, 2000))
      }

      if (!cancelled) {
        setRuntimeState('unreachable')
        setRuntimeMessage('Runtime is still booting. You can open Mission Control and check back in a moment.')
      }
    }

    pollRuntime()

    return () => {
      cancelled = true
    }
  }, [mode, result?.url, result?.userId, step])

  useEffect(() => {
    if (!result?.jobId || step !== 'done') {
      return
    }

    let cancelled = false

    const pollJob = async () => {
      for (let attempt = 0; attempt < 45 && !cancelled; attempt += 1) {
        try {
          const res = await fetch(`/api/provision/jobs/${result.jobId}`, { cache: 'no-store' })
          const data = await res.json()

          if (!res.ok) {
            throw new Error(data.error || 'Failed to read provision job')
          }

          const job = data.job
          if (job?.status === 'failed') {
            setRuntimeState('unreachable')
            setRuntimeMessage(job.error || 'Provisioning failed.')
            setError(job.error || 'Provisioning failed')
            return
          }

          if (job?.status === 'completed' && job?.result?.url) {
            const nextUrl = String(job.result.url)
            const nextAgentId = typeof job.result.agentId === 'string'
              ? job.result.agentId
              : (job.agentId || result.userId)

            localStorage.setItem('agentbot_instance', JSON.stringify({
              userId: nextAgentId,
              url: nextUrl,
            }))

            setResult((current) => current ? {
              ...current,
              jobId: undefined,
              userId: nextAgentId,
              url: nextUrl,
              status: typeof job.result.status === 'string' ? job.result.status : 'deploying',
            } : current)
            setRuntimeMessage('Provision job completed. Finalizing runtime readiness...')
            return
          }

          setRuntimeState('provisioning')
          setRuntimeMessage(`Provision job ${job?.status || 'queued'}...`)
        } catch (jobError) {
          setRuntimeMessage('Provision job queued. Waiting for backend worker...')
        }

        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
    }

    pollJob()

    return () => {
      cancelled = true
    }
  }, [result?.jobId, result?.userId, step])

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
    if (!isPaid) {
      window.location.href = `/api/stripe/checkout?plan=${plan}`
      return
    }
    setIsDeploying(true)
    setError('')

    try {
      // Get user email from session
      let userEmail = ''
      try {
        const sessionRes = await fetch('/api/auth/session')
        const sessionData = await sessionRes.json()
        userEmail = sessionData?.user?.email || ''
      } catch {}

      const isDeployMode = mode === 'deploy'
      const res = await fetch('/api/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          telegramToken: isDeployMode ? '' : telegramToken,
          telegramUserId: isDeployMode ? '' : telegramUserId,
          aiProvider,
          apiKey,
          plan,
          model: selectedModel,
          skills: selectedSkills,
          agentType: isDeployMode ? 'business' : agentType,
          autoProvision: isDeployMode,
          email: userEmail
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        // 🎉 Confetti!
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 5000)

        // Save to localStorage for dashboard
        if (data.url) {
          localStorage.setItem('agentbot_instance', JSON.stringify({
            userId: data.userId,
            botUsername: botInfo?.username,
            subdomain: data.subdomain,
            url: data.url,
            streamKey: data.streamKey,
            liveStreamId: data.liveStreamId
          }))
        }
        setRuntimeState(mode === 'deploy' ? 'provisioning' : 'idle')
        setRuntimeMessage(
          mode === 'deploy'
            ? data.jobId
              ? 'Provision job accepted. Waiting for backend worker...'
              : 'Provision request accepted. Waiting for runtime status...'
            : ''
        )
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
      <div className="mb-8">
        <div className="mb-3 text-[10px] uppercase tracking-widest text-zinc-600">Choose your path</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              id: 'deploy',
              title: 'Deploy OpenClaw',
              desc: 'Launch a managed runtime fast',
            },
            {
              id: 'create',
              title: 'Custom Agent',
              desc: 'Build your own agent from scratch',
            },
            {
              id: 'link',
              title: 'Link Existing',
              desc: 'Connect an OpenClaw instance you already run',
            },
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => window.location.href = `/onboard?mode=${option.id}&plan=${plan}`}
              className={`rounded-xl border p-4 text-left transition-colors ${
                mode === option.id
                  ? 'border-white bg-white text-black'
                  : 'border-zinc-800 bg-zinc-900 text-white hover:border-zinc-700 hover:bg-zinc-950'
              }`}
            >
              <div className={`text-[10px] uppercase tracking-widest ${mode === option.id ? 'text-black/60' : 'text-zinc-500'}`}>
                {option.id === 'deploy' ? 'Managed' : option.id === 'create' ? 'Builder' : 'Connect'}
              </div>
              <div className="mt-2 text-sm font-bold uppercase tracking-tight">{option.title}</div>
              <div className={`mt-2 text-xs leading-relaxed ${mode === option.id ? 'text-black/70' : 'text-zinc-400'}`}>
                {option.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="mb-12">
        <div className="text-5xl mb-4">🦞</div>
        {isPaid && (
          <div className="mb-4 bg-green-500/20 border border-green-500/50 text-green-400 px-4 py-2 inline-block">
            ✓ Payment successful! Your {plan.charAt(0).toUpperCase() + plan.slice(1)} plan is activated.
          </div>
        )}
        <h1 className="text-3xl font-bold tracking-tighter uppercase">
          {mode === 'link' && 'Link Existing OpenClaw'}
          {mode === 'create' && 'Create Agentbot'}
          {mode === 'deploy' && 'Deploy OpenClaw with One Click'}
        </h1>
        <p className="text-sm text-zinc-400 mt-2">
          {mode === 'link' && 'Connect your existing OpenClaw instance'}
          {mode === 'create' && 'Build your custom AI agent from scratch'}
          {mode === 'deploy' && 'Launch a pre-configured OpenClaw agent instantly'}
        </p>
        <p className="text-xs text-zinc-500 mt-1">
          {plan === 'free' ? 'Starter plan' : `${plan.charAt(0).toUpperCase() + plan.slice(1)} plan`}
        </p>
      </div>
      
      {/* Progress */}
      <div className="mb-12 overflow-x-auto pb-2">
        <div className="flex min-w-max items-center gap-2 px-2">
          {(mode === 'deploy' ? DEPLOY_FLOW_STEPS : FLOW_STEPS).map((s, i) => {
            const activeSteps = mode === 'deploy' ? DEPLOY_FLOW_STEPS : FLOW_STEPS
            const currentIdx = activeSteps.indexOf(step)
            return (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step === s ? 'bg-white text-black' :
                currentIdx > i ? 'bg-green-500 text-white' : 'bg-zinc-800 text-zinc-500'
              }`}>
                {currentIdx > i ? '✓' : i + 1}
              </div>
              {i < activeSteps.length - 1 && <div className="w-8 h-0.5 bg-zinc-800" />}
            </div>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-zinc-900 border border-zinc-800 p-5 sm:p-8">
        
        {/* Step 1: Create Telegram Bot */}
        {step === 'telegram' && (
          <div>
            <h2 className="text-2xl font-bold tracking-tighter uppercase mb-6">Step 1: Create Telegram Bot</h2>
            
            <div className="space-y-6">
              <div className="bg-zinc-800 rounded-xl p-6">
                <h3 className="font-semibold mb-4">Follow these steps:</h3>
                <ol className="space-y-4 text-zinc-300">
                  <li className="flex gap-3">
                    <span className="bg-white text-black w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">1</span>
                    <span>Open Telegram and search for <code className="bg-zinc-700 px-2 py-0.5 rounded">@BotFather</code></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="bg-white text-black w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">2</span>
                    <span>Send the command <code className="bg-zinc-700 px-2 py-0.5 rounded">/newbot</code></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="bg-white text-black w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">3</span>
                    <span>Choose a name for your bot (e.g., &quot;My AI Assistant&quot;)</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="bg-white text-black w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">4</span>
                    <span>Choose a username ending in <code className="bg-zinc-700 px-2 py-0.5 rounded">_bot</code></span>
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
                className="block w-full bg-blue-500 text-white py-3 rounded-lg text-left font-semibold hover:bg-blue-400 transition-colors"
              >
                Open @BotFather →
              </a>
              
              <button
                onClick={() => setStep('token')}
                className="block w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-zinc-200 transition-colors"
              >
                I have my token →
              </button>
            </div>
          </div>
        )}
        
        {/* Step 2: Enter Token */}
        {step === 'token' && (
          <div>
            <h2 className="text-2xl font-bold tracking-tighter uppercase mb-6">Step 2: Enter Your Bot Token</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-600 mb-2">
                  Telegram Bot Token
                </label>
                <input
                  type="text"
                  value={telegramToken}
                  onChange={(e) => setTelegramToken(e.target.value)}
                  placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono"
                />
                <p className="text-sm text-zinc-500 mt-2">
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
                  className="w-full rounded-lg border border-zinc-700 px-6 py-3 hover:bg-zinc-800 transition-colors sm:w-auto"
                >
                  ← Back
                </button>
                <button
                  onClick={validateToken}
                  disabled={!telegramToken || isValidating}
                  className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed sm:flex-1"
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
            <h2 className="text-2xl font-bold tracking-tighter uppercase mb-2">Step 3: Your Telegram ID</h2>
            {botInfo && (
              <p className="text-green-400 mb-6">✓ Bot validated: @{botInfo.username}</p>
            )}
            
            <div className="space-y-6">
              <div className="bg-zinc-800 rounded-xl p-6">
                <h3 className="font-semibold mb-4">How to get your Telegram ID:</h3>
                <ol className="space-y-4 text-zinc-300">
                  <li className="flex gap-3">
                    <span className="bg-white text-black w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">1</span>
                    <span>Open Telegram and message <code className="bg-zinc-700 px-2 py-0.5 rounded">@userinfobot</code></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="bg-white text-black w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">2</span>
                    <span>It will reply with your user ID (a number like <code className="bg-zinc-700 px-2 py-0.5 rounded">123456789</code>)</span>
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
                className="block w-full bg-blue-500 text-white py-3 rounded-lg text-left font-semibold hover:bg-blue-400 transition-colors"
              >
                Open @userinfobot →
              </a>
              
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-600 mb-2">
                  Your Telegram User ID
                </label>
                <input
                  type="text"
                  value={telegramUserId}
                  onChange={(e) => setTelegramUserId(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456789"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono"
                />
                <p className="text-sm text-zinc-500 mt-2">
                  This ensures only YOU can chat with your bot
                </p>
              </div>
              
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <button
                  onClick={() => setStep('token')}
                  className="w-full rounded-lg border border-zinc-700 px-6 py-3 hover:bg-zinc-800 transition-colors sm:w-auto"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep('agenttype')}
                  disabled={!telegramUserId}
                  className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed sm:flex-1"
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
            <h2 className="text-2xl font-bold tracking-tighter uppercase mb-2">Choose Your Agent Type</h2>
            <p className="text-zinc-400 mb-6">Select the type of agent that best fits your needs. Each comes pre-configured with relevant skills.</p>
            
            <div className="grid gap-4 sm:grid-cols-2">
              {AGENT_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setAgentType(type.id)}
                  className={`text-left p-4 rounded-xl border transition-all ${
                    agentType === type.id
                      ? 'border-white bg-zinc-800'
                      : 'border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{type.icon}</div>
                    <div>
                      <div className="font-semibold">{type.name}</div>
                      <div className="text-sm text-zinc-400">{type.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setStep('userid')}
                className="px-6 py-3 border border-zinc-700 text-zinc-300 rounded-lg font-medium hover:bg-zinc-800 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep('ai')}
                className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-zinc-200 transition-colors"
              >
                Continue →
              </button>
            </div>
          </div>
        )}
        
        {/* Step 4: Choose AI - BYOK */}
        {step === 'ai' && (
          <div>
            <h2 className="text-2xl font-bold tracking-tighter uppercase mb-2">Step 4: Bring Your Own Key (BYOK)</h2>
            <p className="text-zinc-400 mb-6">Choose your AI provider and enter your own API key. You pay directly—no markup.</p>
            
            <div className="space-y-6">
              <div className="space-y-3">
                {[
                  { id: 'openrouter', name: 'OpenRouter', desc: 'MiMo V2 Pro, Kimi K2.5, Llama, GPT, DeepSeek — Fast and reliable', recommended: true },
                  { id: 'ollama', name: 'Ollama (Local)', desc: 'Run models locally on your own hardware — private & free', badge: 'PRIVATE' },
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
                        ? 'border-white bg-zinc-800'
                        : 'border-zinc-700 hover:border-zinc-600'
                    } transition-colors`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{provider.name}</div>
                        <div className="text-sm text-zinc-400">{provider.desc}</div>
                      </div>
                      {provider.recommended && (
                        <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">
                          Recommended
                        </span>
                      )}
                      {'badge' in provider && provider.badge && (
                        <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-full">
                          {provider.badge}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              
              {/* OpenRouter instructions */}
              {aiProvider === 'openrouter' && (
                <div className="bg-zinc-800 rounded-xl p-6">
                  <h3 className="font-semibold mb-4">Get your free OpenRouter API key:</h3>
                  <ol className="space-y-3 text-zinc-300 text-sm">
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
                      <span>Click &quot;Create Key&quot; and copy it</span>
                    </li>
                  </ol>
                  <p className="text-xs text-zinc-500 mt-4">
                    We default to a stable OpenRouter model for reliable deployment.
                  </p>
                </div>
              )}
              
              {/* Ollama instructions */}
              {aiProvider === 'ollama' && (
                <div className="bg-zinc-800 rounded-xl p-6">
                  <h3 className="font-semibold mb-2">Ollama — run models locally</h3>
                  <p className="text-sm text-zinc-400 mb-4">Your OpenClaw agent will use the Ollama instance running inside its Railway container. No API key needed.</p>
                  <ol className="space-y-3 text-zinc-300 text-sm">
                    <li className="flex gap-3">
                      <span className="bg-white text-black w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">1</span>
                      <span>OpenClaw will connect to Ollama at <code className="text-blue-300">http://ollama.railway.internal:11434</code> automatically</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="bg-white text-black w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">2</span>
                      <span>The Ollama service in your project will serve the model — no key required</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="bg-white text-black w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">3</span>
                      <span>Recommended model: <strong>llama3.2</strong> or <strong>mistral</strong></span>
                    </li>
                  </ol>
                </div>
              )}

              {/* Gemini instructions */}
              {aiProvider === 'gemini' && (
                <div className="bg-zinc-800 rounded-xl p-6">
                  <h3 className="font-semibold mb-4">Get your Gemini API key:</h3>
                  <ol className="space-y-3 text-zinc-300 text-sm">
                    <li className="flex gap-3">
                      <span className="bg-white text-black w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">1</span>
                      <span>Go to <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-white underline">aistudio.google.com/apikey</a></span>
                    </li>
                    <li className="flex gap-3">
                      <span className="bg-white text-black w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">2</span>
                      <span>Sign in with Google and click &quot;Create API key&quot;</span>
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
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-600 mb-2">
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
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono"
                  />
                </div>
              )}
              
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                {mode !== 'deploy' && (
                  <button
                    onClick={() => setStep('token')}
                    className="w-full rounded-lg border border-zinc-700 px-6 py-3 hover:bg-zinc-800 transition-colors sm:w-auto"
                  >
                    ← Back
                  </button>
                )}
                <button
                  onClick={() => mode === 'deploy' ? setStep('deploy') : setStep(aiProvider === 'openrouter' ? 'model' : 'skills')}
                  disabled={(aiProvider !== 'openrouter' && aiProvider !== 'groq' && aiProvider !== 'ollama') && !apiKey}
                  className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed sm:flex-1"
                >
                  {mode === 'deploy' ? 'Deploy OpenClaw →' : aiProvider === 'openrouter' ? 'Select Model →' : 'Continue →'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Step 5: Choose Model */}
        {step === 'model' && (
          <div>
            <h2 className="text-2xl font-bold tracking-tighter uppercase mb-2">Step 5: Choose Your AI Model</h2>
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
                        ? 'border-white bg-zinc-800'
                        : 'border-zinc-700 hover:border-zinc-600'
                    } transition-colors`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{model.name}</div>
                        <div className="text-sm text-zinc-400">{model.description}</div>
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
                  className="w-full rounded-lg border border-zinc-700 px-6 py-3 hover:bg-zinc-800 transition-colors sm:w-auto"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep('skills')}
                  className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-zinc-200 transition-colors sm:flex-1"
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
            <h2 className="text-2xl font-bold tracking-tighter uppercase mb-2">Step 6: Ready-to-Use Skills</h2>
            {botInfo && (
              <p className="text-green-400 mb-6">✓ Bot validated: @{botInfo.username}</p>
            )}
            
            <div className="mb-6">
              <p className="text-zinc-400 text-sm">Select skills for your agent. You can always add more later from the dashboard.</p>
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
                          ? 'border-white bg-zinc-800'
                          : 'border-zinc-700 hover:border-zinc-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{skill.icon}</span>
                        <div>
                          <div className="font-semibold">{skill.name}</div>
                          <div className="text-xs text-zinc-400">{skill.description}</div>
                        </div>
                        {isSelected && (
                          <span className="ml-auto text-green-400">✓</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
              
              <div className="bg-zinc-800 rounded-xl p-4">
                <p className="text-sm text-zinc-400">
                  Selected: <span className="text-white">{selectedSkills.length}</span> skills
                </p>
              </div>
              
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <button
                  onClick={() => setStep('model')}
                  className="w-full rounded-lg border border-zinc-700 px-6 py-3 hover:bg-zinc-800 transition-colors sm:w-auto"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep('deploy')}
                  className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-zinc-200 transition-colors sm:flex-1"
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
            <h2 className="text-2xl font-bold tracking-tighter uppercase mb-6">{mode === 'deploy' ? 'Deploy OpenClaw' : 'Step 7: Deploy Your Assistant'}</h2>
            
            <div className="space-y-6">
              <div className="bg-zinc-800 rounded-xl p-6">
                <h3 className="font-semibold mb-4">Summary</h3>
                <dl className="space-y-2 text-sm">
                  {mode !== 'deploy' && (
                  <div className="flex justify-between">
                    <dt className="text-zinc-400">Telegram Bot</dt>
                    <dd>@{botInfo?.username}</dd>
                  </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-zinc-400">AI Provider</dt>
                    <dd>{aiProvider === 'openrouter' ? 'OpenRouter (Free)' : 
                         aiProvider === 'gemini' ? 'Google Gemini' :
                         aiProvider === 'groq' ? 'Groq' : 
                         aiProvider.charAt(0).toUpperCase() + aiProvider.slice(1)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-zinc-400">AI Model</dt>
                    <dd>{AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name || selectedModel}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-zinc-400">Skills</dt>
                    <dd>{selectedSkills.length} selected</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-zinc-400">Plan</dt>
                    <dd>{plan === 'free' ? 'Sign up for plan' : plan}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-zinc-400">Payment</dt>
                    <dd className={isPaid ? 'text-green-400' : 'text-yellow-400'}>
                      {isPaid ? '✓ Confirmed' : '⚠ Required before deploy'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-zinc-400">OpenClaw Version</dt>
                    <dd className="font-mono">{openclawVersion}</dd>
                  </div>
                </dl>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="bg-zinc-800 rounded-xl p-6">
                  <h3 className="font-semibold mb-4">Your Account Snapshot</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-zinc-400">Active Agents</dt>
                      <dd>
                        {accountStats?.agents
                          ? `${accountStats.agents.active}/${accountStats.agents.limit}`
                          : '—'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-zinc-400">Total Agents</dt>
                      <dd>{accountStats?.agents?.total ?? '—'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-zinc-400">Installed Skills</dt>
                      <dd>{accountStats?.skills?.installed ?? '—'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-zinc-400">Scheduled Tasks</dt>
                      <dd>{accountStats?.tasks?.total ?? '—'}</dd>
                    </div>
                  </dl>
                </div>

                <div className="bg-zinc-800 rounded-xl p-6">
                  <h3 className="font-semibold mb-4">Vercel Runtime</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-zinc-400">Provider</dt>
                      <dd className="uppercase">{deploymentStats?.deployment?.provider ?? '—'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-zinc-400">Environment</dt>
                      <dd className="uppercase">{deploymentStats?.deployment?.environment ?? '—'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-zinc-400">Region</dt>
                      <dd>{deploymentStats?.deployment?.region ?? 'auto'}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-zinc-400">Deployment</dt>
                      <dd className="truncate font-mono text-xs">
                        {deploymentStats?.deployment?.commitSha
                          ? deploymentStats.deployment.commitSha.slice(0, 7)
                          : 'latest'}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
              
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg px-4 py-3 text-red-400">
                  {error}
                </div>
              )}
              
              {/* Team mode selector for Collective/Label */}
              {(plan === 'collective' || plan === 'label') && (
                <div className="border border-zinc-800 rounded-lg p-4">
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-600 mb-3">
                    Deployment Mode
                  </label>
                  <div className="flex gap-3 mb-4">
                    <button
                      onClick={() => setTeamMode('single')}
                      className={`flex-1 py-3 text-xs uppercase tracking-widest font-bold border transition-colors ${
                        teamMode === 'single'
                          ? 'border-white text-white bg-white/10'
                          : 'border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600'
                      }`}
                    >
                      Single Agent
                    </button>
                    <button
                      onClick={() => setTeamMode('team')}
                      className={`flex-1 py-3 text-xs uppercase tracking-widest font-bold border transition-colors ${
                        teamMode === 'team'
                          ? 'border-white text-white bg-white/10'
                          : 'border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600'
                      }`}
                    >
                      ⬢ Team Mode
                    </button>
                  </div>
                  {teamMode === 'team' && (
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-zinc-600 mb-2">
                        Team Template
                      </label>
                      <select
                        value={teamTemplate}
                        onChange={e => setTeamTemplate(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-zinc-600"
                      >
                        <optgroup label="Developer">
                          <option value="dev_team">Dev Team (PM + Engineer + QA)</option>
                          <option value="devops_team">DevOps Team (SRE + Infra + Security)</option>
                          <option value="api_team">API Team (Architect + Backend + Docs)</option>
                        </optgroup>
                        <optgroup label="Creator">
                          <option value="content_team">Content Team (Manager + Writer + Editor)</option>
                          <option value="social_media_team">Social Media Team (Strategy + Content + Engagement)</option>
                          <option value="research_team">Research Team (Lead + Analyst + Writer)</option>
                        </optgroup>
                        <optgroup label="Business">
                          <option value="legal_team">Legal Team (Advisor + Drafter + Compliance)</option>
                          <option value="finance_team">Finance Team (Analyst + Accountant + Budget)</option>
                          <option value="marketing_team">Marketing Team (Strategist + Copywriter + Growth)</option>
                          <option value="sales_team">Sales Team (Manager + Qualifier + AE)</option>
                        </optgroup>
                        <optgroup label="Personal">
                          <option value="personal_assistant">Personal Assistant (Scheduler + Researcher + Writer)</option>
                          <option value="solopreneur">Solopreneur (Ops + Marketer + Support)</option>
                        </optgroup>
                      </select>
                      <p className="text-xs text-zinc-600 mt-2">
                        Each agent runs independently with shared memory. You can customize after deployment.
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <button
                  onClick={() => setStep(mode === 'deploy' ? 'ai' : 'agenttype')}
                  className="w-full rounded-lg border border-zinc-700 px-6 py-3 hover:bg-zinc-800 transition-colors sm:w-auto"
                >
                  ← Back
                </button>
                {!isPaid ? (
                  <a
                    href={`/api/stripe/checkout?plan=${plan}`}
                    className="w-full block text-left bg-white text-black py-3 rounded-lg font-semibold hover:bg-zinc-200 transition-colors sm:flex-1"
                  >
                    💳 Pay to Deploy
                  </a>
                ) : (
                  <button
                    onClick={deploy}
                    disabled={isDeploying}
                    className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50 sm:flex-1"
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
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Confetti */}
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 confetti-particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-10px`,
                  backgroundColor: ['#ff0', '#f0f', '#0ff', '#0f0', '#f00', '#00f', '#ff6b35'][Math.floor(Math.random() * 7)],
                  borderRadius: Math.random() > 0.5 ? '50%' : '0',
                  animation: `confettiFall ${2 + Math.random() * 3}s ease-in-out forwards`,
                  animationDelay: `${Math.random() * 0.5}s`,
                }}
              />
            ))}
          </div>
        )}
        
        {/* Done */}
        {step === 'done' && result && (
          <div>
            <div className="text-6xl mb-6">🎉</div>
            <h2 className="text-2xl font-bold tracking-tighter uppercase mb-2">You&apos;re Live!</h2>
            <p className="text-sm text-zinc-400 mb-8">
              {mode === 'deploy'
                ? runtimeState === 'running'
                  ? 'Your OpenClaw business agent is running.'
                  : 'Your managed runtime is provisioning on Railway.'
                : 'Your AI assistant is ready to chat.'}
            </p>

            {mode === 'deploy' ? (
              <>
                <div className="bg-zinc-800 rounded-xl p-6 mb-8 text-left">
                  <p className="text-sm font-semibold text-zinc-400 mb-4 flex items-center gap-2">
                    <span className="text-lg">🦞</span> OpenClaw Dashboard
                  </p>
                  <div className="mb-4 flex items-center justify-between gap-4 border border-zinc-700 bg-black/20 px-3 py-2">
                    <span className="text-[10px] uppercase tracking-widest text-zinc-500">Runtime Status</span>
                    <span className={`text-[10px] uppercase tracking-widest ${
                      runtimeState === 'running'
                        ? 'text-green-400'
                        : runtimeState === 'provisioning'
                          ? 'text-yellow-400'
                          : 'text-zinc-400'
                    }`}>
                      {runtimeState}
                    </span>
                  </div>
                  {runtimeMessage && (
                    <p className="mb-4 text-xs text-zinc-400">{runtimeMessage}</p>
                  )}
                  <div>
                    <label className="block text-xs text-zinc-500 uppercase font-bold mb-1">Your Instance URL</label>
                    <p className="text-sm font-mono bg-black/30 p-2 rounded border border-zinc-700 break-all select-all">
                      {result.url}
                    </p>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-4">
                    Bookmark this URL — it&apos;s your OpenClaw control panel.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 mb-8 text-left">
                  <div className="bg-zinc-800 rounded-xl p-6">
                    <p className="text-sm font-semibold text-zinc-400 mb-4">Account Capacity</p>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-zinc-400">Agents Running</dt>
                        <dd>
                          {accountStats?.agents
                            ? `${accountStats.agents.active}/${accountStats.agents.limit}`
                            : '—'}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-zinc-400">Skills Installed</dt>
                        <dd>{accountStats?.skills?.installed ?? '—'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-zinc-400">Tasks Scheduled</dt>
                        <dd>{accountStats?.tasks?.total ?? '—'}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="bg-zinc-800 rounded-xl p-6">
                    <p className="text-sm font-semibold text-zinc-400 mb-4">Vercel Runtime</p>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-zinc-400">Environment</dt>
                        <dd className="uppercase">{deploymentStats?.deployment?.environment ?? '—'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-zinc-400">Region</dt>
                        <dd>{deploymentStats?.deployment?.region ?? 'auto'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-zinc-400">Build</dt>
                        <dd className="font-mono text-xs">
                          {deploymentStats?.deployment?.commitSha
                            ? deploymentStats.deployment.commitSha.slice(0, 7)
                            : 'latest'}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div className="space-y-4">
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-zinc-200 transition-colors text-center"
                  >
                    {runtimeState === 'running' ? 'Open OpenClaw Dashboard →' : 'Open Runtime URL →'}
                  </a>
                  <a
                    href="/dashboard"
                    className="block w-full bg-zinc-800 py-3 rounded-lg font-semibold hover:bg-zinc-700 transition-colors text-center"
                  >
                    Go to Mission Control
                  </a>
                </div>
              </>
            ) : (
              <>
                <div className="bg-zinc-800 rounded-xl p-6 mb-8 text-left">
                  <p className="text-sm font-semibold text-zinc-400 mb-4 flex items-center gap-2">
                    <span className="text-lg">📡</span> Broadcast Credentials (OBS)
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-zinc-500 uppercase font-bold mb-1">Server URL</label>
                      <p className="text-sm font-mono bg-black/30 p-2 rounded border border-zinc-700 break-all select-all">rtmps://global-live.mux.com:443/app</p>
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 uppercase font-bold mb-1">Stream Key</label>
                      <p className="text-sm font-mono bg-black/30 p-2 rounded border border-zinc-700 break-all select-all">{result.streamKey || 'Generating...'}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-4">
                    Paste these into OBS to start your station. Do not share your Stream Key.
                  </p>
                </div>

                <div className="bg-zinc-800 rounded-xl p-6 mb-8">
                  <p className="text-sm text-zinc-400 mb-2">Open Telegram and message:</p>
                  <p className="text-xl font-mono">@{botInfo?.username}</p>
                </div>

                <div className="space-y-4">
                  <a
                    href={`https://t.me/${botInfo?.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-blue-500 py-3 rounded-lg font-semibold hover:bg-blue-400 transition-colors text-center"
                  >
                    Open in Telegram →
                  </a>
                  <a
                    href={`/dashboard?id=${result.userId}`}
                    className="block w-full bg-zinc-800 py-3 rounded-lg font-semibold hover:bg-zinc-700 transition-colors text-center"
                  >
                    Go to Dashboard
                  </a>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Confetti animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    @keyframes confettiFall {
      0% { transform: translateY(0) rotate(0deg); opacity: 1; }
      100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
    }
  `
  if (!document.getElementById('confetti-styles')) {
    style.id = 'confetti-styles'
    document.head.appendChild(style)
  }
}

export default function Onboard() {
  return (
    <main className="min-h-screen py-16 px-6 bg-black text-white selection:bg-blue-500/30 font-mono">
      <Suspense fallback={
        <div className="mx-auto max-w-2xl">
          <div className="text-5xl mb-4">🦞</div>
          <p className="text-sm text-zinc-400">Loading...</p>
        </div>
      }>
        <OnboardContent />
      </Suspense>
    </main>
  )
}
