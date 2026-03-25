'use client'

import { useState, useEffect } from 'react'
import { Breadcrumbs } from '@/app/components/Breadcrumbs'

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
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-6 py-6">
        <Breadcrumbs />
        <div className="mb-8">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600">Multi-Agent Teams</span>
          <h1 className="text-3xl font-bold tracking-tighter uppercase mt-1">Team Mode</h1>
          <p className="text-zinc-400 text-sm mt-2">
            Deploy coordinated AI agent teams. Each agent runs independently with shared memory.
          </p>
        </div>

        {/* Plan selector */}
        <div className="flex gap-3 mb-8">
          {['collective', 'label'].map(p => (
            <button
              key={p}
              onClick={() => setPlan(p)}
              className={`px-4 py-2 text-xs uppercase tracking-widest font-bold border transition-colors ${
                plan === p
                  ? 'border-white text-white bg-white/10'
                  : 'border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600'
              }`}
            >
              {p} {p === 'collective' ? '(3 agents)' : '(10 agents)'}
            </button>
          ))}
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 mb-6 border-b border-zinc-800 pb-3">
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 text-xs uppercase tracking-widest transition-colors ${
                selectedCategory === cat.key
                  ? 'text-white border-b-2 border-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Template grid */}
        {loading ? (
          <div className="text-zinc-500 py-16 text-center">Loading templates...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryTemplates.map(template => (
              <div
                key={template.key}
                className="border border-zinc-800 rounded-lg p-5 hover:border-zinc-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider">{template.name}</h3>
                    <p className="text-xs text-zinc-500 mt-1">{template.description}</p>
                  </div>
                  <span className="text-xs text-zinc-600 border border-zinc-800 px-2 py-0.5">
                    {template.agent_count} agents
                  </span>
                </div>

                {/* Agent list */}
                <div className="space-y-2 mb-4">
                  {template.agents.map(agent => (
                    <div key={agent.name} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-xs text-zinc-400">
                        <span className="text-zinc-300 font-medium">{agent.role}</span>
                        <span className="text-zinc-600 ml-1">({agent.name})</span>
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => provisionTeam(template.key)}
                  disabled={provisioning}
                  className="w-full py-2 text-xs uppercase tracking-widest font-bold border border-zinc-700 text-zinc-300 hover:text-white hover:border-white transition-colors disabled:opacity-50"
                >
                  {provisioning ? 'Deploying...' : 'Deploy Team'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Custom YAML (Label only) */}
        {plan === 'label' && (
          <div className="mt-8 border border-zinc-800 rounded-lg p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-3">Custom Configuration</h3>
            <p className="text-xs text-zinc-500 mb-4">
              Define your own team with custom YAML. Label plan supports up to 10 agents.
            </p>
            <textarea
              className="w-full h-64 bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-xs font-mono text-zinc-300 resize-none focus:outline-none focus:border-zinc-600"
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
              className="mt-4 px-6 py-2 text-xs uppercase tracking-widest font-bold border border-white text-white hover:bg-white hover:text-black transition-colors"
            >
              Deploy Custom Team
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
