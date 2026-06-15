'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, ExternalLink, Loader2, Rocket } from 'lucide-react'

type WizardStep = 'ready' | 'config' | 'deploy' | 'done'

const DEPLOYMENT_OPTIONS = [
  {
    id: 'vercel',
    name: 'Vercel',
    description: 'Static site. Free tier. Custom domain. Best for landing pages and portfolios.',
    time: '~30 seconds',
    tag: 'Free',
  },
  {
    id: 'gitlawb',
    name: 'GitLawb',
    description: 'Git-backed deployment. Version control. Rollbacks. Best for production apps.',
    time: '~1 minute',
    tag: 'Free',
  },
  {
    id: 'openclaw',
    name: 'OpenClaw',
    description: 'Full agent runtime. 24/7 uptime. Background jobs. Custom domain. Best for AI agents.',
    time: '~2 minutes',
    tag: 'Paid',
  },
]

export default function MigrationWizard({
  projectName,
  projectFiles,
  onDeploy,
}: {
  projectName: string
  projectFiles: Array<{ path: string; content: string }>
  onDeploy: (target: string) => Promise<void>
}) {
  const [step, setStep] = useState<WizardStep>('ready')
  const [selectedTarget, setSelectedTarget] = useState<string>('vercel')
  const [deploying, setDeploying] = useState(false)
  const [deployed, setDeployed] = useState(false)
  const [deployUrl, setDeployUrl] = useState<string | null>(null)

  const handleDeploy = async () => {
    setDeploying(true)
    try {
      await onDeploy(selectedTarget)
      setDeployed(true)
      setStep('done')
    } catch {
      // Error handled by parent
    } finally {
      setDeploying(false)
    }
  }

  return (
    <div className="border border-zinc-900 bg-black p-6">
      {/* Progress bar */}
      <div className="mb-6 flex items-center gap-2 text-[10px] uppercase tracking-widest">
        {(['ready', 'config', 'deploy', 'done'] as WizardStep[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex h-5 w-5 items-center justify-center border ${
              step === s ? 'border-orange-500 text-orange-500' :
              (['ready', 'config', 'deploy', 'done'].indexOf(step) > i ? 'border-green-500 bg-green-500 text-black' : 'border-zinc-800 text-zinc-600')
            }`}>
              {(['ready', 'config', 'deploy', 'done'].indexOf(step) > i) ? (
                <Check className="h-3 w-3" />
              ) : (
                <span>{i + 1}</span>
              )}
            </div>
            <span className={step === s ? 'text-white' : 'text-zinc-600'}>{s}</span>
            {i < 3 && <div className="w-8 h-px bg-zinc-800" />}
          </div>
        ))}
      </div>

      {step === 'ready' && (
        <div>
          <h3 className="text-lg font-bold uppercase tracking-tighter">Deploy your app</h3>
          <p className="mt-2 text-sm text-zinc-500">
            <strong className="text-white">{projectName}</strong> is ready to go live. Choose where to deploy it.
          </p>
          <div className="mt-4 flex items-center gap-3 text-[10px] text-zinc-600">
            <span>{projectFiles.length} files</span>
            <span>·</span>
            <span>Vite + React</span>
          </div>
          <button
            type="button"
            onClick={() => setStep('config')}
            className="mt-6 inline-flex items-center gap-2 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-black hover:bg-zinc-200"
          >
            Continue
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      )}

      {step === 'config' && (
        <div>
          <h3 className="text-lg font-bold uppercase tracking-tighter">Choose deployment target</h3>
          <div className="mt-4 space-y-3">
            {DEPLOYMENT_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedTarget(option.id)}
                className={`w-full border p-4 text-left transition-colors ${
                  selectedTarget === option.id
                    ? 'border-orange-500 bg-orange-500/5'
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-4 w-4 items-center justify-center border ${
                      selectedTarget === option.id ? 'border-orange-500' : 'border-zinc-700'
                    }`}>
                      {selectedTarget === option.id && <div className="h-2 w-2 bg-orange-500" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-white">{option.name}</div>
                      <div className="text-[10px] text-zinc-500">{option.description}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-zinc-600">{option.time}</div>
                    <div className={`text-[10px] uppercase tracking-widest ${
                      option.tag === 'Free' ? 'text-green-500' : 'text-orange-500'
                    }`}>{option.tag}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => setStep('ready')}
              className="border border-zinc-800 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep('deploy')}
              className="inline-flex items-center gap-2 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-black hover:bg-zinc-200"
            >
              Continue
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {step === 'deploy' && (
        <div>
          <h3 className="text-lg font-bold uppercase tracking-tighter">Ready to deploy</h3>
          <p className="mt-2 text-sm text-zinc-500">
            Deploying to <strong className="text-white">{selectedTarget}</strong>. This usually takes less than a minute.
          </p>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => setStep('config')}
              className="border border-zinc-800 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleDeploy}
              disabled={deploying}
              className="inline-flex items-center gap-2 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-black hover:bg-zinc-200 disabled:opacity-40"
            >
              {deploying ? <Loader2 className="h-3 w-3 animate-spin" /> : <Rocket className="h-3 w-3" />}
              {deploying ? 'Deploying…' : 'Deploy now'}
            </button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center border border-green-500 text-green-500">
            <Check className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-bold uppercase tracking-tighter">Deployed!</h3>
          <p className="mt-2 text-sm text-zinc-500">
            Your app is now live. {deployUrl && (
              <a href={deployUrl} target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-400 inline-flex items-center gap-1">
                View it <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/playground"
              className="border border-zinc-800 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white"
            >
              Back to Playground
            </Link>
            {deployUrl && (
              <a
                href={deployUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-black hover:bg-zinc-200"
              >
                Open app
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
