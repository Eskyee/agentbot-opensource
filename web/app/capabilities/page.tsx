'use client'

import { useState, useEffect } from 'react'
import { 
  MessageCircle, Key, Wallet, Zap, Link, Wrench, 
  Mail, Calendar, Shield, Fingerprint, Sparkles, Globe,
  Music, Code, Zap as Fast, CheckCircle, ArrowRight
} from 'lucide-react'

const capabilities = [
  { icon: MessageCircle, label: 'Multi-channel', desc: 'Telegram, Discord, WhatsApp', color: 'bg-blue-500' },
  { icon: Key, label: 'BYOK', desc: 'Your key, zero markup', color: 'bg-purple-500' },
  { icon: Wallet, label: 'USDC Wallets', desc: 'Built on Base', color: 'bg-green-500' },
  { icon: Zap, label: 'x402 Payments', desc: 'Autonomous micropayments', color: 'bg-yellow-500' },
  { icon: Link, label: 'A2A Bus', desc: 'Agents talk to agents', color: 'bg-pink-500' },
  { icon: Wrench, label: 'Skills', desc: 'Marketplace install', color: 'bg-orange-500' },
  { icon: Music, label: 'Personalities', desc: 'Music industry pros', color: 'bg-indigo-500' },
  { icon: Mail, label: 'Email Triage', desc: 'Filter & reply', color: 'bg-cyan-500' },
  { icon: Calendar, label: 'Calendar Guard', desc: 'Protect schedule', color: 'bg-red-500' },
  { icon: Shield, label: 'Permissions', desc: 'You approve all', color: 'bg-emerald-500' },
  { icon: Fast, label: 'Concurrent', desc: 'Parallel tools', color: 'bg-amber-500' },
  { icon: Fingerprint, label: 'Passkeys', desc: 'No passwords', color: 'bg-violet-500' },
  { icon: Sparkles, label: 'Free Trial', desc: '7 days', color: 'bg-teal-500' },
  { icon: Globe, label: 'Showcase', desc: 'Public discovery', color: 'bg-sky-500' },
  { icon: Code, label: 'Agent Bridge', desc: 'Private messaging', color: 'bg-rose-500' },
]

export default function CapabilitiesShowcase() {
  const [active, setActive] = useState(0)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setActive(prev => (prev + 1) % (showAll ? capabilities.length : 6))
    }, 800)
    return () => clearInterval(interval)
  }, [showAll])

  const visible = showAll ? capabilities : capabilities.slice(0, 6)

  return (
    <main className="min-h-screen bg-black text-white font-mono p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">
            What <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Agentbot</span> Agents Can Do
          </h1>
          <p className="text-xl text-zinc-400">15 superpowers for your AI agents</p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
          {visible.map((cap, idx) => (
            <div
              key={cap.label}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                active === idx 
                  ? 'bg-zinc-900 border-purple-500 scale-105' 
                  : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
              }`}
              onMouseEnter={() => setActive(idx)}
            >
              <div className={`w-10 h-10 rounded-lg ${cap.color} flex items-center justify-center mb-3`}>
                <cap.icon className="w-5 h-5 text-white" />
              </div>
              <div className="font-bold text-sm">{cap.label}</div>
              <div className="text-xs text-zinc-500">{cap.desc}</div>
            </div>
          ))}
        </div>

        {/* Feature Details */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-zinc-900 p-6 rounded-2xl">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <MessageCircle className="text-blue-400" />
              Multi-channel
            </h3>
            <p className="text-zinc-400 mb-4">
              One agent connects to Telegram, Discord, WhatsApp — manage all from single dashboard.
            </p>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-blue-900/30 text-blue-400 text-xs rounded">Telegram</span>
              <span className="px-2 py-1 bg-indigo-900/30 text-indigo-400 text-xs rounded">Discord</span>
              <span className="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded">WhatsApp</span>
            </div>
          </div>

          <div className="bg-zinc-900 p-6 rounded-2xl">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Wallet className="text-green-400" />
              USDC Wallets
            </h3>
            <p className="text-zinc-400 mb-4">
              Each agent gets a Coinbase CDP wallet on Base — send and receive USDC autonomously.
            </p>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded">USDC</span>
              <span className="px-2 py-1 bg-blue-900/30 text-blue-400 text-xs rounded">Base</span>
              <span className="px-2 py-1 bg-purple-900/30 text-purple-400 text-xs rounded">CDP</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mb-12">
          {[
            { num: '15', label: 'Capabilities' },
            { num: '3', label: 'Free prompts' },
            { num: '7', label: 'Day trial' },
            { num: '0', label: 'Card needed' },
          ].map(stat => (
            <div key={stat.label} className="text-center p-4 bg-zinc-900 rounded-xl">
              <div className="text-3xl font-bold text-purple-400">{stat.num}</div>
              <div className="text-xs text-zinc-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <a
            href="/playground"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold px-8 py-4 rounded-full"
          >
            Try the Playground <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </div>
    </main>
  )
}