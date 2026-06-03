'use client'

import { useOnboard } from './OnboardContext'
import { AGENT_TYPES } from './types'

export function StepAgentType() {
  const { agentType, setAgentType, setStep } = useOnboard()

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tighter uppercase mb-2">Choose Your Agent Type</h2>
      <p className="text-zinc-400 mb-6">Select the type of agent that best fits your needs. Each comes pre-configured with relevant skills.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {AGENT_TYPES.map((type) => (
          <button key={type.id} onClick={() => setAgentType(type.id)}
            className={`text-left p-4 rounded-xl border transition-all ${agentType === type.id ? 'border-white bg-zinc-800' : 'border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800'}`}>
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
        <button onClick={() => setStep('userid')} className="px-6 py-3 border border-zinc-700 text-zinc-300 rounded-lg font-medium hover:bg-zinc-800 transition-colors">← Back</button>
        <button onClick={() => setStep('ai')} className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-zinc-200 transition-colors">Continue →</button>
      </div>
    </div>
  )
}
