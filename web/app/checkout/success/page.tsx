'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [subscription, setSubscription] = useState<{ plan?: string; nextBilling?: string } | null>(null)

  type ProvisionStatus = 'idle' | 'submitting' | 'queued' | 'running' | 'done' | 'failed'
  const [provisionStatus, setProvisionStatus] = useState<ProvisionStatus>('idle')
  const [provisionJobId, setProvisionJobId] = useState<string | null>(null)
  const [provisionAttempts, setProvisionAttempts] = useState(0)
  const [provisionError, setProvisionError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) {
      setStatus('error')
      return
    }

    const verifySession = async () => {
      try {
        const response = await fetch(`/api/checkout/verify?session_id=${sessionId}`)
        if (!response.ok) throw new Error('Verification failed')

        const data = await response.json()
        setSubscription(data)
        setStatus('success')

        // Auto-provision OpenClaw after successful payment
        autoProvisionOpenClaw(data.plan)
      } catch (error) {
        console.error('Verification error:', error)
        setStatus('error')
      }
    }

    verifySession()
  }, [sessionId])

  useEffect(() => {
    if (!provisionJobId) return

    let cancelled = false

    const pollJob = async () => {
      for (let attempt = 0; attempt < 45 && !cancelled; attempt += 1) {
        try {
          const res = await fetch(`/api/provision/jobs/${provisionJobId}`, { cache: 'no-store' })
          const data = await res.json()
          if (!res.ok) {
            throw new Error(data.error || 'Provision job failed')
          }

          const job = data.job
          if (typeof job?.attempts === 'number') {
            setProvisionAttempts(job.attempts)
          }

          if (job?.status === 'queued') {
            setProvisionStatus('queued')
          } else if (job?.status === 'running') {
            setProvisionStatus('running')
          }

          if (job?.status === 'failed') {
            setProvisionStatus('failed')
            setProvisionError(typeof job.error === 'string' ? job.error : null)
            return
          }

          if (job?.status === 'completed' && job?.result?.url) {
            setProvisionStatus('done')
            localStorage.setItem('agentbot_instance', JSON.stringify({
              userId: typeof job.result.agentId === 'string' ? job.result.agentId : job.agentId,
              url: job.result.url,
            }))
            setProvisionJobId(null)
            return
          }
        } catch {
          // keep waiting
        }

        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
    }

    pollJob()

    return () => {
      cancelled = true
    }
  }, [provisionJobId])

  const autoProvisionOpenClaw = async (plan: string) => {
    setProvisionStatus('submitting')
    setProvisionError(null)
    try {
      const res = await fetch('/api/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          aiProvider: 'openrouter',
          plan: plan || 'solo',
          agentType: 'business',
          autoProvision: true,
        })
      })
      const data = await res.json()
      if (data.success) {
        if (data.jobId) {
          // Treat the initial job as queued; the poller will refine it to
          // running/completed/failed as the backend progresses.
          setProvisionStatus(data.status === 'running' ? 'running' : 'queued')
          setProvisionJobId(data.jobId)
        } else {
          setProvisionStatus('done')
          localStorage.setItem('agentbot_instance', JSON.stringify({
            userId: data.userId,
            subdomain: data.subdomain,
            url: data.url,
          }))
        }
      } else {
        setProvisionStatus('failed')
        setProvisionError(typeof data.error === 'string' ? data.error : null)
      }
    } catch {
      setProvisionStatus('failed')
    }
  }

  if (status === 'loading') {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center font-mono">
        <div className="text-left space-y-4">
          <div className="w-6 h-6 border border-zinc-600 border-t-white animate-spin mx-auto" />
          <div className="text-sm font-bold uppercase tracking-widest">Deploying Service</div>
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest">This may take 30-60 seconds</p>
        </div>
      </main>
    )
  }

  if (status === 'error') {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center font-mono p-6">
        <div className="max-w-sm w-full space-y-8 text-left">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-6">Error</div>
            <h1 className="text-2xl font-bold tracking-tighter uppercase">
              Verification<br /><span className="text-zinc-700">Failed</span>
            </h1>
            <p className="text-zinc-500 text-xs mt-4">
              We couldn&apos;t verify your subscription. Please contact support.
            </p>
          </div>
          <Link
            href="/pricing"
            className="block w-full py-3 text-left text-xs font-bold uppercase tracking-widest border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
          >
            Back to Pricing
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center font-mono p-6">
      <div className="max-w-sm w-full space-y-8">
        <div className="text-left">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-6">Confirmed</div>
          <h1 className="text-2xl font-bold tracking-tighter uppercase">
            Welcome to<br /><span className="text-zinc-700">Agentbot</span>
          </h1>
        </div>

        <div className="border border-zinc-900 p-6 space-y-4">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Subscription Details</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-1">Plan</span>
              <span className="text-sm font-bold uppercase tracking-wider">{subscription?.plan || 'Loading...'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-1">Status</span>
              <span className="text-sm font-bold uppercase tracking-wider text-white">Active</span>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-1">Next Billing</span>
              <span className="text-sm font-bold uppercase tracking-wider">
                {subscription?.nextBilling ? new Date(subscription.nextBilling).toLocaleDateString() : 'Loading...'}
              </span>
            </div>
          </div>
        </div>

        <div className="border border-zinc-900 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600">Deployment</div>
            {(provisionStatus === 'submitting' || provisionStatus === 'queued' || provisionStatus === 'running') && (
              <div className="w-3 h-3 border border-zinc-600 border-t-white animate-spin" aria-hidden />
            )}
          </div>

          <ol className="space-y-1 text-[10px] uppercase tracking-widest">
            <li className={provisionStatus === 'submitting' ? 'text-white' : 'text-zinc-700'}>
              {provisionStatus === 'submitting' ? '› ' : '  '}Submitting
            </li>
            <li className={provisionStatus === 'queued' ? 'text-white' : 'text-zinc-700'}>
              {provisionStatus === 'queued' ? '› ' : '  '}Queued
            </li>
            <li className={provisionStatus === 'running' ? 'text-white' : 'text-zinc-700'}>
              {provisionStatus === 'running' ? '› ' : '  '}Provisioning runtime
            </li>
            <li className={provisionStatus === 'done' ? 'text-green-400' : 'text-zinc-700'}>
              {provisionStatus === 'done' ? '✓ ' : '  '}Ready
            </li>
          </ol>

          {provisionStatus === 'queued' && (
            <p className="text-xs text-zinc-500">Queued — typically picked up in under 30 seconds.</p>
          )}
          {provisionStatus === 'running' && (
            <p className="text-xs text-zinc-500">
              Provisioning your OpenClaw runtime{provisionAttempts > 1 ? ` (attempt ${provisionAttempts})` : ''}...
            </p>
          )}
          {provisionStatus === 'done' && (
            <p className="text-xs text-green-400">OpenClaw deployed successfully. Head to your dashboard to configure.</p>
          )}
          {provisionStatus === 'failed' && (
            <p className="text-xs text-zinc-500">
              Auto-deploy didn&apos;t complete{provisionError ? `: ${provisionError}` : ''}. You can deploy manually from{' '}
              <a href="/onboard?mode=deploy" className="text-white underline">the onboard page</a>.
            </p>
          )}
          {provisionStatus === 'idle' && (
            <p className="text-xs text-zinc-500">
              Your service is being deployed. You&apos;ll receive an email with your dashboard link shortly.
            </p>
          )}
        </div>

        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="block w-full py-3 text-left text-xs font-bold uppercase tracking-widest bg-white text-black hover:bg-zinc-200 transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="block w-full py-3 text-left text-xs font-bold uppercase tracking-widest border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
          >
            Back to Home
          </Link>
        </div>

        <p className="text-left text-zinc-700 text-[10px] uppercase tracking-widest">
          Need help? support@agentbot.sh
        </p>
      </div>
    </main>
  )
}

function CheckoutSuccessFallback() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center font-mono">
      <div className="text-left space-y-4">
        <div className="w-6 h-6 border border-zinc-600 border-t-white animate-spin mx-auto" />
        <div className="text-sm font-bold uppercase tracking-widest">Deploying Service</div>
        <p className="text-[10px] text-zinc-600 uppercase tracking-widest">This may take 30-60 seconds</p>
      </div>
    </main>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<CheckoutSuccessFallback />}>
      <CheckoutSuccessContent />
    </Suspense>
  )
}
