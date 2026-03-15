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

function MarketplaceSidebar({ userName, className = '' }: { userName: string; className?: string }) {
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
    <div className="min-h-screen bg-black text-white">
      {/* Mobile Sidebar - only show for logged in users */}
      {session && (
        <div className="md:hidden">
          <MarketplaceSidebar userName={userName} className="mb-6" />
        </div>
      )}

      <main className="px-4 sm:px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">Verified Agent Marketplace</h1>
            <p className="mt-2 sm:mt-3 text-sm sm:text-base text-gray-400">
              Gordon-Approved production agents. Zero slop. Tuned for high-performance crew operations.
            </p>
          </div>

          <div className="grid gap-4 sm:gap-5 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <article key={template.name} className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden group">
                <div className="p-4 sm:p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-blue-400 font-bold mb-1">{template.tier} TIER</p>
                      <h2 className="text-lg sm:text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{template.name}</h2>
                    </div>
                    <div className="bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                      <span className="text-xs font-mono text-gray-400">{template.brain}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-300 mb-4 leading-relaxed">{template.description}</p>
                  
                  <div className="grid gap-2 grid-cols-2 mb-4">
                    {template.skills.map((skill) => (
                      <div key={skill} className="text-xs rounded-lg border border-gray-800 px-2 py-1 text-gray-400 bg-black/50 flex items-center gap-1">
                        <div className="w-0.5 h-0.5 rounded-full bg-blue-500" />
                        {skill}
                      </div>
                    ))}
                  </div>
                  
                  <Link
                    href={session ? "/dashboard" : "/signup"}
                    className="w-full text-center rounded-lg bg-white px-3 py-2 text-sm font-medium text-black hover:bg-gray-100 transition-colors"
                  >
                    Deploy {template.name}
                  </Link>
                </div>
              </article>
            ))}
          </div>
          
          <div className="mt-8 p-5 rounded-lg bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-white/5 text-center">
            <h3 className="text-lg font-bold mb-3">Platform Integrity: The Purge</h3>
            <p className="text-sm text-gray-400">
              We have archived all legacy and unoptimized agents. The current fleet is strictly tuned for **OpenClaw Multi-tenancy** 
              and **Base Onchain Economy**. If it doesn't make you profit, it isn't here.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
