'use client'

import { useState } from 'react'
import { User, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'
import { AgentCard } from '@/app/components/shared/AgentCard'
import { AgentInput } from '@/app/components/shared/AgentInput'

const PERSONALITIES = [
  { id: 'basement', name: 'Basement', tone: 'dark & hypnotic', emoji: '🔮', description: 'Underground techno energy. Minimal, hypnotic, warehouse vibes.' },
  { id: 'selector', name: 'Selector', tone: 'DJ & curation', emoji: '🎧', description: 'Track recommendations, setlists, BPM matching. Always reading the room.' },
  { id: 'ar', name: 'A&R', tone: 'industry & discovery', emoji: '🎤', description: 'Finding the next hits. Connecting artists, labels, and opportunities.' },
  { id: 'road', name: 'Road', tone: 'logistics & touring', emoji: '🚛', description: 'Buses, venues, rider requirements. Making sure the show goes on.' },
  { id: 'label', name: 'Label', tone: 'operations & roster', emoji: '🏷️', description: 'Release schedules, royalty splits, catalog management.' },
]

export default function PersonalityPage() {
  const [selected, setSelected] = useState('professional')
  const [customGreeting, setCustomGreeting] = useState('')
  const [expertise, setExpertise] = useState('')

  const savePersonality = async () => {
    await fetch('/api/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId: 'default',
        key: 'personality',
        value: JSON.stringify({ type: selected, greeting: customGreeting, expertise }),
      }),
    })
    alert('Personality saved!')
  }

  return (
    <DashboardShell>
      <DashboardHeader
        title="Agent Personality"
        icon={<User className="h-5 w-5 text-blue-400" />}
      />

      <DashboardContent className="max-w-4xl space-y-6">
        {/* Personality type selector */}
        <AgentCard>
          <h2 className="text-sm font-bold uppercase tracking-widest mb-4">
            Choose Personality Type
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {PERSONALITIES.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selected === p.id
                    ? 'border-white bg-zinc-800'
                    : 'border-zinc-700 hover:border-zinc-600'
                }`}
              >
                <div className="text-3xl mb-2">{p.emoji}</div>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-zinc-400 mt-1">{p.tone}</div>
              </button>
            ))}
          </div>
        </AgentCard>

        {/* Custom greeting */}
        <AgentCard>
          <h2 className="text-sm font-bold uppercase tracking-widest mb-4">
            Custom Greeting
          </h2>
          <AgentInput
            placeholder="Hello! How can I assist you today?"
            value={customGreeting}
            onChange={(e) => setCustomGreeting(e.target.value)}
          />
        </AgentCard>

        {/* Area of expertise */}
        <AgentCard>
          <h2 className="text-sm font-bold uppercase tracking-widest mb-4">
            Area of Expertise
          </h2>
          <AgentInput
            placeholder="e.g., customer support, data analysis, content writing"
            value={expertise}
            onChange={(e) => setExpertise(e.target.value)}
          />
        </AgentCard>

        {/* Save */}
        <Button
          className="w-full bg-white text-black hover:bg-zinc-200 text-xs font-bold uppercase tracking-widest"
          onClick={savePersonality}
        >
          <Save className="h-4 w-4 mr-1" /> Save Personality
        </Button>
      </DashboardContent>
    </DashboardShell>
  )
}
