'use client'

import { useState } from 'react'
import { Sparkles, Moon, Loader2, Copy, Check, RefreshCw } from 'lucide-react'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'

const DREAM_MOODS = ['Surreal', 'Euphoric', 'Dark', 'Floating', 'Electric', 'Ancient', 'Neon', 'Deep Sea']

interface Dream {
  id: string
  mood: string
  title: string
  description: string
  timestamp: string
}

export default function DreamsPage() {
  const [dreams, setDreams] = useState<Dream[]>([])
  const [generating, setGenerating] = useState(false)
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const generateDream = async (mood: string) => {
    setSelectedMood(mood)
    setGenerating(true)

    // Simulated dream generation
    await new Promise(r => setTimeout(r, 1500))

    const titles: Record<string, string[]> = {
      Surreal: ['Melting Clockwork Garden', 'Stairs That Lead Sideways', 'The Library of Floating Books'],
      Euphoric: ['Sunrise Over Infinite Fields', 'The Dance of Light Particles', 'Weightless in Gold'],
      Dark: ['The Corridor That Breathes', 'Whispers From Below', 'Shadows With Names'],
      Floating: ['Ocean Above the Sky', 'Drifting Through Memory Fog', 'The Cloud Cathedral'],
      Electric: ['Neural Lightning Storm', 'The Frequency Garden', 'Circuits in the Rain'],
      Ancient: ['Stone Voices', 'The Temple Under Sand', 'Roots That Remember'],
      Neon: ['Rain-Slicked Futures', 'The Hologram Market', 'Chrome Reflections'],
      'Deep Sea': ['Bioluminescent Cathedral', 'The Pressure Waltz', 'Abyssal Choir'],
    }

    const descriptions: Record<string, string[]> = {
      Surreal: ['Time bends around impossible architecture. Every surface tells a different hour.'],
      Euphoric: ['Colors that don\'t exist yet bloom across an endless horizon. Every breath tastes like possibility.'],
      Dark: ['Something watches from the corner of perception. The walls remember what you\'ve forgotten.'],
      Floating: ['Gravity forgot this place. Memories drift like jellyfish through warm, luminous air.'],
      Electric: ['Currents of pure information flow through living copper. The air hums with unfinished thoughts.'],
      Ancient: ['Stone remembers every hand that touched it. Languages older than sound echo in the bones of the earth.'],
      Neon: ['The future is wet and reflective. Every puddle contains a different tomorrow.'],
      'Deep Sea': ['Pressure creates its own kind of light. Down here, silence has a frequency.'],
    }

    const moodTitles = titles[mood] || titles.Surreal
    const moodDescs = descriptions[mood] || descriptions.Surreal

    const dream: Dream = {
      id: crypto.randomUUID(),
      mood,
      title: moodTitles[Math.floor(Math.random() * moodTitles.length)],
      description: moodDescs[Math.floor(Math.random() * moodDescs.length)],
      timestamp: new Date().toISOString(),
    }

    setDreams(prev => [dream, ...prev])
    setGenerating(false)
    setSelectedMood(null)
  }

  const copyDream = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <DashboardShell>
      <DashboardHeader
        title="Dream Generator"
        icon={<Moon className="h-5 w-5 text-orange-400" />}
        count={dreams.length}
        action={
          <div className="text-[10px] text-zinc-500 font-mono">
            AI-powered dreamscapes
          </div>
        }
      />

      <DashboardContent className="max-w-5xl space-y-8">
        {/* Mood selector */}
        <div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-3 font-bold">
            Select a mood
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {DREAM_MOODS.map(mood => (
              <button
                key={mood}
                onClick={() => generateDream(mood)}
                disabled={generating}
                className={`px-3 py-2.5 text-xs font-mono border transition-all ${
                  selectedMood === mood
                    ? 'border-orange-500 bg-orange-500/10 text-orange-300'
                    : 'border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white'
                } disabled:opacity-50`}
              >
                {generating && selectedMood === mood ? (
                  <Loader2 className="h-3 w-3 animate-spin mx-auto" />
                ) : (
                  mood
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Quick generate */}
        <button
          onClick={() => {
            const randomMood = DREAM_MOODS[Math.floor(Math.random() * DREAM_MOODS.length)]
            generateDream(randomMood)
          }}
          disabled={generating}
          className="flex items-center gap-2 px-6 py-3 bg-zinc-900 border border-zinc-800 text-white font-mono text-sm hover:border-zinc-600 transition-colors disabled:opacity-50"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 text-orange-400" />
          )}
          {generating ? 'Dreaming...' : 'Random Dream'}
        </button>

        {/* Generated dreams */}
        {dreams.length === 0 ? (
          <div className="border border-zinc-800 bg-zinc-950 p-12 text-center">
            <Moon className="h-10 w-10 text-zinc-500 mx-auto mb-4" />
            <p className="text-sm text-zinc-500 font-mono">No dreams yet</p>
            <p className="text-xs text-zinc-500 font-mono mt-2">
              Select a mood or hit Random Dream to generate
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {dreams.map(dream => (
              <div
                key={dream.id}
                className="border border-zinc-800 bg-zinc-950 p-5 group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] uppercase tracking-widest text-orange-400 font-bold">
                        {dream.mood}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {new Date(dream.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white">{dream.title}</h3>
                  </div>
                  <button
                    onClick={() => copyDream(dream.id, `${dream.title}\n\n${dream.description}`)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 border border-zinc-800 hover:border-zinc-600"
                  >
                    {copied === dream.id ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3 text-zinc-500" />
                    )}
                  </button>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">{dream.description}</p>
              </div>
            ))}
          </div>
        )}
      </DashboardContent>
    </DashboardShell>
  )
}
