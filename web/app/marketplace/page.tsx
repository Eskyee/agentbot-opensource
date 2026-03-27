'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCustomSession } from '@/app/lib/useCustomSession';

// THE PURGE: Gordon-Approved Official Fleet
const templates = [
  {
    name: 'the-strategist',
    role: 'Mission Planning Agent',
    description: 'Advanced reasoning for complex crew operations. Powered by DeepSeek R1. Plans tours, logistics, and resource allocation.',
    skills: ['Mission Planning', 'Logistics', 'Resource Analysis', 'A2A Coordination'],
    popular: true,
    tier: 'Label',
    brain: 'DeepSeek R1'
  },
  {
    name: 'crew-manager',
    role: 'Operations & Finance Agent',
    description: 'The backbone of your collective. Manages autonomous royalty splits, talent bookings, and treasury reporting.',
    skills: ['Royalty Splits', 'Talent Booking', 'Treasury Guard', 'USDC Payments'],
    popular: true,
    tier: 'Underground',
    brain: 'Llama 3.3'
  },
  {
    name: 'sound-system',
    role: 'Automation & Feedback Agent',
    description: 'Real-time automation for soundsystems. Monitors Mux streams, handles $RAVE gating, and fast community feedback.',
    skills: ['Mux Monitor', 'RAVE Gating', 'Fast Feedback', 'Live Traces'],
    popular: true,
    tier: 'Free',
    brain: 'Mistral 7B'
  },
  {
    name: 'the-developer',
    role: 'Logic & Scripting Agent',
    description: 'Expert agent for building custom logic. Generates smart contracts, shell scripts, and OpenClaw skill extensions.',
    skills: ['Code Gen', 'Scripting', 'Contract Audit', 'Skill Builder'],
    popular: false,
    tier: 'Collective',
    brain: 'Qwen 2.5'
  }
];

const channels = ['Telegram', 'Discord', 'WhatsApp'];

export default function MarketplacePage() {
  const { data: session } = useCustomSession()
  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'Sign in'

  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-16 space-y-6">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 block">Verified Fleet</span>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter uppercase leading-none">
            Agent <span className="text-zinc-700">Marketplace</span>
          </h1>

          <p className="text-zinc-400 text-sm max-w-xl leading-relaxed">
            Gordon-Approved production agents. Zero slop. Tuned for high-performance crew operations.
          </p>
        </div>

        {/* Agent Grid */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
          {templates.map((template) => (
            <article key={template.name} className="border border-zinc-800 bg-black p-5 hover:bg-zinc-950 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-2">{template.tier} Tier</span>
                  <h2 className="text-xl font-bold text-white uppercase tracking-tight">{template.name}</h2>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1">{template.role}</p>
                </div>
                <div className="border border-zinc-800 px-3 py-1">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">{template.brain}</span>
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-4 mb-4">
                <p className="text-sm text-zinc-400 leading-relaxed">{template.description}</p>
              </div>

              <div className="grid gap-2 grid-cols-2 mb-6">
                {template.skills.map((skill) => (
                  <div key={skill} className="text-[10px] uppercase tracking-widest border border-zinc-800 px-3 py-1.5 text-zinc-500">
                    {skill}
                  </div>
                ))}
              </div>

              <Link
                href={session ? "/dashboard" : "/signup"}
                className="block w-full text-left bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors text-center"
              >
                Deploy {template.name}
              </Link>
            </article>
          ))}
        </div>

        {/* Platform Note */}
        <div className="mt-16 pt-8 border-t border-zinc-800">
          <div className="max-w-2xl">
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-4">Platform Integrity</span>
            <h3 className="text-lg font-bold uppercase tracking-tight mb-3">The Purge</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              We have archived all legacy and unoptimized agents. The current fleet is strictly tuned for <strong className="text-zinc-300">OpenClaw Multi-tenancy</strong> and <strong className="text-zinc-300">Base Onchain Economy</strong>. If it doesn&apos;t make you profit, it isn&apos;t here.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-32 pt-12 border-t border-zinc-800 flex flex-col md:flex-row justify-between gap-8">
          <div className="text-zinc-700 text-[10px] uppercase tracking-[0.2em]">
            Agentbot Marketplace
          </div>
          <div className="flex gap-8 text-zinc-500 text-[10px] uppercase tracking-widest">
            <Link href="/agents" className="hover:text-white transition-colors">Agent Builder</Link>
            <Link href="/token" className="hover:text-white transition-colors">Token</Link>
            <Link href="/partner" className="hover:text-white transition-colors">Partner</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
