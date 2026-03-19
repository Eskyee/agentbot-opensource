'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const musicTemplates = [
  {
    id: 'dj-manager',
    name: 'DJ Manager',
    icon: '🎧',
    description: 'Full-stack DJ management agent. Handles bookings, set planning, and fan engagement across Telegram and WhatsApp.',
    skills: ['Setlist Oracle', 'Booking Agent', 'Fan Engagement', 'Royalty Tracker'],
    brain: 'DeepSeek R1',
    tier: 'Collective',
    color: 'from-purple-500/20 to-blue-500/20',
    border: 'border-purple-500/30',
  },
  {
    id: 'producer-assistant',
    name: 'Producer Assistant',
    icon: '🎹',
    description: 'Your studio partner. Tracks samples, manages demo submissions, handles split sheets and collaborator coordination.',
    skills: ['Track Archaeologist', 'Demo Submitter', 'Royalty Tracker', 'Visual Synthesizer'],
    brain: 'Llama 3.3',
    tier: 'Underground',
    color: 'from-green-500/20 to-cyan-500/20',
    border: 'border-green-500/30',
  },
  {
    id: 'booking-agent',
    name: 'Booking Agent',
    icon: '📅',
    description: 'Autonomous booking agent. Finds venues, negotiates rates, manages calendar, and handles rider requirements.',
    skills: ['Venue Finder', 'Event Scheduler', 'Festival Finder', 'USDC Payments'],
    brain: 'DeepSeek R1',
    tier: 'Label',
    color: 'from-blue-500/20 to-indigo-500/20',
    border: 'border-blue-500/30',
  },
  {
    id: 'ar-scout',
    name: 'A&R Scout',
    icon: '🔭',
    description: 'Discovers emerging talent via streaming data and social signals. Monitors SoundCloud, Bandcamp, and club playlists.',
    skills: ['Track Archaeologist', 'Groupie Manager', 'Demo Submitter', 'Web Search'],
    brain: 'Qwen 2.5',
    tier: 'Collective',
    color: 'from-orange-500/20 to-red-500/20',
    border: 'border-orange-500/30',
  },
  {
    id: 'promo-engine',
    name: 'Promo Engine',
    icon: '📣',
    description: 'Handles release campaigns, social media scheduling, playlist pitching, and press kit distribution.',
    skills: ['Visual Synthesizer', 'Groupie Manager', 'Event Scheduler', 'Web Search'],
    brain: 'Mistral 7B',
    tier: 'Underground',
    color: 'from-pink-500/20 to-rose-500/20',
    border: 'border-pink-500/30',
  },
  {
    id: 'label-ops',
    name: 'Label Operations',
    icon: '🏢',
    description: 'Complete label back-office. Manages roster, coordinates releases, tracks royalties, handles contracts.',
    skills: ['Royalty Tracker', 'Demo Submitter', 'USDC Payments', 'Event Ticketing'],
    brain: 'DeepSeek R1',
    tier: 'Label',
    color: 'from-amber-500/20 to-yellow-500/20',
    border: 'border-amber-500/30',
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
    <div className="min-h-screen bg-black text-white">
      <main className="px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">Agent Templates</h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Pre-configured agents for the music industry. Deploy in 60 seconds with skills, personality, and workflows ready to go.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {musicTemplates.map((template) => (
              <div
                key={template.id}
                className={`bg-gradient-to-br ${template.color} rounded-2xl p-6 border ${template.border} hover:scale-[1.02] transition-all cursor-pointer ${
                  selectedTemplate === template.id ? 'ring-2 ring-white' : ''
                }`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-3xl">{template.icon}</span>
                    <h2 className="text-xl font-bold mt-2">{template.name}</h2>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-widest text-gray-400">{template.tier}</span>
                    <div className="text-xs text-gray-500 font-mono mt-1">{template.brain}</div>
                  </div>
                </div>

                <p className="text-sm text-gray-300 mb-4 leading-relaxed">{template.description}</p>

                <div className="flex flex-wrap gap-2 mb-5">
                  {template.skills.map((skill) => (
                    <span key={skill} className="text-xs bg-black/30 border border-white/10 rounded-full px-2.5 py-1 text-gray-300">
                      {skill}
                    </span>
                  ))}
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); handleDeploy(template.id) }}
                  disabled={deploying && selectedTemplate === template.id}
                  className="w-full bg-white text-black rounded-xl py-3 font-bold text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {deploying && selectedTemplate === template.id ? 'Deploying...' : `Deploy ${template.name}`}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 max-w-2xl mx-auto">
              <div className="text-4xl mb-3">🛠️</div>
              <h3 className="text-xl font-bold mb-2">Build Custom Agent</h3>
              <p className="text-gray-400 text-sm mb-4">
                Need something specific? Build a custom agent with your own skills, personality, and workflows.
              </p>
              <Link
                href="/music-wizard"
                className="inline-block bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
              >
                Open Music Wizard
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
