'use client'

import { useState, useEffect } from 'react'
import { Users, Play } from 'lucide-react'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'

interface Template {
  key: string
  name: string
  description: string
  agent_count: number
  agents: { name: string; role: string }[]
}

interface Category {
  key: string
  label: string
  templates: string[]
}

export default function TeamPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('developer')
  const [loading, setLoading] = useState(true)
  const [provisioning, setProvisioning] = useState(false)
  const [plan, setPlan] = useState<string>('collective')

  useEffect(() => {
    fetch('/api/provision/team/templates')
      .then(r => r.json())
      .then(data => {
        setTemplates(data.templates || [])
        setCategories(data.categories || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const provisionTeam = async (templateKey: string) => {
    setProvisioning(true)
    try {
      const res = await fetch('/api/provision/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, templateKey }),
      })
      const data = await res.json()
      if (data.success) {
        alert(`Team provisioned! Team ID: ${data.teamId}`)
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
    setProvisioning(false)
  }

  const categoryTemplates = templates.filter(t =>
    categories.find(c => c.key === selectedCategory)?.templates.includes(t.key)
  )

  return (
    <DashboardShell>
      <DashboardHeader
        title="Team Mode"
        icon={<Users className="h-5 w-5 text-blue-400" />}
      />

      <DashboardContent className="space-y-6">
        {/* Description */}
        <p className="text-xs text-zinc-500">
          Deploy coordinated AI agent teams. Each agent runs independently with shared memory.
        </p>

        {/* Plan selector */}
        <div className="flex gap-px bg-zinc-800">
          {['collective', 'label'].map(p => (
            <button
              key={p}
              onClick={() => setPlan(p)}
              className={`flex-1 py-3 text-[10px] uppercase tracking-widest font-bold border transition-colors ${
                plan === p
                  ? 'bg-zinc-950 border-zinc-700 text-white'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-600 hover:text-zinc-300 hover:border-zinc-600'
              }`}
            >
              {p} {p === 'collective' ? '(3 agents)' : '(10 agents)'}
            </button>
          ))}
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 border-b border-zinc-800 pb-3">
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold transition-colors ${
                selectedCategory === cat.key
                  ? 'text-white border-b border-white'
                  : 'text-zinc-600 hover:text-zinc-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Template grid */}
        {loading ? (
          <div className="text-zinc-600 py-16 text-center text-xs uppercase tracking-widest">Loading templates...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-800">
            {categoryTemplates.map(template => (
              <div
                key={template.key}
                className="bg-zinc-950 border border-zinc-800 p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-tight">{template.name}</h3>
                    <p className="text-xs text-zinc-500 mt-1">{template.description}</p>
                  </div>
                  <span className="text-[10px] text-zinc-600 border border-zinc-800 px-2 py-0.5 uppercase tracking-widest">
                    {template.agent_count} agents
                  </span>
                </div>

                {/* Agent list */}
                <div className="space-y-2 mb-4">
                  {template.agents.map(agent => (
                    <div key={agent.name} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500" />
                      <span className="text-xs text-zinc-400">
                        <span className="text-zinc-300 font-bold uppercase">{agent.role}</span>
                        <span className="text-zinc-600 ml-1 font-mono">({agent.name})</span>
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => provisionTeam(template.key)}
                  disabled={provisioning}
                  className="w-full border border-zinc-700 hover:border-zinc-500 text-white text-[10px] font-bold uppercase tracking-widest py-2 px-4 transition-colors disabled:opacity-50"
                >
                  {provisioning ? 'Deploying...' : 'Deploy Team'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Custom YAML (Label only) */}
        {plan === 'label' && (
          <div className="border border-zinc-800 bg-zinc-950 p-6">
            <h3 className="text-sm font-bold uppercase tracking-tight mb-3">Custom Configuration</h3>
            <p className="text-xs text-zinc-500 mb-4">
              Define your own team with custom YAML. Label plan supports up to 10 agents.
            </p>
            <textarea
              className="w-full h-64 bg-zinc-950 border border-zinc-800 p-4 text-xs font-mono text-zinc-300 resize-none focus:outline-none focus:border-zinc-600"
              placeholder={`# Custom team YAML
agents:
  lead:
    role: Team Lead
    description: Coordinates the team
    model: openrouter/xiaomi/mimo-v2-pro
    tools: [filesystem, think, todo, memory]
  specialist:
    role: Specialist
    description: Domain expert
    model: openrouter/xiaomi/mimo-v2-pro
    tools: [filesystem, shell, think]`}
            />
            <button
              className="mt-4 bg-white text-black py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 px-6"
            >
              Deploy Custom Team
            </button>
          </div>
        )}
      </DashboardContent>
    </DashboardShell>
  )
}
