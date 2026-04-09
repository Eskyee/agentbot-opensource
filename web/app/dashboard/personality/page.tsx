'use client'

import { useState, useEffect, useCallback } from 'react'
import { User, Save, Radio, Music, Mic, Truck, Disc3, Check } from 'lucide-react'
import Link from 'next/link'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'
import { AgentInput } from '@/app/components/shared/AgentInput'

interface Agent {
  id: string
  name: string
}

const PERSONALITIES = [
  { id: 'basement', name: 'Basement', tone: 'dark & hypnotic', icon: Radio, description: 'Underground techno energy. Minimal, hypnotic, warehouse vibes.' },
  { id: 'selector', name: 'Selector', tone: 'DJ & curation', icon: Music, description: 'Track recommendations, setlists, BPM matching. Always reading the room.' },
  { id: 'ar', name: 'A&R', tone: 'industry & discovery', icon: Mic, description: 'Finding the next hits. Connecting artists, labels, and opportunities.' },
  { id: 'road', name: 'Road', tone: 'logistics & touring', icon: Truck, description: 'Buses, venues, rider requirements. Making sure the show goes on.' },
  { id: 'label', name: 'Label', tone: 'operations & roster', icon: Disc3, description: 'Release schedules, royalty splits, catalog management.' },
]

export default function PersonalityPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState<string>('')
  const [selected, setSelected] = useState('basement')
  const [customGreeting, setCustomGreeting] = useState('')
  const [expertise, setExpertise] = useState('')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  // Fetch agents on mount
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch('/api/agents')
        if (!res.ok) return
        const data = await res.json()
        const agentList: Agent[] = data.agents ?? data ?? []
        setAgents(agentList)
        if (agentList.length > 0) {
          setSelectedAgentId(agentList[0].id)
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchAgents()
  }, [])

  // Fetch personality when selectedAgentId changes
  const fetchPersonality = useCallback(async (agentId: string) => {
    if (!agentId) return
    try {
      const res = await fetch(`/api/memory?agentId=${agentId}`)
      if (!res.ok) return
      const data = await res.json()
      const p = data.memory?.personality
      if (p) {
        const parsed = typeof p === 'string' ? JSON.parse(p) : p
        setSelected(parsed.type || 'basement')
        setCustomGreeting(parsed.greeting || '')
        setExpertise(parsed.expertise || '')
      } else {
        setSelected('basement')
        setCustomGreeting('')
        setExpertise('')
      }
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    if (selectedAgentId) {
      fetchPersonality(selectedAgentId)
    }
  }, [selectedAgentId, fetchPersonality])

  const savePersonality = async () => {
    if (!selectedAgentId) return
    try {
      await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgentId,
          key: 'personality',
          memory: JSON.stringify({ type: selected, greeting: customGreeting, expertise }),
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      // silently fail
    }
  }

  if (loading) {
    return (
      <DashboardShell>
        <DashboardHeader
          title="Agent Personality"
          icon={<User className="h-5 w-5 text-blue-400" />}
        />
        <DashboardContent className="space-y-6">
          <div className="text-zinc-500 text-sm">Loading agents...</div>
        </DashboardContent>
      </DashboardShell>
    )
  }

  if (agents.length === 0) {
    return (
      <DashboardShell>
        <DashboardHeader
          title="Agent Personality"
          icon={<User className="h-5 w-5 text-blue-400" />}
        />
        <DashboardContent className="space-y-6">
          <div className="border border-zinc-800 bg-zinc-950 p-8 text-center">
            <p className="text-zinc-400 text-sm mb-4">No agents deployed yet</p>
            <Link
              href="/marketplace"
              className="text-xs font-bold uppercase tracking-widest text-white underline hover:text-zinc-300"
            >
              Go to Marketplace
            </Link>
          </div>
        </DashboardContent>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <DashboardHeader
        title="Agent Personality"
        icon={<User className="h-5 w-5 text-blue-400" />}
      />

      <DashboardContent className="space-y-6">
        {/* Agent selector (shown when multiple agents) */}
        {agents.length > 1 && (
          <div className="border border-zinc-800 bg-zinc-950 p-5">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-4">
              Select Agent
            </h2>
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 text-white text-sm px-3 py-2 focus:outline-none focus:border-zinc-500"
            >
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name || agent.id}
                </option>
              ))}
            </select>
          </div>
        )}

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
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-3">
            Expertise
          </h2>
          <p className="text-[11px] text-zinc-500 mb-4">
            Define your agent&apos;s specific knowledge. This shapes how it talks and what it knows deeply.
          </p>
          {/* Quick-select presets */}
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              'UK techno & Berlin clubs',
              'hip-hop production & beats',
              'independent artist management',
              'vinyl curation & DJing',
              'music sync licensing',
              'Spotify & streaming strategy',
              'live events & touring',
              'music publishing & royalties',
              'UK drill & grime',
              'jazz & experimental',
              'modular synthesis & hardware',
              'label operations & A&R',
            ].map((preset) => (
              <button
                key={preset}
                onClick={() => setExpertise(expertise ? `${expertise}, ${preset}` : preset)}
                className="text-[10px] px-2 py-1 border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white transition-colors uppercase tracking-widest"
              >
                {preset}
              </button>
            ))}
          </div>
          <AgentInput
            placeholder="e.g., UK techno, Berghain resident sets, Roland hardware"
            value={expertise}
            onChange={(e) => setExpertise(e.target.value)}
          />
        </div>

        {/* Save */}
        <button
          className="w-full bg-white text-black py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 flex items-center justify-center gap-2"
          onClick={savePersonality}
        >
          {saved ? (
            <>
              <Check className="h-4 w-4 text-green-600" /> Saved
            </>
          ) : (
            <>
              <Save className="h-4 w-4" /> Save Personality
            </>
          )}
        </button>

        {/* Inline saved indicator */}
        {saved && (
          <div className="text-center text-green-500 text-xs font-bold uppercase tracking-widest">
            Personality saved successfully
          </div>
        )}
      </DashboardContent>
    </DashboardShell>
  )
}
