'use client'

import { useOnboard } from './OnboardContext'
import { AVAILABLE_MODELS } from './types'

export function StepModel() {
  const { selectedModel, setSelectedModel, botInfo, setStep } = useOnboard()

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tighter uppercase mb-2">Step 5: Choose Your AI Model</h2>
      {botInfo && <p className="text-green-400 mb-6">✓ Bot validated: @{botInfo.username}</p>}
      <div className="space-y-6">
        <div className="space-y-3">
          {AVAILABLE_MODELS.map((model) => (
            <button key={model.id} onClick={() => setSelectedModel(model.id)}
              className={`w-full text-left p-4 rounded-xl border ${selectedModel === model.id ? 'border-white bg-zinc-800' : 'border-zinc-700 hover:border-zinc-600'} transition-colors`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{model.name}</div>
                  <div className="text-sm text-zinc-400">{model.description}</div>
                </div>
                {model.recommended && <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">Recommended</span>}
              </div>
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <button onClick={() => setStep('agenttype')} className="w-full rounded-lg border border-zinc-700 px-6 py-3 hover:bg-zinc-800 transition-colors sm:w-auto">← Back</button>
          <button onClick={() => setStep('skills')} className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-zinc-200 transition-colors sm:flex-1">Continue →</button>
        </div>
      </div>
    </div>
  )
}
