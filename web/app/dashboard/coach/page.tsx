'use client'

import { useState, useEffect } from 'react'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'
import Link from 'next/link'
import { GraduationCap, ArrowRight, CheckCircle2, Play, BookOpen, Shield, Zap, Target } from 'lucide-react'

const COACH_MODULES = [
  {
    key: 'deploy-first-agent',
    name: 'Deploy Your First Agent',
    description: 'Get an AI agent running in under 2 minutes. No code required.',
    icon: <Zap className="h-5 w-5 text-orange-500" />,
    steps: 4,
    href: '/onboard?mode=deploy',
    tag: 'ESSENTIAL'
  },
  {
    key: 'identity-verification',
    name: 'Onchain Verification',
    description: 'Link your agent to your onchain identity to prove a real human is behind it.',
    icon: <Shield className="h-5 w-5 text-orange-500" />,
    steps: 3,
    href: '/dashboard/verify',
    tag: 'TRUST'
  },
  {
    key: 'bitcoin-liquid',
    name: 'Bitcoin & Liquid Setup',
    description: 'Enable your agent to handle BTC and L-BTC. Setup watch-only or managed nodes.',
    icon: <Target className="h-5 w-5 text-yellow-400" />,
    steps: 3,
    href: '/dashboard/bitcoin',
    tag: 'FINANCE'
  },
  {
    key: 'explore-skills',
    name: 'Master Agent Skills',
    description: 'Discover superpowers — web search, file handling, crypto, and more.',
    icon: <BookOpen className="h-5 w-5 text-purple-400" />,
    steps: 5,
    href: '/dashboard/skills',
    tag: 'CAPABILITY'
  },
]

export default function CoachPage() {
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState<Record<string, any>>({})

  useEffect(() => {
    // Simulate loading progress
    setTimeout(() => setLoading(false), 800)
  }, [])

  return (
    <DashboardShell>
      <DashboardHeader
        title="Agentbot Coach"
        subtitle="Teaching the next generation of autonomous operators. Follow the factory protocol."
        action={
          <div className="flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full">
            <GraduationCap className="h-3.5 w-3.5 text-orange-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500">OPERATOR TRAINING</span>
          </div>
        }
      />

      <DashboardContent>
        <div className="grid gap-6">
          {/* Welcome Card */}
          <div className="relative overflow-hidden border border-zinc-800 bg-zinc-900/50 p-8">
            <div className="relative z-10">
              <h2 className="text-2xl font-bold tracking-tighter uppercase mb-2">Welcome to the Factory, Recruit.</h2>
              <p className="text-zinc-400 text-sm max-w-xl mb-6">
                You are now in control of high-performance autonomous infrastructure. 
                This coaching interface guides you through the essential protocols to deploy, 
                secure, and monetize your agent fleet.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link 
                  href="/onboard?mode=deploy"
                  className="bg-orange-500 text-black px-6 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-orange-400 transition-colors flex items-center gap-2"
                >
                  <Play className="h-3 w-3 fill-current" />
                  Start Training
                </Link>
                <Link 
                  href="/guide"
                  className="border border-zinc-700 text-white px-6 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors"
                >
                  Operator Guide
                </Link>
              </div>
            </div>
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 blur-3xl rounded-full -mr-20 -mt-20" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {COACH_MODULES.map((module) => (
              <div key={module.key} className="group border border-zinc-800 bg-black hover:border-zinc-700 transition-all p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 bg-zinc-900 border border-zinc-800 rounded">
                    {module.icon}
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-600 border border-zinc-800 px-2 py-0.5 rounded">
                    {module.tag}
                  </span>
                </div>
                <h3 className="text-sm font-bold uppercase tracking-tight mb-2 group-hover:text-orange-500 transition-colors">
                  {module.name}
                </h3>
                <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
                  {module.description}
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="text-[10px] text-zinc-600 uppercase tracking-widest flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3" />
                    {module.steps} steps
                  </div>
                  <Link 
                    href={module.href}
                    className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                  >
                    Enter Module
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Docs Section */}
          <div className="mt-8 border-t border-zinc-800 pt-8">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-6">Advanced Theory</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { title: 'The Fact-Based Backend', desc: 'Identity, Execution, and State.', href: '/blog/updates/factory-ai-unification' },
                { title: 'MiMo V2 Pro Logic', desc: 'Optimizing agent reasoning.', href: '/blog/updates/mimo-v2-pro-factory-master' },
                { title: 'Security Protocol', desc: 'SignatureGuard & DID auth.', href: '/documentation' },
              ].map(item => (
                <Link key={item.title} href={item.href} className="block p-4 border border-zinc-900 bg-zinc-950/50 hover:border-zinc-800 transition-colors">
                  <h4 className="text-[11px] font-bold uppercase tracking-tight text-zinc-300 mb-1">{item.title}</h4>
                  <p className="text-[10px] text-zinc-600">{item.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </DashboardContent>
    </DashboardShell>
  )
}
