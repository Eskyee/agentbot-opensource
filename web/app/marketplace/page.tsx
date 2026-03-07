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

const templates = [
  {
    name: 'rave-event',
    role: 'Rave Event Agent',
    description: 'Manage underground events end-to-end. Guest lists, ticket sales in USDC, ride coordination, and door check-ins.',
    skills: ['Guest List', 'USDC Tickets', 'Ride Share', 'Check-in', 'Event Stats'],
    popular: true,
    new: true
  },
  {
    name: 'community-treasury',
    role: 'Community Treasury Agent',
    description: 'Transparent fund management for collectives. Track spending, process reimbursements, budget alerts.',
    skills: ['Treasury Track', 'Reimburse', 'Budget Alert', 'Financial Report', 'Multi-sig'],
    popular: true,
    new: true
  },
  {
    name: 'basefmbot',
    role: 'Onchain Radio Agent',
    description: 'Deep basefm.space knowledge. Grows underground communities organically. Bridges humans and AI agents onchain.',
    skills: ['BaseFM Know', 'Community Grow', 'Onchain Radio', 'Raveculture', 'Human+Agent Net', 'DJ Streaming'],
    popular: true
  },
  {
    name: 'chain',
    role: 'Crypto Wallet Agent',
    description: 'AI agent with crypto wallet. Send USDC, check balances, swap tokens on Base. Gasless transfers.',
    skills: ['Wallet Create', 'USDC Transfer', 'Token Swap', 'Balance Check', 'Gasless'],
    popular: true
  },
  {
    name: 'studio-one',
    role: 'Dancehall Dub Agent',
    description: 'London roots and dub culture specialist. Champion selector with deep knowledge of Jamdown and sound system culture.',
    skills: ['Champion Selector', 'Crate Dig Dub', 'Sound System', 'Dancehall Mix', 'Roots Culture'],
    popular: false
  },
  {
    name: 'clawdbotdj',
    role: 'Underground DJ Agent',
    description: 'Deep crate digger with underground music knowledge. Finds rare tracks and creates seamless mixes.',
    skills: ['Crate Dig', 'Mix Sync', 'Track ID', 'Underground Find', 'B2B Flow'],
    popular: false
  },
  {
    name: 'cafe',
    role: 'Startup Cafe Agent',
    description: 'Like having a Starbucks barista for your startup. Customer service, product knowledge, and warm recommendations.',
    skills: ['Customer Service', 'Product Knowledge', 'Recommend', 'Order Handle', 'Loyalty Build'],
    popular: false
  },
  {
    name: 'studio',
    role: 'Senior Studio Engineer',
    description: 'Professional audio engineer. Mixes, masters, and produces studio-quality tracks.',
    skills: ['Audio Mix', 'Mastering', 'Sound Design', 'Beat Make', 'Studio Setup'],
    popular: false
  },
  {
    name: 'vault',
    role: 'DeFi Agent',
    description: 'Automated DeFi operations. Yield farming, staking, and portfolio management.',
    skills: ['Yield Farm', 'Stake Tokens', 'Portfolio Track', 'Price Alert'],
    popular: false
  },
  {
    name: 'pay',
    role: 'Commerce Agent',
    description: 'Accept crypto payments, manage subscriptions, and handle refunds.',
    skills: ['Payment Link', 'Invoice Gen', 'Sub Manage', 'Refund Process'],
    popular: false
  }
];

const channels = ['Telegram', 'Discord', 'WhatsApp'];

export default function MarketplacePage() {
  const { data: session } = useSession()
  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'Sign in'

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Hide sidebar on mobile */}
      <div className="hidden md:block">
        <MarketplaceSidebar userName={userName} />
      </div>

      <main className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-8 max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">Agent Marketplace</h1>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg text-gray-400 px-4">
              Choose a template, install skills, and deploy your OpenClaw agent in under a minute.
            </p>
          </div>

          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <article key={template.name} className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 border ${template.popular ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-white/30' : 'bg-gray-900 border-gray-800'} relative`}>
                {template.popular && (
                  <span className="absolute -top-2 sm:-top-3 left-3 sm:left-4 bg-white text-black text-xs font-bold px-2 sm:px-3 py-1 rounded-full">
                    AGENTKIT
                  </span>
                )}
                {template.new && (
                  <span className="absolute -top-2 sm:-top-3 right-3 sm:right-4 bg-green-500 text-black text-xs font-bold px-2 sm:px-3 py-1 rounded-full">
                    NEW
                  </span>
                )}
                <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">Template</p>
                <h2 className="text-xl sm:text-2xl font-bold text-white">{template.name}</h2>
                <p className="text-sm sm:text-base text-gray-300 mb-2">{template.role}</p>
                <p className="text-gray-400 text-xs sm:text-sm mb-4">{template.description}</p>
                <div className="space-y-2 mb-4 sm:mb-6">
                  {template.skills.map((skill) => (
                    <div key={skill} className="text-xs sm:text-sm rounded-lg border border-gray-700 px-2 sm:px-3 py-1.5 sm:py-2 text-gray-200 bg-gray-800">
                      {skill}
                    </div>
                  ))}
                </div>
                <Link
                  href={session ? "/dashboard" : "/signup"}
                  className="block w-full text-center rounded-lg bg-gray-900 px-4 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-white hover:bg-gray-700 transition-colors"
                >
                  Use {template.name}
                </Link>
              </article>
            ))}
          </div>

          {/* Create Custom Agent */}
          <div className="mt-8 sm:mt-12">
            <div className="rounded-xl sm:rounded-2xl border-2 border-dashed border-gray-700 bg-gray-900/30 p-6 sm:p-8 text-center">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">✨</div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2">Create Custom Agent</h3>
              <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6 max-w-md mx-auto px-4">
                Build your own OpenClaw agent with custom skills. Add your knowledge, 
                define capabilities, and publish to the marketplace.
              </p>
              <Link
                href={session ? "/dashboard?create=agent" : "/signup"}
                className="inline-flex items-center gap-2 rounded-lg bg-white text-black px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold hover:bg-gray-200 transition-colors"
              >
                <span>+</span>
                {session ? 'Create Agent' : 'Sign Up to Create'}
              </Link>
              <p className="text-xs text-gray-500 mt-3 sm:mt-4">
                OpenClaw compatible • Custom skills • Marketplace publish
              </p>
            </div>
          </div>

          <div className="mt-6 sm:mt-10 grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
            <div className="rounded-xl sm:rounded-2xl border border-gray-800 bg-gray-900/50 p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold mb-3">Available channels</h3>
              <div className="flex flex-wrap gap-2">
                {channels.map((channel) => (
                  <span key={channel} className="rounded-full border border-gray-700 px-3 py-1 text-xs sm:text-sm text-gray-300">
                    {channel}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-xl sm:rounded-2xl border border-gray-800 bg-gradient-to-br from-blue-900/30 to-purple-900/30 p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold mb-3 flex items-center gap-2">
                <span>🔗</span> Coinbase AgentKit
              </h3>
              <p className="text-gray-400 text-xs sm:text-sm mb-4">
                Deploy agents with crypto wallets. Powered by Coinbase CDP - send USDC, 
                check balances, swap tokens, and more. Zero-fee onchain payments.
              </p>
              <Link href={session ? "/dashboard" : "/signup"} className="text-sm sm:text-base text-white hover:underline font-semibold">
                Deploy crypto agent →
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
