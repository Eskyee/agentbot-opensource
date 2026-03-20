'use client'

import Link from 'next/link';
import { useSession } from 'next-auth/react';

const templates = [
  {
    name: 'the-strategist',
    role: 'Mission Planning Agent',
    description: 'Advanced reasoning for complex crew operations. Plans tours, logistics, and resource allocation.',
    skills: ['Mission Planning', 'Logistics', 'Resource Analysis', 'A2A Coordination'],
    tier: 'Label',
    brain: 'DeepSeek R1'
  },
  {
    name: 'crew-manager',
    role: 'Operations & Finance Agent',
    description: 'The backbone of your collective. Manages autonomous royalty splits, talent bookings, and treasury reporting.',
    skills: ['Royalty Splits', 'Talent Booking', 'Treasury Guard', 'USDC Payments'],
    tier: 'Underground',
    brain: 'Llama 3.3'
  },
  {
    name: 'sound-system',
    role: 'Automation & Feedback Agent',
    description: 'Real-time automation for soundsystems. Monitors Mux streams, handles $RAVE gating, and fast community feedback.',
    skills: ['Mux Monitor', 'RAVE Gating', 'Fast Feedback', 'Live Traces'],
    tier: 'Free',
    brain: 'Mistral 7B'
  },
  {
    name: 'the-developer',
    role: 'Logic & Scripting Agent',
    description: 'Expert agent for building custom logic. Generates smart contracts, shell scripts, and OpenClaw skill extensions.',
    skills: ['Code Gen', 'Scripting', 'Contract Audit', 'Skill Builder'],
    tier: 'Collective',
    brain: 'Qwen 2.5'
  }
];

const musicSkills = [
  { id: 'visual-synthesizer', name: 'Visual Synthesizer', description: 'Generate release artwork and social media assets using Stable Diffusion XL.', category: 'Creative' },
  { id: 'track-archaeologist', name: 'Track Archaeologist', description: 'Deep catalog digging via BlockDB similarity search. Find tracks, clear samples.', category: 'Music' },
  { id: 'setlist-oracle', name: 'Setlist Oracle', description: 'Analyze BPM, key, and energy curves to build perfect DJ sets with Camelot mixing.', category: 'Music' },
  { id: 'groupie-manager', name: 'Groupie Manager', description: 'Fan segmentation, lifecycle tracking, and automated merch drop campaigns.', category: 'Marketing' },
  { id: 'royalty-tracker', name: 'Royalty Tracker', description: 'Track streaming royalties across Spotify, Apple Music, Beatport with automatic split calculations.', category: 'Finance' },
  { id: 'demo-submitter', name: 'Demo Submitter', description: 'Submit demos to labels via AI-curated submission system with pitch optimization.', category: 'A&R' },
];

const eventSkills = [
  { id: 'event-ticketing', name: 'Event Ticketing', description: 'Sell tickets for events with USDC payments on Base. x402 protocol enabled.', category: 'Events' },
  { id: 'event-scheduler', name: 'Event Scheduler', description: 'Schedule events across Telegram, Discord, WhatsApp, Email with recurring support.', category: 'Events' },
  { id: 'venue-finder', name: 'Venue Finder', description: 'Find and book venues worldwide. UK, Europe, US, Asia. Filter by capacity and price.', category: 'Events' },
  { id: 'festival-finder', name: 'Festival Finder', description: 'Discover festivals globally, compare lineups, get UK and Europe recommendations.', category: 'Events' },
];

export default function MarketplacePage() {
  const { data: session } = useSession()

  return (
    <main className="min-h-screen bg-black text-white selection:bg-blue-500/30 font-mono">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-32">
        <div className="max-w-2xl mb-16">
          <div className="inline-block px-3 py-1 border border-zinc-800 text-blue-500 text-[10px] uppercase tracking-widest mb-8">
            Verified Marketplace
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-[0.9]">
            Production<br />
            <span className="text-zinc-700">Agents</span>
          </h1>
          <p className="text-zinc-400 text-sm max-w-md leading-relaxed mt-8">
            Gordon-Approved production agents. Zero slop. Tuned for high-performance crew operations.
          </p>
        </div>

        {/* Agent Templates */}
        <div className="grid sm:grid-cols-2 gap-px bg-zinc-900 mb-20">
          {templates.map((template) => (
            <div key={template.name} className="bg-black p-8 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-widest text-zinc-600">{template.tier} Tier</span>
                <span className="text-[10px] uppercase tracking-widest text-zinc-700">{template.brain}</span>
              </div>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-1">{template.name}</h2>
              <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-4">{template.role}</p>
              <p className="text-xs text-zinc-500 leading-relaxed mb-6 flex-1">{template.description}</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {template.skills.map((skill) => (
                  <span key={skill} className="text-[9px] uppercase tracking-widest text-zinc-600 border border-zinc-900 px-2 py-1">
                    {skill}
                  </span>
                ))}
              </div>
              <Link
                href={session ? "/dashboard" : "/signup"}
                className="block w-full py-3 text-center text-xs font-bold uppercase tracking-widest bg-white text-black hover:bg-zinc-200 transition-colors"
              >
                Deploy
              </Link>
            </div>
          ))}
        </div>

        {/* Music Skills */}
        <div className="border-t border-zinc-900 pt-16 mb-20">
          <div className="mb-12">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Extensions</div>
            <h2 className="text-2xl font-bold tracking-tighter uppercase">
              Music<br /><span className="text-zinc-700">Skills</span>
            </h2>
            <p className="text-zinc-500 text-sm mt-4 max-w-md">
              Extend your agent with music-specific capabilities. Available on all tiers.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-900">
            {musicSkills.map((skill) => (
              <div key={skill.id} className="bg-black p-8">
                <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3">{skill.category}</div>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3">{skill.name}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed mb-6">{skill.description}</p>
                <Link
                  href={session ? "/dashboard/skills" : "/signup"}
                  className="block w-full py-2.5 text-center text-[10px] font-bold uppercase tracking-widest border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
                >
                  Enable
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Event Skills */}
        <div className="border-t border-zinc-900 pt-16">
          <div className="mb-12">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Extensions</div>
            <h2 className="text-2xl font-bold tracking-tighter uppercase">
              Event<br /><span className="text-zinc-700">Skills</span>
            </h2>
            <p className="text-zinc-500 text-sm mt-4 max-w-md">
              Full event management suite with x402 USDC payments. Global venue database.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-900">
            {eventSkills.map((skill) => (
              <div key={skill.id} className="bg-black p-8">
                <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3">{skill.category}</div>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3">{skill.name}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed mb-6">{skill.description}</p>
                <Link
                  href={session ? "/dashboard/skills" : "/signup"}
                  className="block w-full py-2.5 text-center text-[10px] font-bold uppercase tracking-widest border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
                >
                  Enable
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
