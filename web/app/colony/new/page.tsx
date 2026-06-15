'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import Link from 'next/link'

const TEMPLATES = [
  {
    id: 'alpha-terminal',
    name: 'Alpha Terminal',
    description: 'Research, analyse, and broadcast. Tracks markets and posts live updates.',
    agents: ['Manager', 'Researcher', 'Executor'],
  },
  {
    id: 'support-ops',
    name: 'Support Ops',
    description: 'Triage, respond, escalate. Handles inbound queries autonomously.',
    agents: ['Triager', 'Responder', 'Escalator'],
  },
  {
    id: 'content-studio',
    name: 'Content Studio',
    description: 'Research, write, and review. Produces branded content at scale.',
    agents: ['Researcher', 'Writer', 'Editor'],
  },
]

function NewColonyForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultTemplate = searchParams.get('template') ?? 'alpha-terminal'

  const [template, setTemplate] = useState(defaultTemplate)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedTemplate = TEMPLATES.find((t) => t.id === template) ?? TEMPLATES[0]

  async function handleDeploy() {
    if (!name.trim()) { setError('Colony name is required'); return }
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/colony/starter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template, name: name.trim() }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Deploy failed'); setLoading(false); return }
      router.push(`/colony/${json.colonyId}`)
    } catch {
      setError('Unexpected error. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-2xl px-4 py-12">

        <div className="flex items-center gap-2 mb-8 text-[10px] font-mono uppercase tracking-widest text-zinc-600">
          <Link href="/colony" className="hover:text-zinc-400 transition-colors">Colony</Link>
          <span>/</span>
          <span className="text-zinc-500">New</span>
        </div>

        <h1 className="text-3xl font-bold uppercase tracking-tighter text-white mb-2">Deploy starter colony</h1>
        <p className="text-sm text-zinc-500 mb-8">Three agents. One mission. Live in 60 seconds.</p>

        {/* Template selector */}
        <div className="mb-6">
          <label className="block text-[10px] uppercase tracking-widest text-zinc-600 mb-3 font-mono">Template</label>
          <div className="grid gap-3">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTemplate(t.id)}
                className={`text-left border p-4 transition-colors ${
                  template === t.id
                    ? 'border-amber-600 bg-zinc-900'
                    : 'border-zinc-800 bg-zinc-950 hover:border-zinc-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold uppercase tracking-widest ${template === t.id ? 'text-amber-400' : 'text-zinc-300'}`}>
                    {t.name}
                  </span>
                  {template === t.id && (
                    <span className="text-[10px] text-amber-500 uppercase tracking-widest font-mono">Selected</span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed mb-2">{t.description}</p>
                <div className="flex gap-1">
                  {t.agents.map((a) => (
                    <span key={a} className="border border-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-widest text-zinc-600 font-mono">
                      {a}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Name input */}
        <div className="mb-6">
          <label className="block text-[10px] uppercase tracking-widest text-zinc-600 mb-2 font-mono">Colony name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`My ${selectedTemplate.name}`}
            className="w-full bg-zinc-950 border border-zinc-800 text-white text-sm font-mono px-4 py-3 focus:outline-none focus:border-amber-600 placeholder-zinc-700"
          />
        </div>

        {error && (
          <div className="border border-red-800 bg-red-950/20 px-4 py-3 text-xs text-red-400 font-mono mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleDeploy}
          disabled={loading}
          className="w-full bg-white text-black px-6 py-4 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors disabled:opacity-40"
        >
          {loading ? 'Deploying…' : 'Deploy in 60 seconds'}
        </button>

        <p className="text-[10px] text-zinc-700 font-mono text-center mt-4 uppercase tracking-widest">
          Full provisioning, real agents, live immediately
        </p>
      </div>
    </div>
  )
}

export default function NewColonyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <NewColonyForm />
    </Suspense>
  )
}
