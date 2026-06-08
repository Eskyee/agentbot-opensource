'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Clock, CheckCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OneClickDeployProps {
  template: {
    name: string
    role: string
    description: string
    skills: string[]
    tier: string
    brain: string
  }
  onDeployed?: (agentId: string, name: string) => void
}

const AGENT_NAMES = [
  'Atlas', 'Nova', 'Klave', 'Raven', 'Echo', 'Pulse', 'Drift',
  'Forge', 'Hex', 'Nyx', 'Volt', 'Apex', 'Flux', 'Zero', 'Onyx',
]

function generateName(): string {
  return AGENT_NAMES[Math.floor(Math.random() * AGENT_NAMES.length)] +
    '-' + Math.random().toString(36).slice(2, 5).toUpperCase()
}

export function OneClickDeploy({ template, onDeployed }: OneClickDeployProps) {
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'deploying' | 'done'>('idle')
  const [error, setError] = useState('')
  const [agentName, setAgentName] = useState('')

  const handleQuickDeploy = async () => {
    const name = generateName()
    setAgentName(name)
    setState('deploying')
    setError('')

    try {
      const res = await fetch('/api/agents/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          model: 'claude-opus-4-6',
          config: {
            template: template.name,
            brain: template.brain,
            tier: template.tier.toLowerCase(),
            quickDeploy: true,
          },
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Deploy failed')
        setState('idle')
        return
      }

      setState('done')
      setTimeout(() => {
        if (onDeployed) {
          onDeployed(data.agent?.id, name)
        } else {
          router.push('/dashboard')
        }
      }, 1500)
    } catch {
      setError('Network error')
      setState('idle')
    }
  }

  if (state === 'done') {
    return (
      <div className="flex items-center gap-2 text-emerald-400">
        <CheckCircle className="h-4 w-4" />
        <span className="text-xs font-bold uppercase tracking-widest">{agentName} deployed</span>
      </div>
    )
  }

  if (state === 'deploying') {
    return (
      <div className="flex items-center gap-2 text-orange-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-xs font-bold uppercase tracking-widest">Deploying {agentName}...</span>
      </div>
    )
  }

  return (
    <button
      onClick={handleQuickDeploy}
      className="flex items-center gap-2 text-[11px] bg-white text-black px-4 py-2 font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
    >
      <Zap className="h-3 w-3" />
      Deploy in 60s
    </button>
  )
}
