'use client'

import { useState } from 'react'
import Link from 'next/link'

const TEMPLATES = [
  {
    id: 'atlas',
    name: 'Atlas',
    description: 'Proactive exec assistant with injection defense, heartbeats, and anti-loop behavior',
    features: ['Heartbeats', 'Defense', 'Skills', 'Anti-loop'],
    icon: '🧠',
    recommended: true,
  },
  {
    id: 'social-media',
    name: 'Social Media',
    description: 'Content calendar, drafts, and performance analytics',
    features: ['Content plan', 'Post drafts', 'Tracking'],
    icon: '📱',
  },
  {
    id: 'executive',
    name: 'Executive Assistant',
    description: 'Calendar management, inbox triage, daily briefings',
    features: ['Morning brief', 'Meeting prep', 'Inbox'],
    icon: '💼',
  },
  {
    id: 'support',
    name: 'Customer Support',
    description: 'Ticket triage, draft replies, weekly reports',
    features: ['Ticket triage', 'Draft replies', 'Reports'],
    icon: '🎧',
  },
  {
    id: 'twitter-growth',
    name: 'Twitter Growth Engine',
    description: 'Draft daily tweets, build threads, and analyze engagement',
    features: ['Tweet drafts', 'Thread builder', 'Analytics'],
    icon: '🐦',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn Ghostwriter',
    description: 'Write thought leadership posts that drive engagement',
    features: ['Post drafts', 'Engagement', 'Tracking'],
    icon: '💼',
  },
  {
    id: 'cold-email',
    name: 'Cold Outreach Drafter',
    description: 'Research prospects and write personalized cold emails',
    features: ['Prospect research', 'Email drafts', 'Personalization'],
    icon: '📧',
  },
  {
    id: 'market-research',
    name: 'Market Research Analyst',
    description: 'Track competitors, trends, and market shifts daily',
    features: ['Competitor tracking', 'Trend analysis', 'Reports'],
    icon: '📊',
  },
  {
    id: 'content-calendar',
    name: 'Content Calendar Manager',
    description: 'Plan, schedule, and track content across platforms',
    features: ['Planning', 'Scheduling', 'Tracking'],
    icon: '📅',
  },
  {
    id: 'pr-review',
    name: 'PR Review Bot',
    description: 'Review pull requests and catch issues before merge',
    features: ['Code review', 'Issue detection', 'Reports'],
    icon: '🐙',
  },
]

const PERSONALITIES = [
  { id: 'atlas', name: 'Atlas', description: 'Direct & efficient' },
  { id: 'nova', name: 'Nova', description: 'Friendly & warm' },
  { id: 'max', name: 'Max', description: 'Professional & thorough' },
  { id: 'sage', name: 'Sage', description: 'Thoughtful & wise' },
]

const navItems = [
  { icon: '🤖', label: 'Agents', href: '/agents', active: true },
  { icon: '🛒', label: 'Marketplace', href: '/marketplace', active: false },
  { icon: '💳', label: 'Billing', href: '/billing', active: false },
  { icon: '⚙️', label: 'Account', href: '/settings', active: false },
]

function AgentsSidebar({ userName, credits = 0 }: { userName: string; credits?: number }) {
  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
      <div className="p-6 border-b border-gray-800">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🦞</span>
          <span className="text-xl font-bold">Agentbot</span>
        </Link>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                item.active 
                  ? 'bg-lobster-500/20 text-lobster-400' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="mt-8 p-4 bg-gray-800 rounded-xl">
          <div className="text-sm text-gray-400 mb-1">Credits</div>
          <div className="text-xl font-bold">${credits.toFixed(2)}</div>
        </div>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-lobster-500 rounded-full flex items-center justify-center font-bold">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-medium">{userName}</div>
            <div className="text-sm text-gray-400">Free Trial</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default function AgentsPage() {
  const [step, setStep] = useState<'select' | 'template' | 'builder'>('select')
  const [prompt, setPrompt] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [selectedPersonality, setSelectedPersonality] = useState('atlas')
  const [agentName, setAgentName] = useState('')
  const [instructions, setInstructions] = useState('')
  const [generating, setGenerating] = useState(false)
  const [showUpload, setShowUpload] = useState(false)

  const handleGenerate = () => {
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      setStep('template')
    }, 2000)
  }

  return (
    <div className="flex h-screen bg-black text-white">
      <AgentsSidebar userName="User" credits={0.01} />

      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Agent Builder</h1>
          <p className="text-xl text-gray-400">Create an AI Agent</p>
        </div>

        {/* AI Generator */}
        {step === 'select' && (
          <div className="mb-12">
            <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-8">
              <h2 className="text-xl font-semibold mb-4">Describe what you want to build</h2>
              <p className="text-gray-400 mb-6">Describe your agent and we&apos;ll generate a complete agent — personality, workflows, automations, and all.</p>
              
              <div className="flex gap-3">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Enter to generate..."
                  className="flex-1 rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 focus:border-lobster-500 focus:outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                />
                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || generating}
                  className="rounded-xl bg-lobster-500 px-6 py-3 font-semibold hover:bg-lobster-400 disabled:opacity-50"
                >
                  {generating ? 'Generating...' : 'Generate'}
                </button>
              </div>
              <p className="mt-3 text-sm text-gray-500">
                {generating ? 'Creating your agent...' : 'First generation is free'}
              </p>
            </div>

            {/* Suggested prompts */}
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {[
                'A Twitter content strategist that writes daily threads',
                'A customer support agent that triages tickets by priority',
                'A morning brief assistant for busy founders',
                'A cold email writer that researches prospects first',
              ].map((p) => (
                <button
                  key={p}
                  onClick={() => { setPrompt(p); handleGenerate() }}
                  className="text-left text-sm text-gray-400 hover:text-white p-3 rounded-lg border border-gray-800 hover:border-lobster-500 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* OR START FROM */}
        <div className="text-center mb-8">
          <span className="text-gray-500">OR START FROM</span>
        </div>

        {/* Templates Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => { setSelectedTemplate(template.id); setStep('template') }}
              className={`text-left rounded-xl border p-5 transition-all hover:border-lobster-500 ${
                template.recommended 
                  ? 'border-lobster-500 bg-lobster-500/10' 
                  : 'border-gray-800 bg-gray-900/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{template.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{template.name}</h3>
                    {template.recommended && (
                      <span className="text-xs bg-lobster-500 text-white px-2 py-0.5 rounded-full">Recommended</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{template.description}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {template.features.map((f) => (
                      <span key={f} className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Upload Files */}
        <div className="mt-8 text-center">
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="text-gray-400 hover:text-white"
          >
            + Upload Files
          </button>
          {showUpload && (
            <div className="mt-4 rounded-xl border border-dashed border-gray-700 p-8">
              <p className="text-gray-400">Import .md files or scripts (.py, .sh, .js)</p>
              <p className="text-sm text-gray-500 mt-2">Drag and drop or click to upload</p>
            </div>
          )}
        </div>

        {/* Start from Scratch */}
        <div className="mt-8 text-center">
          <button
            onClick={() => setStep('builder')}
            className="text-lobster-400 hover:underline"
          >
            Start from Scratch — Write workspace files manually
          </button>
        </div>
      </main>

      {/* Builder Modal */}
      {step === 'template' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-800 bg-gray-900 p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Configure Your Agent</h2>
            
            {/* Template Selected */}
            {selectedTemplate && (
              <div className="mb-6 p-4 rounded-xl bg-gray-800">
                <span className="text-sm text-gray-400">Selected: </span>
                <span className="font-semibold">{TEMPLATES.find(t => t.id === selectedTemplate)?.name}</span>
              </div>
            )}

            {/* Name */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">NAME</label>
              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="my-agent"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 focus:border-lobster-500 focus:outline-none"
              />
            </div>

            {/* Personality */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">PERSONALITY</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {PERSONALITIES.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPersonality(p.id)}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      selectedPersonality === p.id
                        ? 'border-lobster-500 bg-lobster-500/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-xs text-gray-400">{p.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">INSTRUCTIONS (optional)</label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Add any specific instructions for your agent..."
                rows={4}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 focus:border-lobster-500 focus:outline-none resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep('select')}
                className="flex-1 rounded-lg border border-gray-700 px-4 py-2 hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                className="flex-1 rounded-lg bg-lobster-500 px-4 py-2 hover:bg-lobster-400"
                disabled={!agentName.trim()}
              >
                Deploy Agent
              </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
