'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCustomSession } from '@/app/lib/useCustomSession'

const musicRoles = [
  {
    id: 'dj',
    icon: '🎧',
    name: 'Touring DJ',
    description: 'Live performance specialist. Manages setlists, venue logistics, and crowd engagement during shows.',
    skills: ['setlist-oracle', 'track-archaeologist', 'visual-synthesizer', 'event-ticketing', 'booking-settlement'],
    color: 'from-blue-600 to-blue-400'
  },
  {
    id: 'producer',
    icon: '🎛️',
    name: 'Bedroom Producer',
    description: 'Studio specialist. Handles creation workflow, project management, and demo coordination.',
    skills: ['web-search', 'file-handler', 'code-runner', 'demo-submitter', 'visual-synthesizer'],
    color: 'from-blue-600 to-blue-400'
  },
  {
    id: 'booking-agent',
    icon: '📅',
    name: 'Booking Agent',
    description: 'Venue and talent matchmaker. Negotiates deals, manages contracts, and coordinates logistics.',
    skills: ['venue-finder', 'contract-analyzer', 'web-scraping', 'calendar', 'negotiation'],
    color: 'from-green-600 to-green-400'
  },
  {
    id: 'a-r-rep',
    icon: '🎯',
    name: 'A&R Representative',
    description: 'Talent scout and label liaison. Filters demos, routes submissions, and tracks industry connections.',
    skills: ['track-archaeologist', 'email', 'demo-submitter', 'web-scraping', 'royalty-tracker'],
    color: 'from-orange-600 to-orange-400'
  },
  {
    id: 'fan-engagement',
    icon: '👥',
    name: 'Fan Engagement',
    description: 'Community builder. Manages social media, fan segmentation, and content calendars.',
    skills: ['web-scraping', 'social-calendar', 'fan-manager', 'groupie-manager', 'visual-synthesizer'],
    color: 'from-pink-600 to-pink-400'
  },
  {
    id: 'marketing-specialist',
    icon: '📣',
    name: 'Marketing Specialist',
    description: 'Promotion expert. Creates campaigns, manages press releases, and tracks analytics.',
    skills: ['web-scraping', 'calendar', 'groupie-manager', 'visual-synthesizer', 'web-search'],
    color: 'from-yellow-600 to-yellow-400'
  }
]

interface MusicWizardData {
  selectedRole: string
  agentName: string
  artistName: string
  genres: string[]
  musicStyle: string
  channels: {
    telegram: boolean
    discord: boolean
    whatsapp: boolean
  }
  telegramUsername?: string
  goals: string[]
}

export default function MusicWizardPage() {
  const router = useRouter()
  const { data: session } = useCustomSession()
  const [step, setStep] = useState(1)
  const [wizardData, setWizardData] = useState<MusicWizardData>({
    selectedRole: 'dj',
    agentName: '',
    artistName: '',
    genres: [],
    musicStyle: '',
    channels: {
      telegram: true,
      discord: false,
      whatsapp: false
    },
    goals: []
  })

  const [loading, setLoading] = useState(false)

  const genres = ['Hip-Hop', 'Trap', 'Deep House', 'Techno', 'House', 'EDM', 'Drum & Bass', 'Ambient', 'Electronic', 'Pop R&B', 'Indie Pop', 'Rock', 'Alternative', 'Experimental Fusion', 'K-Pop', 'Jazz', 'Classical']

  const commonGoals = [
    'Get more bookings',
    'Increase streaming numbers',
    'Submit demos to labels',
    'Manage tour logistics',
    'Grow my fan base',
    'Handle fan inquiries',
    'Track royalties and splits',
    'Coordinate with labels'
  ]

  const handleNext = () => {
    if (step === 5) return handleDeploy()
    setStep(step + 1)
  }

  const handleBack = () => {
    if (step === 1) return router.push('/signup')
    setStep(step - 1)
  }

  const handleDeploy = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/agents/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: wizardData.agentName,
          config: {
            telegramToken: process.env.NEXT_PUBLIC_TELEGRAM_TOKEN || '',
            ownerIds: [],
            aiProvider: 'openrouter',
            musicIndustry: true,
            role: wizardData.selectedRole,
            genres: wizardData.genres,
            goals: wizardData.goals
          },
          plan: 'free'
        })
      })

      if (response.ok) {
        const data = await response.json()
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Deployment error:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectedRole = musicRoles.find(r => r.id === wizardData.selectedRole)

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-black text-white p-8 flex items-center justify-center">
        <div className="max-w-xl w-full">
          <Link href="/login">
            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 px-6 rounded-lg font-semibold">
              Sign In to Start →
            </button>
          </Link>
        </div>
      </div>)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-left mb-8">
          <span className="text-6xl mb-4">🎵</span>
          <h1 className="text-4xl font-black tracking-tight mb-2">
            Music Agent Wizard
          </h1>
          <p className="text-zinc-400 text-lg max-w-md mx-auto">
            Set up an AI agent specialized for your music career in under 5 minutes
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-zinc-500 mb-4">
            <span>Progress: {step}/5</span>
            <span className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className={`w-8 h-2 rounded-full ${
                    s <= step ? 'bg-green-500' : 'bg-zinc-700'
                  }`}
                />
              ))}
            </span>
          </div>
        </div>

        {/* Step 1: Role Selection */}
        {step === 1 && (
          <div className="mb-8 animate-fade-in">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-green-500">1</span>
              Choose Your Focus Area
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {musicRoles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => {
                    setWizardData(prev => ({ ...prev, selectedRole: role.id }))
                    handleNext()
                  }}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    wizardData.selectedRole === role.id
                      ? 'border-blue-500 bg-blue-500/10 border-blue-500/50'
                      : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                  }`}
                >
                  <div className="text-4xl mb-2">{role.icon}</div>
                  <h3 className="text-lg font-bold">{role.name}</h3>
                  <p className="text-sm text-zinc-400 mt-2">{role.description}</p>
                  <div className="mt-3 flex flex gap-2">
                    {role.skills.slice(0, 4).map((skill) => (
                      <span
                        key={skill}
                        className="text-xs bg-zinc-700 hover:bg-zinc-600 px-2 py-1 rounded"
                      >
                        + {skill.replace('-', ' ')}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-between mt-6">
              <Link href="/signup">
                <button className="px-4 py-2 text-zinc-400 hover:text-white transition-colors">
                  ← Skip to regular signup
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* Step 2: Basic Info & Artist Identity */}
        {step === 2 && (
          <div className="mb-8 animate-fade-in">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-green-500">2</span>
              Artist Identity
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  Artist Name
                </label>
                <input
                  type="text"
                  value={wizardData.artistName}
                  onChange={(e) => setWizardData(prev => ({ ...prev, artistName: e.target.value }))}
                  placeholder="e.g. Bassline Beats"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  Agent Name (for display)
                </label>
                <input
                  type="text"
                  value={wizardData.agentName}
                  onChange={(e) => setWizardData(prev => ({ ...prev, agentName: e.target.value }))}
                  placeholder={`@${selectedRole?.name.toLowerCase().replace(/\s+/g, '')}`}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  Your Primary Genre
                </label>
                <select
                  multiple
                  value={wizardData.genres}
                  onChange={(e) => setWizardData(prev => ({ ...prev, genres: Array.from(e.target.selectedOptions).map(o => o.value) }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                >
                  {genres.map((genre) => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  Music Style Description
                </label>
                <textarea
                  value={wizardData.musicStyle}
                  onChange={(e) => setWizardData(prev => ({ ...prev, musicStyle: e.target.value }))}
                  placeholder="e.g., Deep House with melodic basslines and rhythmic progressive elements..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 min-h-[100px]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Goals Selection */}
        {step === 3 && (
          <div className="mb-8 animate-fade-in">
            <h2 className="textxl font-bold mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-green-500">3</span>
              What Do You Want Your Agent To Focus On?
            </h2>
            
            <div>
              {commonGoals.map((goal) => (
                <button
                  key={goal}
                  onClick={() => {
                    setWizardData(prev => ({
                      ...prev,
                      goals: prev.goals.includes(goal) 
                        ? prev.goals.filter(g => g !== goal) 
                        : [...prev.goals, goal]
                    }))
                  }}
                  className={`w-full p-3 rounded-lg border mb-2 transition-all ${
                    wizardData.goals.includes(goal)
                      ? 'border-blue-500 bg-blue-500/10 border-blue-500/50'
                      : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                  }`}
                >
                  {wizardData.goals.includes(goal) ? (
                    <span className="text-green-400 mr-2">✓</span>
                  ) : (
                    <span className="text-zinc-500 mr-2">+</span>
                  )}
                  {goal}
                </button>
              ))}
            </div>

            <div className="flex justify-center mt-6">
              <button onClick={handleBack} className="px-6 py-2 text-zinc-400 hover:text-white transition-colors">
                ← Back
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Channel Setup */}
        {step === 4 && (
          <div className="mb-8 animate-fade-in">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-green-500">4</span>
              Connect Your Channels
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg border border-zinc-700">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📱</span>
                    <span className="font-semibold">Telegram</span>
                  </div>
                  <p className="text-sm text-zinc-400">Most essential for music</p>
                </div>
                <div>
                  <input
                    type="checkbox"
                    id="telegram"
                    className="w-6 h-6 accent-blue-500"
                    checked={wizardData.channels.telegram}
                    onChange={(e) => {
                      setWizardData(prev => ({
                        ...prev,
                        channels: { ...prev.channels, telegram: e.target.checked }
                      }))
                    }}
                  />
                  <label htmlFor="telegram" className="text-sm text-zinc-300">Enable Telegram (Recommended)</label>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg border border-zinc-700">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🎮</span>
                    <span className="font-semibold">Discord</span>
                  </div>
                  <p className="text-sm text-zinc-400">Great for community</p>
                </div>
                <div>
                  <input
                    type="checkbox"
                    id="discord"
                    className="w-6 h-6 accent-blue-500"
                    checked={wizardData.channels.discord}
                    onChange={(e) => {
                      setWizardData(prev => ({
                        ...prev,
                        channels: { ...prev.channels, discord: e.target.checked }
                      }))
                    }}
                  />
                  <label htmlFor="discord" className="text-sm text-zinc-300">Enable Discord</label>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg border border-zinc-700">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">💬</span>
                    <span className="font-semibold">WhatsApp</span>
                  </div>
                  <p className="text-sm text-text-zinc-400">Global reach</p>
                </div>
                <div>
                  <input
                    type="checkbox"
                    id="whatsapp"
                    className="w-6 h-6 accent-blue-500"
                    checked={wizardData.channels.whatsapp}
                    onChange={(e) => {
                      setWizardData(prev => ({
                        ...prev,
                        channels: { ...prev.channels, whatsapp: e.target.checked }
                      }))
                    }}
                  />
                  <label htmlFor="whatsapp" className="text-sm text-zinc-300">Enable WhatsApp</label>
                </div>
              </div>

              <div className="flex justify-center mt-6">
                <button onClick={handleBack} className="px-6 py-2 text-zinc-400 hover:text-white transition-colors">
                  ← Back
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Review & Deploy */}
        {step === 5 && (
          <div className="mb-8 animate-fade-in">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-green-500">5</span>
              Review & Deploy
            </h2>
            
            <div className="space-y-4 bg-zinc-800 rounded-xl p-6 border border-zinc-700">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-4xl">{selectedRole?.icon || '🎵'}</div>
                <div>
                  <h3 className="text-xl font-bold">{wizardData.artistName || 'Your Artist'}</h3>
                  <p className="text-sm text-zinc-400">as {selectedRole?.name || 'Artist'} AI Assistant</p>
                </div>
              </div>

              <div className="space-y-3 border-t border-zinc-700 pt-4">
                <div>
                  <div className="text-sm text-zinc-500 mb-1">Agent Name</div>
                  <div className="font-mono text-white">{wizardData.agentName || 'my-agent'}</div>
                </div>

                {wizardData.genres.length > 0 && (
                  <div>
                    <div className="text-sm text-zinc-500 mb-1">Genres</div>
                    <div className="flex flex-wrap gap-2">
                      {wizardData.genres.map(genre => (
                        <span key={genre} className="px-3 py-1 bg-zinc-700 text-white text-sm rounded">
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {wizardData.goals.length > 0 && (
                  <div>
                    <div className="text-sm text-zinc-500 mb-1">Primary Goals</div>
                    <div className="flex flex-wrap gap-2">
                      {wizardData.goals.map(goal => (
                        <span key={goal} className="px-3 py-1 bg-green-700 text-white text-sm rounded">
                          {goal}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {wizardData.channels.telegram && (
                  <div>
                    <div className="text-sm text-zinc-500 mb-1">Telegram</div>
                    <div className="text-green-400">✓ Enabled</div>
                  </div>
                )}

                {wizardData.channels.discord && (
                  <div>
                    <div className="text-sm text-zinc-500 mb-1">Discord</div>
                    <div className="text-blue-400">✓ Enabled</div>
                  </div>
                )}

                {wizardData.channels.whatsapp && (
                  <div>
                    <div className="text-sm text-zinc-500 mb-1">WhatsApp</div>
                  <div className="text-pink-400">✓ Enabled</div>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mt-6">
                <button onClick={handleBack} className="px-6 py-2 text-zinc-400 hover:text-white transition-colors">
                  ← Back
                </button>
                <button
                  onClick={handleDeploy}
                  disabled={loading || !wizardData.agentName}
                  className="bg-white text-black hover:bg-zinc-200 px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <span className="animate-spin">Loading...</span>
                  ) : (
                    <>
                      Deploy Agent →
                      <span>🚀</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Benefits Summary */}
        <div className="mt-8 pt-8 border-t border-zinc-700">
          <h3 className="text-lg font-semibold mb-4 text-left">
            What Your AI Agent Will Do For You:
          </h3>
          <div className="grid md:grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm text-zinc-500 mb-2">Industry Connections</h4>
              <ul className="space-y-2 text-sm text-zinc-300">
                <li className="flex gap-2">
                  <span className="text-green-400">✓</span>
                  <span style={{ marginLeft: '12px' }}>Access 200+ venue databases</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-400">✓</span>
                  <span style={{ marginLeft: '12px' }}>Direct label connections</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-400">✓</span>
                  <span style={{ marginLeft: '12px' }}>Producer collaboration network</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm text-zinc-500 mb-2">Music Analytics</h4>
              <ul className="space-y-2 text-sm text-zinc-300">
                <li className="flex gap-2">
                  <span className="text-green-400">✓</span>
                  <span style={{ marginLeft: '12px' }}>Consumer trend analysis</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-400">✓</span>
                  <span style={{ marginLeft: '12px' }}>Genre-specific insights</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-400">✓</span>
                  <span style={{ marginLeft: '12px' }}>Fan engagement tracking</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Back to regular signup option */}
        <div className="text-left mt-8">
          <Link href="/signup" className="text-sm text-blue-400 hover:text-blue-300">
            ← Skip to standard signup process
          </Link>
        </div>
      </div>
    </div>
  )
}
