'use client'

import { useState } from 'react'
import { User, Save, Radio, Music, Mic, Truck, Disc3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'
import { AgentInput } from '@/app/components/shared/AgentInput'

const PERSONALITIES = [
  { id: 'basement', name: 'Basement', tone: 'dark & hypnotic', icon: Radio, description: 'Underground techno energy. Minimal, hypnotic, warehouse vibes.' },
  { id: 'selector', name: 'Selector', tone: 'DJ & curation', icon: Music, description: 'Track recommendations, setlists, BPM matching. Always reading the room.' },
  { id: 'ar', name: 'A&R', tone: 'industry & discovery', icon: Mic, description: 'Finding the next hits. Connecting artists, labels, and opportunities.' },
  { id: 'road', name: 'Road', tone: 'logistics & touring', icon: Truck, description: 'Buses, venues, rider requirements. Making sure the show goes on.' },
  { id: 'label', name: 'Label', tone: 'operations & roster', icon: Disc3, description: 'Release schedules, royalty splits, catalog management.' },
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
        memory: JSON.stringify({ type: selected, greeting: customGreeting, expertise }),
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

      <DashboardContent className="space-y-6">
        {/* Personality type selector */}
        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-4">
            Choose Personality Type
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-px bg-zinc-800">
            {PERSONALITIES.map((p) => {
              const Icon = p.icon
              return (
                <button
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                  className={`p-4 border text-left transition-all ${
                    selected === p.id
                      ? 'border-white bg-zinc-950'
                      : 'border-zinc-800 bg-zinc-950 hover:border-zinc-600'
                  }`}
                >
                  <Icon className={`h-5 w-5 mb-2 ${selected === p.id ? 'text-white' : 'text-zinc-500'}`} />
                  <div className="text-sm font-bold uppercase tracking-tight">{p.name}</div>
                  <div className="text-[10px] text-zinc-600 uppercase tracking-widest mt-1">{p.tone}</div>
                  <div className="text-xs text-zinc-500 mt-2">{p.description}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Custom greeting */}
        <div className="border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-4">
            Custom Greeting
          </h2>
          <AgentInput
            placeholder="Hello! How can I assist you today?"
            value={customGreeting}
            onChange={(e) => setCustomGreeting(e.target.value)}
          />
        </div>

        {/* Area of expertise */}
        <div className="border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-4">
            Area of Expertise
          </h2>
          <AgentInput
            placeholder="e.g., customer support, data analysis, content writing"
            value={expertise}
            onChange={(e) => setExpertise(e.target.value)}
          />
        </div>

        {/* Save */}
        <button
          className="w-full bg-white text-black py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 flex items-center justify-center gap-2"
          onClick={savePersonality}
        >
          <Save className="h-4 w-4" /> Save Personality
        </button>
      </DashboardContent>
    </DashboardShell>
  )
}
