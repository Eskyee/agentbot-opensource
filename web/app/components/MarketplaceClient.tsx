'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCustomSession } from '@/app/lib/useCustomSession'
import dynamic from 'next/dynamic'

const DeployModal = dynamic(() => import('@/app/components/DeployModal').then(m => ({ default: m.DeployModal })), { ssr: false })

type Template = {
  name: string; role: string; description: string; skills: string[]; tier: string; brain: string
}

export function MarketplaceClient({ templates }: { templates: Template[] }) {
  const { data: session } = useCustomSession()
  const router = useRouter()
  const [deployingTemplate, setDeployingTemplate] = useState<Template | null>(null)
  const [successName, setSuccessName] = useState('')

  const handleDeployClick = (template: Template) => {
    if (!session) { router.push('/signup'); return }
    setDeployingTemplate(template)
  }

  const handleDeployed = (_agentId: string, agentName: string) => {
    setDeployingTemplate(null)
    setSuccessName(agentName)
    setTimeout(() => router.push('/dashboard'), 1800)
  }

  return (
    <>
      {successName && (
        <div className="mb-8 border border-green-500/30 bg-green-500/10 px-5 py-3 flex items-center gap-3">
          <span className="text-green-400 text-xs font-mono">✓</span>
          <span className="text-green-400 text-xs uppercase tracking-widest font-bold">{successName} deployed — redirecting...</span>
        </div>
      )}

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
        {templates.map((template) => (
          <article key={template.name} className="border border-zinc-800 bg-black p-5 hover:bg-zinc-950 transition-colors">
            <div className="flex justify-between items-start mb-4 gap-3">
              <div className="min-w-0">
                <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-2">{template.tier} Tier</span>
                <h2 className="text-lg sm:text-xl font-bold text-white uppercase tracking-tight truncate">{template.name}</h2>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1">{template.role}</p>
              </div>
              <div className="border border-zinc-800 px-3 py-1 shrink-0">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">{template.brain}</span>
              </div>
            </div>
            <div className="border-t border-zinc-800 pt-4 mb-4">
              <p className="text-sm text-zinc-400 leading-relaxed">{template.description}</p>
            </div>
            <div className="grid gap-2 grid-cols-2 mb-5">
              {template.skills.map((skill) => (
                <div key={skill} className="text-[10px] uppercase tracking-widest border border-zinc-800 px-3 py-1.5 text-zinc-500">{skill}</div>
              ))}
            </div>
            <button onClick={() => handleDeployClick(template)} className="block w-full text-left bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors text-center">
              Deploy {template.name}
            </button>
          </article>
        ))}
      </div>

      {deployingTemplate && (
        <DeployModal template={deployingTemplate} onClose={() => setDeployingTemplate(null)} onDeployed={handleDeployed} />
      )}
    </>
  )
}
