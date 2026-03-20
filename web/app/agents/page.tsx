'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const musicTemplates = [
  {
    id: 'dj-manager',
    name: 'DJ Manager',
    description: 'Full-stack DJ management agent. Handles bookings, set planning, and fan engagement across Telegram and WhatsApp.',
    skills: ['Setlist Oracle', 'Booking Agent', 'Fan Engagement', 'Royalty Tracker'],
    brain: 'DeepSeek R1',
    tier: 'Collective',
  },
  {
    id: 'producer-assistant',
    name: 'Producer Assistant',
    description: 'Your studio partner. Tracks samples, manages demo submissions, handles split sheets and collaborator coordination.',
    skills: ['Track Archaeologist', 'Demo Submitter', 'Royalty Tracker', 'Visual Synthesizer'],
    brain: 'Llama 3.3',
    tier: 'Underground',
  },
  {
    id: 'booking-agent',
    name: 'Booking Agent',
    description: 'Autonomous booking agent. Finds venues, negotiates rates, manages calendar, and handles rider requirements.',
    skills: ['Venue Finder', 'Event Scheduler', 'Festival Finder', 'USDC Payments'],
    brain: 'DeepSeek R1',
    tier: 'Label',
  },
  {
    id: 'ar-scout',
    name: 'A&R Scout',
    description: 'Discovers emerging talent via streaming data and social signals. Monitors SoundCloud, Bandcamp, and club playlists.',
    skills: ['Track Archaeologist', 'Groupie Manager', 'Demo Submitter', 'Web Search'],
    brain: 'Qwen 2.5',
    tier: 'Collective',
  },
  {
    id: 'promo-engine',
    name: 'Promo Engine',
    description: 'Handles release campaigns, social media scheduling, playlist pitching, and press kit distribution.',
    skills: ['Visual Synthesizer', 'Groupie Manager', 'Event Scheduler', 'Web Search'],
    brain: 'Mistral 7B',
    tier: 'Underground',
  },
  {
    id: 'label-ops',
    name: 'Label Operations',
    description: 'Complete label back-office. Manages roster, coordinates releases, tracks royalties, handles contracts.',
    skills: ['Royalty Tracker', 'Demo Submitter', 'USDC Payments', 'Event Ticketing'],
    brain: 'DeepSeek R1',
    tier: 'Label',
  },
]

export default function AgentsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [deploying, setDeploying] = useState(false)

  const handleDeploy = async (templateId: string) => {
    if (!session) {
      router.push('/signup')
      return
    }
    setDeploying(true)
    setSelectedTemplate(templateId)
    setTimeout(() => {
      router.push(`/onboard?template=${templateId}`)
    }, 500)
  }

  return (
    <main className="min-h-screen bg-black text-white selection:bg-blue-500/30 font-mono">
      <section className="max-w-7xl mx-auto px-6 py-32">
        <div className="max-w-2xl mb-16">
          <div className="inline-block px-3 py-1 border border-zinc-800 text-blue-500 text-[10px] uppercase tracking-widest mb-8">
            Agent Templates
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-[0.9]">
            Deploy<br />
            <span className="text-zinc-700">In 60 Seconds</span>
          </h1>
          <p className="text-zinc-400 text-sm max-w-md leading-relaxed mt-8">
            Pre-configured agents for the music industry. Skills, personality, and workflows ready to go.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-900">
          {musicTemplates.map((template) => (
            <div key={template.id} className="bg-black p-8 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500">{template.name}</span>
                <span className="text-[9px] uppercase tracking-widest text-zinc-600">{template.tier}</span>
              </div>

              <p className="text-xs text-zinc-500 leading-relaxed mb-6 flex-1">{template.description}</p>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {template.skills.map((skill) => (
                    <span key={skill} className="text-[9px] uppercase tracking-widest text-zinc-600 border border-zinc-900 px-2 py-1">
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="text-[10px] text-zinc-700 uppercase tracking-widest">
                  {template.brain}
                </div>

                <button
                  onClick={() => handleDeploy(template.id)}
                  disabled={deploying && selectedTemplate === template.id}
                  className="w-full bg-white text-black py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors disabled:opacity-50"
                >
                  {deploying && selectedTemplate === template.id ? 'Deploying...' : 'Deploy'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 border-t border-zinc-900 pt-16">
          <div className="flex flex-col md:flex-row gap-16 items-start">
            <div className="flex-1">
              <h2 className="text-2xl font-bold tracking-tighter uppercase">
                Build Custom<br /><span className="text-zinc-700">Agent</span>
              </h2>
              <p className="text-zinc-500 text-sm mt-4 max-w-md">
                Need something specific? Build a custom agent with your own skills, personality, and workflows.
              </p>
            </div>
            <Link
              href="/music-wizard"
              className="inline-flex items-center justify-center border border-zinc-800 px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
            >
              Open Music Wizard
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
