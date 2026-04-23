'use client'

import { useState } from 'react'
import { Globe, Camera, MousePointer, Type, FileText, Workflow, Loader2, ExternalLink, Play, ArrowRight, Plus, Trash2 } from 'lucide-react'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'

type Action = 'navigate' | 'screenshot' | 'click' | 'type' | 'extract' | 'fill-form' | 'automate'

interface Step {
  id: string
  action: Action
  url?: string
  selector?: string
  text?: string
  label: string
}

const ACTIONS: { id: Action; label: string; icon: typeof Globe; desc: string }[] = [
  { id: 'navigate', label: 'Navigate', icon: Globe, desc: 'Go to a URL' },
  { id: 'screenshot', label: 'Screenshot', icon: Camera, desc: 'Capture page' },
  { id: 'click', label: 'Click', icon: MousePointer, desc: 'Click an element' },
  { id: 'type', label: 'Type', icon: Type, desc: 'Type into a field' },
  { id: 'extract', label: 'Extract', icon: FileText, desc: 'Get page content' },
  { id: 'fill-form', label: 'Fill Form', icon: Workflow, desc: 'Auto-fill forms' },
]

export default function BrowserAutomationPage() {
  const [steps, setSteps] = useState<Step[]>([])
  const [url, setUrl] = useState('')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [activeAction, setActiveAction] = useState<Action>('navigate')

  const addStep = () => {
    const step: Step = {
      id: crypto.randomUUID(),
      action: activeAction,
      url: url || undefined,
      label: ACTIONS.find(a => a.id === activeAction)?.label || activeAction,
    }
    setSteps(prev => [...prev, step])
  }

  const removeStep = (id: string) => {
    setSteps(prev => prev.filter(s => s.id !== id))
  }

  const runAutomation = async () => {
    if (steps.length === 0) return
    setRunning(true)
    setResult(null)

    try {
      const res = await fetch('/api/browser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'automate',
          steps: steps.map(s => ({ action: s.action, url: s.url, selector: s.selector, text: s.text })),
        }),
      })
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ error: 'Failed to run automation' })
    } finally {
      setRunning(false)
    }
  }

  const runSingle = async (action: Action) => {
    if (!url && action !== 'extract') return
    setRunning(true)
    setResult(null)

    try {
      const res = await fetch('/api/browser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, url }),
      })
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ error: 'Failed to run action' })
    } finally {
      setRunning(false)
    }
  }

  return (
    <DashboardShell>
      <DashboardHeader
        title="Browser Automation"
        icon={<Globe className="h-5 w-5 text-orange-400" />}
        count={steps.length}
        action={
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-yellow-400 bg-yellow-900/20 border border-yellow-800 rounded px-2 py-0.5 font-mono">
              BETA
            </span>
          </div>
        }
      />

      <DashboardContent className="max-w-5xl space-y-8">
        {/* URL Input */}
        <div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2 font-bold">Target URL</div>
          <div className="flex gap-3">
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="flex-1 bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm text-white font-mono placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600"
            />
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-3 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3 font-bold">Quick Actions</div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {ACTIONS.map(({ id, label, icon: Icon, desc }) => (
              <button
                key={id}
                onClick={() => { setActiveAction(id); runSingle(id) }}
                disabled={running || (!url && id !== 'extract')}
                className="flex flex-col items-center gap-2 p-3 border border-zinc-800 bg-zinc-950 hover:border-zinc-600 disabled:opacity-30 transition-colors"
              >
                <Icon className="h-5 w-5 text-zinc-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</span>
                <span className="text-[9px] text-zinc-600">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Workflow Builder */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">Workflow Builder</div>
            <button
              onClick={addStep}
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
            >
              <Plus className="h-3 w-3" />
              Add Step
            </button>
          </div>

          {steps.length === 0 ? (
            <div className="border border-zinc-800 bg-zinc-950 p-8 text-center">
              <Workflow className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-600 font-mono">No workflow steps</p>
              <p className="text-[10px] text-zinc-700 font-mono mt-1">
                Add steps to build a multi-step browser automation workflow
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {steps.map((step, i) => (
                <div key={step.id} className="flex items-center gap-3 border border-zinc-800 bg-zinc-950 p-3">
                  <div className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white">{step.label}</div>
                    {step.url && (
                      <div className="text-[10px] text-zinc-500 font-mono truncate">{step.url}</div>
                    )}
                  </div>
                  {i < steps.length - 1 && <ArrowRight className="h-3 w-3 text-zinc-700 flex-shrink-0" />}
                  <button
                    onClick={() => removeStep(step.id)}
                    className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={runAutomation}
                disabled={running}
                className="flex items-center gap-2 w-full justify-center px-5 py-3 bg-orange-600/10 border border-orange-500/30 text-orange-400 text-sm font-bold hover:bg-orange-600/20 disabled:opacity-30 transition-colors"
              >
                {running ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Run Workflow ({steps.length} steps)
              </button>
            </div>
          )}
        </div>

        {/* Result */}
        {result && (
          <div className="border border-zinc-800 bg-zinc-950 p-5">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2 font-bold">Result</div>
            <pre className="text-xs text-zinc-400 font-mono whitespace-pre-wrap bg-zinc-900 p-3 rounded overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        {/* Info */}
        <div className="border border-zinc-800 bg-zinc-950/50 p-4 text-center">
          <p className="text-[10px] text-zinc-500 font-mono">
            🌐 Browser automation is in beta. Connect a Playwright instance for full headless browsing,
            form filling, and multi-step web workflows. Works where APIs don&apos;t.
          </p>
        </div>
      </DashboardContent>
    </DashboardShell>
  )
}
