'use client'

import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Mic, Volume2, Phone, Radio, Play, Pause, Settings,
  CheckCircle, AlertTriangle, Waves, MessageSquare, Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'

interface VoiceConfig {
  ttsEnabled: boolean
  ttsReachable: boolean
  asrEnabled: boolean
  hasMimoKey: boolean
  hasBYOK: boolean
  plan: string
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
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [ttsError, setTtsError] = useState('')

  const { data: config } = useQuery<VoiceConfig>({
    queryKey: ['voice-config'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/voice')
      if (!res.ok) throw new Error('Failed to load voice config')
      return res.json()
    },
  })

  const audioRef = useRef<HTMLAudioElement>(null)

  const handleTestVoice = async () => {
    if (!testText.trim()) return
    setIsPlaying(true)
    setTtsError('')
    setAudioUrl(null)

    try {
      const res = await fetch('/api/demo/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: testText }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setTtsError(data.error || 'TTS failed')
        setIsPlaying(false)
        return
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setAudioUrl(url)

      // Use ref-based audio element for reliable playback
      if (audioRef.current) {
        audioRef.current.src = url
        audioRef.current.load()
        try {
          await audioRef.current.play()
        } catch (playErr) {
          console.error('[TTS] Play error:', playErr)
          setTtsError('Browser blocked autoplay — click the play button below')
          setIsPlaying(false)
        }
      }
    } catch (err) {
      console.error('[TTS] Error:', err)
      setTtsError('Network error — TTS unavailable')
      setIsPlaying(false)
    }
  }

  return (
    <DashboardShell>
      <DashboardHeader
        title="Voice & TTS"
        subtitle="Configure MiMo TTS, ASR, voice notes, and phone calls for your agents"
        icon={<Volume2 className="h-5 w-5 text-orange-400" />}
      />

      <DashboardContent className="space-y-6">
        {/* MiMo subscription status */}
        {config && !config.ttsEnabled && (
          <div className="border border-red-500/20 bg-zinc-950 p-5">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <h2 className="text-sm font-bold text-red-400 uppercase tracking-tight">MiMo TTS Not Available</h2>
            </div>
            <div className="space-y-3 text-sm text-zinc-400 leading-relaxed max-w-lg">
              <p>
                Voice & TTS requires a MiMo API key. Your agent uses MiMo TTS to convert text responses
                into natural speech for voice notes and phone calls.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="border border-zinc-800 bg-black p-3">
                  <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Platform Key</div>
                  <div className={cn('text-xs font-bold', config.hasMimoKey ? 'text-emerald-400' : 'text-red-400')}>
                    {config.hasMimoKey ? 'Configured' : 'Not Found'}
                  </div>
                </div>
                <div className="border border-zinc-800 bg-black p-3">
                  <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">BYOK Key</div>
                  <div className={cn('text-xs font-bold', config.hasBYOK ? 'text-emerald-400' : 'text-zinc-500')}>
                    {config.hasBYOK ? 'Active' : 'Not Set'}
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-zinc-600">
                To enable TTS: set MIMO_API_KEY in your environment, or configure BYOK in Settings.
                Your MiMo subscription includes TTS at no extra cost.
              </p>
            </div>
          </div>
        )}

        {/* Status cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-zinc-800">
          {[
            { label: 'TTS', value: config?.ttsEnabled ? (config?.ttsReachable ? 'Active' : 'Unreachable') : 'No Key', icon: Volume2, color: config?.ttsEnabled && config?.ttsReachable ? 'text-emerald-400' : config?.ttsEnabled ? 'text-amber-400' : 'text-red-400' },
            { label: 'ASR', value: config?.asrEnabled ? 'Active' : 'No Key', icon: Mic, color: config?.asrEnabled ? 'text-emerald-400' : 'text-red-400' },
            { label: 'MiMo Plan', value: config?.plan?.toUpperCase() ?? 'FREE', icon: Zap, color: 'text-orange-400' },
            { label: 'Phone Calls', value: config?.callEnabled ? 'Enabled' : 'Coming Soon', icon: Phone, color: config?.callEnabled ? 'text-purple-400' : 'text-zinc-500' },
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
          {/* Hidden audio element for reliable playback */}
          <audio ref={audioRef} onEnded={() => setIsPlaying(false)} onError={() => { setIsPlaying(false); setTtsError('Audio playback error') }} />

          {ttsError && (
            <div className="mt-3 text-xs text-red-400 border border-red-500/20 p-3">
              {ttsError}
            </div>
          )}
          {audioUrl && (
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={() => audioRef.current?.play()}
                className="flex items-center gap-2 text-[11px] border border-emerald-500/30 text-emerald-400 px-3 py-1.5 hover:bg-emerald-500/10 transition-colors"
              >
                <Play className="h-3 w-3" />
                Play Again
              </button>
              <a
                href={audioUrl}
                download="tts-output.wav"
                className="text-[10px] text-zinc-500 hover:text-white transition-colors"
              >
                Download WAV
              </a>
            </div>
          )}
          <p className="text-[10px] text-zinc-600 mt-3">
            MiMo TTS generates natural speech in real-time. Uses your MiMo subscription —
            {config?.hasMimoKey ? ' platform key is configured.' : config?.hasBYOK ? ' BYOK key is active.' : ' no key found.'}
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
