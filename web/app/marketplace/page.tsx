'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

const navItems = [
  { icon: '🤖', label: 'Agents', href: '/agents', active: false },
  { icon: '🛒', label: 'Marketplace', href: '/marketplace', active: true },
  { icon: '💳', label: 'Billing', href: '/billing', active: false },
  { icon: '⚙️', label: 'Account', href: '/settings', active: false },
]

function MarketplaceSidebar({ userName }: { userName: string }) {
  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                item.active 
                  ? 'bg-white/20 text-white' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </div>

        <Link href="/billing" className="block mt-8 p-4 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors">
          <div className="text-sm text-blue-400 mb-1">View Plans</div>
        </Link>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-medium">{userName}</div>
            <div className="text-sm text-blue-400">Sign up</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

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
  const { data: session } = useSession()
  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'Sign in'

  return (
    <div className="flex h-screen bg-black text-white">
      <div className="hidden md:block">
        <MarketplaceSidebar userName={userName} />
      </div>

      <main className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-8 max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">Verified Agent Marketplace</h1>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg text-gray-400 px-4">
              Gordon-Approved production agents. Zero slop. Tuned for high-performance crew operations.
            </p>
          </div>

          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
            {templates.map((template) => (
              <article key={template.name} className="rounded-xl sm:rounded-2xl p-4 sm:p-8 border bg-gray-900 border-gray-800 relative hover:border-white/30 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-blue-400 font-bold mb-1">{template.tier} TIER</p>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white group-hover:text-blue-400 transition-colors">{template.name}</h2>
                  </div>
                  <div className="bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                    <span className="text-[10px] font-mono text-gray-400">{template.brain}</span>
                  </div>
                </div>
                
                <p className="text-sm sm:text-base text-gray-300 mb-6 leading-relaxed">{template.description}</p>
                
                <div className="grid grid-cols-2 gap-2 mb-8">
                  {template.skills.map((skill) => (
                    <div key={skill} className="text-[11px] rounded-lg border border-gray-800 px-3 py-2 text-gray-400 bg-black/50 flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-blue-500" />
                      {skill}
                    </div>
                  ))}
                </div>

                <Link
                  href={session ? "/dashboard" : "/signup"}
                  className="block w-full text-center rounded-xl bg-white px-4 py-3 sm:py-4 text-sm sm:text-base font-bold text-black hover:bg-gray-200 transition-colors"
                >
                  Deploy {template.name}
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-12 p-8 rounded-2xl bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-white/5 text-center">
            <h3 className="text-xl font-bold mb-2">Platform Integrity: The Purge</h3>
            <p className="text-sm text-gray-400 max-w-2xl mx-auto">
              We have archived all legacy and unoptimized agents. The current fleet is strictly tuned for **OpenClaw Multi-tenancy** 
              and **Base Onchain Economy**. If it doesn't make you profit, it isn't here.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
