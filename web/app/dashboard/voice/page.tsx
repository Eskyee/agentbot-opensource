'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Mic, Volume2, Phone, Radio, Play, Pause, Settings,
  CheckCircle, AlertTriangle, Waves, MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'

interface VoiceConfig {
  ttsEnabled: boolean
  asrEnabled: boolean
  defaultVoice: string
  availableVoices: { id: string; name: string; language: string; gender: string }[]
  callEnabled: boolean
  phoneNumber: string | null
  voiceNotesEnabled: boolean
}

const voices = [
  { id: 'mimo-tts-1', name: 'Atlas', language: 'en-GB', gender: 'male', desc: 'Deep British accent — authoritative, calm' },
  { id: 'mimo-tts-2', name: 'Nova', language: 'en-US', gender: 'female', desc: 'Clear American accent — friendly, professional' },
  { id: 'mimo-tts-3', name: 'Echo', language: 'en-US', gender: 'neutral', desc: 'Neutral American — versatile, adaptive' },
  { id: 'mimo-tts-4', name: 'Klave', language: 'en-GB', gender: 'male', desc: 'London accent — sharp, direct' },
  { id: 'mimo-tts-5', name: 'Raven', language: 'en-US', gender: 'female', desc: 'Warm American — empathetic, conversational' },
]

export default function VoicePage() {
  const [selectedVoice, setSelectedVoice] = useState('mimo-tts-1')
  const [testText, setTestText] = useState('Hello, I am your AI agent. How can I help you today?')
  const [isPlaying, setIsPlaying] = useState(false)

  const { data: config } = useQuery<VoiceConfig>({
    queryKey: ['voice-config'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/voice')
      if (!res.ok) throw new Error('Failed to load voice config')
      return res.json()
    },
  })

  const handleTestVoice = async () => {
    setIsPlaying(true)
    // Simulate playback
    setTimeout(() => setIsPlaying(false), 3000)
  }

  return (
    <DashboardShell>
      <DashboardHeader
        title="Voice & TTS"
        subtitle="Configure MiMo TTS, ASR, voice notes, and phone calls for your agents"
        icon={<Volume2 className="h-5 w-5 text-orange-400" />}
      />

      <DashboardContent className="space-y-6">
        {/* Status cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-zinc-800">
          {[
            { label: 'TTS', value: config?.ttsEnabled ? 'Active' : 'Inactive', icon: Volume2, color: config?.ttsEnabled ? 'text-emerald-400' : 'text-zinc-500' },
            { label: 'ASR', value: config?.asrEnabled ? 'Active' : 'Inactive', icon: Mic, color: config?.asrEnabled ? 'text-emerald-400' : 'text-zinc-500' },
            { label: 'Voice Notes', value: config?.voiceNotesEnabled ? 'Enabled' : 'Disabled', icon: MessageSquare, color: config?.voiceNotesEnabled ? 'text-orange-400' : 'text-zinc-500' },
            { label: 'Phone Calls', value: config?.callEnabled ? 'Enabled' : 'Disabled', icon: Phone, color: config?.callEnabled ? 'text-purple-400' : 'text-zinc-500' },
          ].map((s) => (
            <div key={s.label} className="bg-zinc-950 p-5 border border-zinc-800">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-zinc-600 mb-1">
                <s.icon className={cn('h-3 w-3', s.color)} />
                {s.label}
              </div>
              <div className={cn('text-lg font-mono font-bold', s.color)}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Voice selector */}
        <div className="border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-tight mb-4">
            Agent Voice — MiMo TTS
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {voices.map((voice) => (
              <div
                key={voice.id}
                onClick={() => setSelectedVoice(voice.id)}
                className={cn(
                  'border p-4 cursor-pointer transition-all',
                  selectedVoice === voice.id
                    ? 'border-orange-500 bg-orange-500/5'
                    : 'border-zinc-800 bg-black hover:border-zinc-600'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white">{voice.name}</span>
                  {selectedVoice === voice.id && (
                    <CheckCircle className="h-3.5 w-3.5 text-orange-400" />
                  )}
                </div>
                <div className="text-[10px] text-zinc-500 mb-2">{voice.desc}</div>
                <div className="flex items-center gap-2 text-[9px] text-zinc-600">
                  <span className="font-mono">{voice.language}</span>
                  <span>·</span>
                  <span className="uppercase">{voice.gender}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Voice test */}
        <div className="border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-tight mb-4">
            Test Voice
          </h2>
          <div className="flex gap-3 mb-4">
            <input
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              className="flex-1 bg-black border border-zinc-800 px-3 py-2 text-sm text-white font-mono focus:border-orange-500 focus:outline-none"
              placeholder="Enter text to speak..."
            />
            <button
              onClick={handleTestVoice}
              disabled={isPlaying}
              className={cn(
                'flex items-center gap-2 text-[11px] px-4 py-2 border transition-colors',
                isPlaying
                  ? 'border-orange-500 text-orange-400'
                  : 'border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500'
              )}
            >
              {isPlaying ? (
                <>
                  <Waves className="h-3 w-3 animate-pulse" />
                  Playing...
                </>
              ) : (
                <>
                  <Play className="h-3 w-3" />
                  Test
                </>
              )}
            </button>
          </div>
          <p className="text-[10px] text-zinc-600">
            MiMo TTS generates natural speech in real-time. Free during the trial period.
          </p>
        </div>

        {/* Voice notes */}
        <div className="border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-tight mb-4">
            Voice Notes
          </h2>
          <div className="space-y-4 text-sm text-zinc-400 leading-relaxed max-w-lg">
            <p>
              When enabled, your agents can send and receive voice notes on Telegram, WhatsApp,
              and Discord. MiMo ASR transcribes incoming voice messages. MiMo TTS generates
              spoken responses.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="border border-zinc-800 bg-black p-3">
                <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Incoming</div>
                <div className="text-xs text-white">MiMo ASR — speech-to-text</div>
              </div>
              <div className="border border-zinc-800 bg-black p-3">
                <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Outgoing</div>
                <div className="text-xs text-white">MiMo TTS — text-to-speech</div>
              </div>
            </div>
          </div>
        </div>

        {/* Phone calls (coming soon) */}
        <div className="border border-zinc-800 bg-zinc-950 p-5 opacity-60">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-tight">
              Phone Calls
            </h2>
            <span className="text-[9px] uppercase tracking-widest text-amber-400 border border-amber-400/20 px-1.5 py-0.5">
              Coming Soon
            </span>
          </div>
          <div className="space-y-4 text-sm text-zinc-400 leading-relaxed max-w-lg">
            <p>
              Let your agents make and receive phone calls. Powered by MiMo TTS/ASR with
              real-time conversation capabilities. Users call a dedicated number and talk
              to their agent naturally.
            </p>
            <div className="flex items-center gap-2 text-[10px] text-zinc-600">
              <Phone className="h-3 w-3" />
              Requires Twilio or Plivo integration
            </div>
          </div>
        </div>
      </DashboardContent>
    </DashboardShell>
  )
}
