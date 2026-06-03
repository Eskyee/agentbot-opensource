'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import type { Step, DeployResult, BotInfo, AccountStats, DeploymentStats } from './types'
import { FLOW_STEPS, DEPLOY_FLOW_STEPS, ADMIN_EMAILS, AVAILABLE_MODELS, AVAILABLE_SKILLS, AGENT_TYPES } from './types'

interface OnboardState {
  // URL params
  plan: string
  mode: string
  isPaid: boolean
  paymentError: string | null
  paymentCancelled: boolean

  // Step navigation
  step: Step
  setStep: (s: Step) => void
  activeSteps: Step[]
  currentIdx: number

  // Form state
  telegramToken: string
  setTelegramToken: (v: string) => void
  telegramUserId: string
  setTelegramUserId: (v: string) => void
  aiProvider: string
  setAiProvider: (v: string) => void
  apiKey: string
  setApiKey: (v: string) => void
  selectedModel: string
  setSelectedModel: (v: string) => void
  selectedSkills: string[]
  setSelectedSkills: (v: string[]) => void
  agentType: string
  setAgentType: (v: string) => void

  // UI state
  isValidating: boolean
  isDeploying: boolean
  error: string
  setError: (v: string) => void
  showConfetti: boolean

  // Data
  result: DeployResult | null
  botInfo: BotInfo | null
  openclawVersion: string
  accountStats: AccountStats | null
  deploymentStats: DeploymentStats | null
  runtimeState: 'idle' | 'provisioning' | 'running' | 'unreachable'
  runtimeMessage: string

  // Team mode
  teamMode: 'single' | 'team'
  setTeamMode: (v: 'single' | 'team') => void
  teamTemplate: string
  setTeamTemplate: (v: string) => void

  // Actions
  validateToken: () => Promise<void>
  deploy: () => Promise<void>

  // Constants
  isAdmin: boolean
}

const OnboardContext = createContext<OnboardState | null>(null)

export function useOnboard() {
  const ctx = useContext(OnboardContext)
  if (!ctx) throw new Error('useOnboard must be used within OnboardProvider')
  return ctx
}

export function OnboardProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan') || 'solo'
  const mode = searchParams.get('mode') || 'deploy'
  const isPaidParam = searchParams.get('paid') === '1'
  const paymentError = searchParams.get('payment_error')
  const paymentCancelled = searchParams.get('payment_cancelled') === '1'

  const [isAdmin, setIsAdmin] = useState(false)
  const isPaid = isPaidParam || isAdmin || plan === 'free'

  const [step, setStep] = useState<Step>(mode === 'deploy' ? 'ai' : 'telegram')
  const [telegramToken, setTelegramToken] = useState('')
  const [telegramUserId, setTelegramUserId] = useState('')
  const [aiProvider, setAiProvider] = useState('xiaomi-direct')
  const [apiKey, setApiKey] = useState('')
  const [selectedModel, setSelectedModel] = useState('xiaomi/mimo-v2.5-pro')
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['web-search', 'file-handler'])
  const [agentType, setAgentType] = useState(mode === 'deploy' ? 'business' : 'general')
  const [isValidating, setIsValidating] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const [error, setError] = useState(paymentError ? `Payment error: ${paymentError}` : paymentCancelled ? 'Payment was cancelled. You can try again when ready.' : '')
  const [result, setResult] = useState<DeployResult | null>(null)
  const [botInfo, setBotInfo] = useState<BotInfo | null>(null)
  const [openclawVersion, setOpenclawVersion] = useState('unknown')
  const [showConfetti, setShowConfetti] = useState(false)
  const [accountStats, setAccountStats] = useState<AccountStats | null>(null)
  const [deploymentStats, setDeploymentStats] = useState<DeploymentStats | null>(null)
  const [runtimeState, setRuntimeState] = useState<'idle' | 'provisioning' | 'running' | 'unreachable'>('idle')
  const [runtimeMessage, setRuntimeMessage] = useState('')
  const [teamMode, setTeamMode] = useState<'single' | 'team'>('single')
  const [teamTemplate, setTeamTemplate] = useState('dev_team')

  const activeSteps = mode === 'deploy' ? DEPLOY_FLOW_STEPS : FLOW_STEPS
  const currentIdx = activeSteps.indexOf(step)

  // Check admin status
  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(data => {
        const email = data?.user?.email?.toLowerCase() || ''
        if (ADMIN_EMAILS.includes(email)) setIsAdmin(true)
      })
      .catch(() => {})
  }, [])

  // Load OpenClaw version
  useEffect(() => {
    fetch('/api/openclaw-version')
      .then(r => r.json())
      .then(data => { if (data?.openclawVersion) setOpenclawVersion(data.openclawVersion) })
      .catch(() => {})
  }, [])

  // Load platform stats
  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/stats').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/stats').then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([dashboard, runtime]) => {
      if (dashboard) setAccountStats(dashboard)
      if (runtime) setDeploymentStats(runtime)
    })
  }, [])

  // Poll runtime status when on done step (deploy mode)
  useEffect(() => {
    if (mode !== 'deploy' || step !== 'done' || !result?.userId) return
    let cancelled = false

    const poll = async () => {
      setRuntimeState('provisioning')
      setRuntimeMessage('Provisioning Railway service and waiting for OpenClaw to boot...')

      for (let attempt = 0; attempt < 45 && !cancelled; attempt++) {
        try {
          const res = await fetch('/api/user/openclaw', { cache: 'no-store' })
          if (res.ok) {
            const data = await res.json()
            const nextUserId = data.openclawInstanceId || result.userId
            const nextUrl = data.openclawUrl || result.url

            if (nextUrl || nextUserId) {
              localStorage.setItem('agentbot_instance', JSON.stringify({ userId: nextUserId, url: nextUrl }))
              setResult(curr => curr ? { ...curr, userId: nextUserId, url: nextUrl || curr.url } : curr)
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
        } catch { /* keep polling */ }

        setRuntimeMessage(attempt < 10
          ? 'Railway service created. Waiting for OpenClaw to finish booting...'
          : 'OpenClaw is still starting. Mission Control will keep syncing in the background.')
        await new Promise(r => setTimeout(r, 2000))
      }

      if (!cancelled) {
        setRuntimeState('unreachable')
        setRuntimeMessage('Runtime is still booting. You can open Mission Control and check back in a moment.')
      }
    }

    poll()
    return () => { cancelled = true }
  }, [mode, result?.url, result?.userId, step])

  // Poll provision job
  useEffect(() => {
    if (!result?.jobId || step !== 'done') return
    let cancelled = false

    const poll = async () => {
      for (let attempt = 0; attempt < 45 && !cancelled; attempt++) {
        try {
          const res = await fetch(`/api/provision/jobs/${result.jobId}`, { cache: 'no-store' })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Failed to read provision job')

          const job = data.job
          if (job?.status === 'failed') {
            setRuntimeState('unreachable')
            setRuntimeMessage(job.error || 'Provisioning failed.')
            setError(job.error || 'Provisioning failed')
            return
          }

          if (job?.status === 'completed' && job?.result?.url) {
            const nextUrl = String(job.result.url)
            const nextAgentId = typeof job.result.agentId === 'string' ? job.result.agentId : (job.agentId || result.userId)
            localStorage.setItem('agentbot_instance', JSON.stringify({ userId: nextAgentId, url: nextUrl }))
            setResult(curr => curr ? { ...curr, jobId: undefined, userId: nextAgentId, url: nextUrl, status: typeof job.result.status === 'string' ? job.result.status : 'deploying' } : curr)
            setRuntimeMessage('Provision job completed. Finalizing runtime readiness...')
            return
          }

          setRuntimeState('provisioning')
          setRuntimeMessage(`Provision job ${job?.status || 'queued'}...`)
        } catch {
          setRuntimeMessage('Provision job queued. Waiting for backend worker...')
        }
        await new Promise(r => setTimeout(r, 2000))
      }
    }

    poll()
    return () => { cancelled = true }
  }, [result?.jobId, result?.userId, step])

  // Validate Telegram token
  const validateToken = useCallback(async () => {
    setIsValidating(true)
    setError('')
    try {
      const res = await fetch('/api/validate-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: telegramToken }),
      })
      const data = await res.json()
      if (data.valid) {
        setBotInfo(data.bot)
        setStep('ai')
      } else {
        setError(data.error || 'Invalid token')
      }
    } catch {
      setError('Failed to validate token')
    } finally {
      setIsValidating(false)
    }
  }, [telegramToken])

  // Deploy
  const deploy = useCallback(async () => {
    if (!isPaid) {
      window.location.href = `/api/stripe/checkout?plan=${plan}`
      return
    }
    setIsDeploying(true)
    setError('')

    try {
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
          email: userEmail,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 5000)

        if (data.url) {
          localStorage.setItem('agentbot_instance', JSON.stringify({
            userId: data.userId,
            botUsername: botInfo?.username,
            subdomain: data.subdomain,
            url: data.url,
            streamKey: data.streamKey,
            liveStreamId: data.liveStreamId,
          }))
        }
        setRuntimeState(mode === 'deploy' ? 'provisioning' : 'idle')
        setRuntimeMessage(mode === 'deploy'
          ? data.jobId ? 'Provision job accepted. Waiting for backend worker...' : 'Provision request accepted. Waiting for runtime status...'
          : '')
        setResult(data)
        setStep('done')
      } else {
        setError(data.error || 'Deployment failed')
      }
    } catch {
      setError('Failed to deploy')
    } finally {
      setIsDeploying(false)
    }
  }, [isPaid, plan, mode, telegramToken, telegramUserId, aiProvider, apiKey, selectedModel, selectedSkills, agentType, botInfo?.username])

  const value: OnboardState = {
    plan, mode, isPaid, paymentError, paymentCancelled,
    step, setStep, activeSteps, currentIdx,
    telegramToken, setTelegramToken, telegramUserId, setTelegramUserId,
    aiProvider, setAiProvider, apiKey, setApiKey,
    selectedModel, setSelectedModel, selectedSkills, setSelectedSkills,
    agentType, setAgentType,
    isValidating, isDeploying, error, setError, showConfetti,
    result, botInfo, openclawVersion, accountStats, deploymentStats,
    runtimeState, runtimeMessage,
    teamMode, setTeamMode, teamTemplate, setTeamTemplate,
    validateToken, deploy, isAdmin,
  }

  return <OnboardContext.Provider value={value}>{children}</OnboardContext.Provider>
}
