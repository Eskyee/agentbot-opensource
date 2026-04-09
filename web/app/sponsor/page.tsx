'use client'

import { Heart, Coffee, Pizza, Code, Rocket, Building, Star, ExternalLink, Check, Bitcoin } from 'lucide-react'
import Link from 'next/link'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'

const tiers = [
  {
    price: '$10',
    name: 'Coffee ☕',
    desc: 'Fuel for late-night coding sessions. Keeps the coffee flowing & bugs squashed!',
    icon: Coffee,
    color: 'yellow',
  },
  {
    price: '$25',
    name: 'Pizza 🍕',
    desc: 'A slice for the road. Powers bug fixes & new features for agentbot users!',
    icon: Pizza,
    color: 'orange',
  },
  {
    price: '$50',
    name: 'Dev Tools 💻',
    desc: 'Covers dev tools, books & Vercel costs. More coding = more features shipped!',
    icon: Code,
    color: 'blue',
  },
  {
    price: '$75',
    name: 'Early Access ⭐',
    desc: 'Access to beta features before release. Be the first to try new stuff!',
    icon: Star,
    color: 'purple',
  },
  {
    price: '$100',
    name: 'Logo 🏢',
    desc: 'Your logo on agentbot.sh footer. Get visibility with every visitor!',
    icon: Building,
    color: 'green',
  },
  {
    price: '$200',
    name: 'Social 🚀',
    desc: 'Shoutout on @Eskyee Twitter. Share your brand with the community!',
    icon: Rocket,
    color: 'pink',
  },
]

export default function SponsorPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        title="Sponsor Agentbot"
        icon={<Heart className="h-5 w-5 text-pink-400" />}
      />

      <DashboardContent>
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">Support Open Source Development</h2>
            <p className="text-zinc-400 max-w-xl mx-auto">
              Your sponsorship helps me build the future of AI agents. Every dollar goes directly to infrastructure costs, 
              development time, and keeping agentbot running 24/7.
            </p>
            <div className="mt-4 text-green-400 font-bold">
              🎯 Goal: 5 monthly sponsors ($500/mo)
            </div>
          </div>

          {/* Payment Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            {/* GitHub Sponsors */}
            <a
              href="https://github.com/sponsors/Eskyee"
              target="_blank"
              rel="noopener"
              className="border border-zinc-800 bg-zinc-900/50 p-6 hover:border-purple-600 transition-all text-center"
            >
              <Heart className="h-8 w-8 text-pink-400 mx-auto mb-3" />
              <h3 className="text-white font-bold mb-2">GitHub Sponsors</h3>
              <p className="text-zinc-500 text-xs">Recurring monthly</p>
            </a>

            {/* Self-Hosted - Run your own */}
            <a
              href="https://github.com/Eskyee/agentbot-opensource"
              target="_blank"
              rel="noopener"
              className="border border-zinc-800 bg-zinc-900/50 p-6 hover:border-green-600 transition-all text-center"
            >
              <Code className="h-8 w-8 text-green-400 mx-auto mb-3" />
              <h3 className="text-white font-bold mb-2">Self-Hosted</h3>
              <p className="text-zinc-500 text-xs">Run your own instance</p>
            </a>

            {/* Bitcoin */}
            <a
              href="#bitcoin"
              className="border border-zinc-800 bg-zinc-900/50 p-6 hover:border-orange-600 transition-all text-center"
              onClick={(e) => {
                e.preventDefault()
                document.getElementById('bitcoin-section')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              <Bitcoin className="h-8 w-8 text-orange-400 mx-auto mb-3" />
              <h3 className="text-white font-bold mb-2">Bitcoin</h3>
              <p className="text-zinc-500 text-xs">On-chain or Lightning</p>
            </a>
          </div>

          {/* Self-Hosted Callout */}
          <div className="border border-green-900 bg-green-900/20 p-6 mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Check className="h-6 w-6 text-green-400" />
              <h3 className="text-white font-bold text-lg">Self-Hosted is the Only Way</h3>
            </div>
            <p className="text-zinc-400 text-sm mb-4">
              Agentbot is open source for a reason. We believe in self-hosted, permissionless infrastructure. 
              Run your own instance, own your data, control your agents.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="https://github.com/Eskyee/agentbot-opensource"
                target="_blank"
                rel="noopener"
                className="bg-green-600 hover:bg-green-500 text-white font-bold text-sm px-6 py-3"
              >
                View on GitHub →
              </a>
              <a
                href="/docs/self-host"
                className="border border-green-700 hover:border-green-600 text-green-400 font-bold text-sm px-6 py-3"
              >
                Self-Host Guide
              </a>
            </div>
          </div>

          {/* Blockstream Green Integration */}
          <div className="border border-orange-900 bg-orange-900/20 p-6 mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Bitcoin className="h-6 w-6 text-orange-400" />
              <h3 className="text-white font-bold text-lg">Use Your Blockstream Green Wallet</h3>
            </div>
            <p className="text-zinc-400 text-sm mb-4">
              Connect your Blockstream Green wallet (GreenAddress) to agentbot for BTC/Liquid operations. 
              Your keys, your bitcoin - non-custodial. Hardware wallet compatible (Jade).
            </p>
            <div className="bg-black p-4 border border-zinc-800">
              <p className="text-zinc-500 text-xs mb-2">Integration via Blockstream GDK (Green Development Kit)</p>
              <ul className="text-zinc-400 text-xs space-y-1">
                <li>• Send/receive BTC on-chain</li>
                <li>• Liquid assets support (L-BTC, USDt)</li>
                <li>• Lightning via Greenlight (non-custodial)</li>
                <li>• Hardware wallet support (Jade, Ledger, Trezor)</li>
              </ul>
            </div>
            <p className="text-zinc-500 text-xs mt-4">
              📧 Ask about early access: esky33@proton.me
            </p>
          </div>

          {/* Liquid Node Future */}
          <div className="border border-purple-900 bg-purple-900/20 p-6 mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Check className="h-6 w-6 text-purple-400" />
              <h3 className="text-white font-bold text-lg">Future: Liquid Node for Users</h3>
            </div>
            <p className="text-zinc-400 text-sm mb-4">
              Running a pruned Liquid node for agentbot users. Benefits:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-black p-3 border border-zinc-800">
                <span className="text-purple-400 font-bold">⚡ Faster Blocks</span>
                <p className="text-zinc-500 mt-1">1-minute block times on Liquid</p>
              </div>
              <div className="bg-black p-3 border border-zinc-800">
                <span className="text-purple-400 font-bold">⚡ Lightning</span>
                <p className="text-zinc-500 mt-1">Native Lightning for instant payments</p>
              </div>
              <div className="bg-black p-3 border border-zinc-800">
                <span className="text-purple-400 font-bold">⚡ Assets</span>
                <p className="text-zinc-500 mt-1">Issue & transfer Liquid assets</p>
              </div>
            </div>
            <p className="text-zinc-500 text-xs mt-4">
              🚀 Coming when we scale - need 500+ sponsors to fund the node infrastructure
            </p>
          </div>

          {/* Bitcoin Section */}
          <div id="bitcoin-section" className="border border-orange-900 bg-orange-900/20 p-6 mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Bitcoin className="h-6 w-6 text-orange-400" />
              <h3 className="text-white font-bold text-lg">Bitcoin Donations</h3>
            </div>
            <p className="text-zinc-400 text-sm mb-4">
              Send Bitcoin (on-chain or Lightning) to support agentbot development.
            </p>
            <div className="bg-black p-4 border border-zinc-800">
              <p className="text-zinc-500 text-xs uppercase mb-2">On-chain BTC</p>
              <code className="text-orange-400 text-sm break-all">bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh</code>
            </div>
            <div className="mt-4 bg-black p-4 border border-zinc-800">
              <p className="text-zinc-500 text-xs uppercase mb-2">Lightning (LNURL)</p>
              <code className="text-orange-400 text-sm break-all">LNURL1DP68GURN8GHJ7MR9VAJKUEPWD9XZ7PHVEFNVEMN6RPJCMN8DDKGDR3A8K6T</code>
            </div>
            <p className="text-zinc-500 text-xs mt-4">
              ⚡ For larger amounts, ask for an invoice via esky33@proton.me
            </p>
          </div>


          <div className="flex justify-center mb-12">
            <a
              href="https://github.com/sponsors/Eskyee"
              target="_blank"
              rel="noopener"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-lg px-8 py-4 transition-all transform hover:scale-105"
            >
              Sponsor on GitHub Sponsors →
            </a>
          </div>

          {/* Tiers */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {tiers.map((tier) => (
              <a
                key={tier.price}
                href="https://github.com/sponsors/Eskyee"
                target="_blank"
                rel="noopener"
                className="border border-zinc-800 bg-zinc-900/50 p-6 hover:border-zinc-700 transition-all hover:transform hover:-translate-y-1"
              >
                <div className="flex items-center gap-3 mb-3">
                  <tier.icon className={`h-6 w-6 text-${tier.color}-400`} />
                  <span className="text-white font-bold text-lg">{tier.price}/mo</span>
                </div>
                <h3 className="text-white font-bold mb-2">{tier.name}</h3>
                <p className="text-zinc-400 text-sm">{tier.desc}</p>
              </a>
            ))}
          </div>

          {/* What you get */}
          <div className="border border-zinc-800 bg-zinc-900/30 p-6 mb-12">
            <h3 className="text-white font-bold text-lg mb-4">What your sponsorship enables:</h3>
            <ul className="space-y-3">
              {[
                'Ship more AI agent features for the community',
                'Cover infrastructure costs ($500/mo target)',
                'Build deeper Bitcoin + Base tooling',
                'Keep independent FOSS development alive',
                'Support 24/7 agentbot operation',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-zinc-400">
                  <Check className="h-4 w-4 text-green-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Links */}
          <div className="text-center text-zinc-500 text-sm">
            <p>Questions? Email esky33@proton.me</p>
            <div className="flex justify-center gap-4 mt-4">
              <a href="https://github.com/Eskyee/agentbot" target="_blank" rel="noopener" className="flex items-center gap-1 hover:text-white">
                <ExternalLink className="h-3 w-3" /> GitHub
              </a>
              <Link href="/jobs" className="hover:text-white">Jobs Board</Link>
              <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
            </div>
          </div>
        </div>
      </DashboardContent>
    </DashboardShell>
  )
}