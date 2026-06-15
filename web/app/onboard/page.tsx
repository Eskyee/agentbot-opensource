'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { OnboardProvider, useOnboard } from './components/OnboardContext'
import { StepTelegram } from './components/StepTelegram'
import { StepToken } from './components/StepToken'
import { StepUserId } from './components/StepUserId'
import { StepAgentType } from './components/StepAgentType'
import { StepAI } from './components/StepAI'
import { StepModel } from './components/StepModel'
import { StepSkills } from './components/StepSkills'
import { StepDeploy } from './components/StepDeploy'
import { StepDone } from './components/StepDone'
import { DEPLOY_FLOW_STEPS, FLOW_STEPS } from './components/types'

function Confetti() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {[...Array(50)].map((_, i) => (
        <div key={i} className="absolute w-2 h-2" style={{
          left: `${Math.random() * 100}%`, top: '-10px',
          backgroundColor: ['#ff0', '#f0f', '#0ff', '#0f0', '#f00', '#00f', '#ff6b35'][Math.floor(Math.random() * 7)],
          borderRadius: Math.random() > 0.5 ? '50%' : '0',
          animation: `confettiFall ${2 + Math.random() * 3}s ease-in-out forwards`,
          animationDelay: `${Math.random() * 0.5}s`,
        }} />
      ))}
    </div>
  )
}

function ModeSelector() {
  const { mode, plan } = useOnboard()

  return (
    <div className="mb-8">
      <div className="mb-3 text-[10px] uppercase tracking-widest text-zinc-600">Choose your path</div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { id: 'deploy', title: 'Deploy OpenClaw', desc: 'Launch a managed runtime fast' },
          { id: 'create', title: 'Custom Agent', desc: 'Build your own agent from scratch' },
          { id: 'link', title: 'Link Existing', desc: 'Connect an OpenClaw instance you already run' },
        ].map((option) => (
          <Link key={option.id} href={`/onboard?mode=${option.id}&plan=${plan}`}
            className={`rounded-xl border p-4 text-left transition-colors ${mode === option.id ? 'border-white bg-white text-black' : 'border-zinc-800 bg-zinc-900 text-white hover:border-zinc-700 hover:bg-zinc-950'}`}>
            <div className={`text-[10px] uppercase tracking-widest ${mode === option.id ? 'text-black/60' : 'text-zinc-500'}`}>
              {option.id === 'deploy' ? 'Managed' : option.id === 'create' ? 'Builder' : 'Connect'}
            </div>
            <div className="mt-2 text-sm font-bold uppercase tracking-tight">{option.title}</div>
            <div className={`mt-2 text-xs leading-relaxed ${mode === option.id ? 'text-black/70' : 'text-zinc-400'}`}>{option.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function ProgressSteps() {
  const { step, mode, activeSteps, currentIdx } = useOnboard()

  return (
    <div className="mb-12 overflow-x-auto pb-2">
      <div className="flex min-w-max items-center gap-2 px-2">
        {activeSteps.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              step === s ? 'bg-white text-black' : currentIdx > i ? 'bg-green-500 text-white' : 'bg-zinc-800 text-zinc-500'
            }`}>
              {currentIdx > i ? '✓' : i + 1}
            </div>
            {i < activeSteps.length - 1 && <div className="w-8 h-0.5 bg-zinc-800" />}
          </div>
        ))}
      </div>
    </div>
  )
}

function StepRouter() {
  const { step } = useOnboard()

  switch (step) {
    case 'telegram': return <StepTelegram />
    case 'token': return <StepToken />
    case 'userid': return <StepUserId />
    case 'agenttype': return <StepAgentType />
    case 'ai': return <StepAI />
    case 'model': return <StepModel />
    case 'skills': return <StepSkills />
    case 'deploy': return <StepDeploy />
    case 'done': return <StepDone />
    default: return null
  }
}

function OnboardContent() {
  const { isPaid, plan, mode, showConfetti } = useOnboard()

  return (
    <div className="mx-auto max-w-2xl">
      <ModeSelector />

      <div className="mb-12">
        {isPaid && (
          <div className="mb-4 bg-green-500/20 border border-green-500/50 text-green-400 px-4 py-2 inline-block text-xs uppercase tracking-widest">
            ✓ {plan.charAt(0).toUpperCase() + plan.slice(1)} plan activated
          </div>
        )}
        <h1 className="text-3xl font-bold tracking-tighter uppercase">
          Deploy your agent
        </h1>
        <p className="text-sm text-zinc-400 mt-2">
          One click. Your agent is live in under 2 minutes.
        </p>
      </div>

      <ProgressSteps />

      <div className="bg-zinc-900 border border-zinc-800 p-5 sm:p-8">
        <StepRouter />
      </div>

      {showConfetti && <Confetti />}
    </div>
  )
}

// Confetti CSS injection
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `@keyframes confettiFall { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } }`
  if (!document.getElementById('confetti-styles')) {
    style.id = 'confetti-styles'
    document.head.appendChild(style)
  }
}

export default function Onboard() {
  return (
    <main className="min-h-screen py-16 px-6 bg-black text-white selection:bg-orange-500/30 font-mono">
      <Suspense fallback={<div className="mx-auto max-w-2xl"><div className="text-5xl mb-4">🦞</div><p className="text-sm text-zinc-400">Loading...</p></div>}>
        <OnboardProvider>
          <OnboardContent />
        </OnboardProvider>
      </Suspense>
    </main>
  )
}
