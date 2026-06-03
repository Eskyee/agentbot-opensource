'use client'

import { useOnboard } from './OnboardContext'
import { AVAILABLE_SKILLS } from './types'

export function StepSkills() {
  const { selectedSkills, setSelectedSkills, botInfo, setStep } = useOnboard()

  const toggle = (id: string) => {
    setSelectedSkills(selectedSkills.includes(id) ? selectedSkills.filter(s => s !== id) : [...selectedSkills, id])
  }

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tighter uppercase mb-2">Step 6: Ready-to-Use Skills</h2>
      {botInfo && <p className="text-green-400 mb-6">✓ Bot validated: @{botInfo.username}</p>}
      <p className="text-zinc-400 text-sm mb-6">Select skills for your agent. You can always add more later from the dashboard.</p>
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {AVAILABLE_SKILLS.map((skill) => {
            const isSelected = selectedSkills.includes(skill.id)
            return (
              <button key={skill.id} onClick={() => toggle(skill.id)}
                className={`text-left p-4 rounded-xl border transition-colors ${isSelected ? 'border-white bg-zinc-800' : 'border-zinc-700 hover:border-zinc-600'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{skill.icon}</span>
                  <div>
                    <div className="font-semibold">{skill.name}</div>
                    <div className="text-xs text-zinc-400">{skill.description}</div>
                  </div>
                  {isSelected && <span className="ml-auto text-green-400">✓</span>}
                </div>
              </button>
            )
          })}
        </div>
        <div className="bg-zinc-800 rounded-xl p-4">
          <p className="text-sm text-zinc-400">Selected: <span className="text-white">{selectedSkills.length}</span> skills</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <button onClick={() => setStep('model')} className="w-full rounded-lg border border-zinc-700 px-6 py-3 hover:bg-zinc-800 transition-colors sm:w-auto">← Back</button>
          <button onClick={() => setStep('deploy')} className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-zinc-200 transition-colors sm:flex-1">Continue to Deploy →</button>
        </div>
      </div>
    </div>
  )
}
