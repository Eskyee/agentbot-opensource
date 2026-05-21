'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  masterCreatorSystemPrompt,
  producerAgents,
  soundpackBlueprint,
  toolkitPrompts,
} from '@/app/lib/creator-toolkit'
import { RaveTerminalPanel } from '@/app/components/RaveTerminalPanel'

const categories = ['All', ...Array.from(new Set(toolkitPrompts.map((prompt) => prompt.category)))]

type ArrangementResult = {
  title: string
  genre: string
  bpm: number
  mood: string
  tagline: string
  arrangement: Array<{ time: string; name: string; energy: number; note: string }>
  drumEvolution: string[]
  bassProgression: string[]
  fx: string[]
  provider?: string
  model?: string
  fallback?: boolean
  fallbackReason?: string
}

type ArrangementSection = ArrangementResult['arrangement'][number]

type AudioSketch = {
  stop: () => void
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function makeNoiseBuffer(context: AudioContext, duration = 0.35) {
  const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate)
  const channel = buffer.getChannelData(0)
  for (let index = 0; index < channel.length; index += 1) {
    channel[index] = Math.random() * 2 - 1
  }
  return buffer
}

function scheduleKick(context: AudioContext, destination: AudioNode, time: number, intensity: number) {
  const osc = context.createOscillator()
  const gain = context.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(128, time)
  osc.frequency.exponentialRampToValueAtTime(46, time + 0.13)
  gain.gain.setValueAtTime(0.0001, time)
  gain.gain.exponentialRampToValueAtTime(0.38 + intensity * 0.32, time + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.22)
  osc.connect(gain)
  gain.connect(destination)
  osc.start(time)
  osc.stop(time + 0.24)
  return osc
}

function scheduleSnare(context: AudioContext, destination: AudioNode, noise: AudioBuffer, time: number, intensity: number) {
  const source = context.createBufferSource()
  const filter = context.createBiquadFilter()
  const gain = context.createGain()
  source.buffer = noise
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(1850 + intensity * 1300, time)
  filter.Q.setValueAtTime(0.9, time)
  gain.gain.setValueAtTime(0.0001, time)
  gain.gain.exponentialRampToValueAtTime(0.18 + intensity * 0.22, time + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16)
  source.connect(filter)
  filter.connect(gain)
  gain.connect(destination)
  source.start(time)
  source.stop(time + 0.18)
  return source
}

function scheduleHat(context: AudioContext, destination: AudioNode, noise: AudioBuffer, time: number, intensity: number) {
  const source = context.createBufferSource()
  const filter = context.createBiquadFilter()
  const gain = context.createGain()
  source.buffer = noise
  filter.type = 'highpass'
  filter.frequency.setValueAtTime(6200, time)
  gain.gain.setValueAtTime(0.0001, time)
  gain.gain.exponentialRampToValueAtTime(0.035 + intensity * 0.05, time + 0.004)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.045)
  source.connect(filter)
  filter.connect(gain)
  gain.connect(destination)
  source.start(time)
  source.stop(time + 0.055)
  return source
}

function scheduleReese(
  context: AudioContext,
  destination: AudioNode,
  time: number,
  duration: number,
  rootFrequency: number,
  intensity: number,
) {
  const filter = context.createBiquadFilter()
  const gain = context.createGain()
  const left = context.createOscillator()
  const right = context.createOscillator()
  const lfo = context.createOscillator()
  const lfoGain = context.createGain()

  left.type = 'sawtooth'
  right.type = 'sawtooth'
  left.frequency.setValueAtTime(rootFrequency * 0.5, time)
  right.frequency.setValueAtTime(rootFrequency * 0.5, time)
  left.detune.setValueAtTime(-12 - intensity * 9, time)
  right.detune.setValueAtTime(13 + intensity * 10, time)

  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(170 + intensity * 280, time)
  filter.frequency.linearRampToValueAtTime(300 + intensity * 850, time + duration * 0.7)
  filter.Q.setValueAtTime(5 + intensity * 7, time)

  gain.gain.setValueAtTime(0.0001, time)
  gain.gain.exponentialRampToValueAtTime(0.08 + intensity * 0.18, time + 0.06)
  gain.gain.setValueAtTime(0.08 + intensity * 0.18, time + Math.max(0.08, duration - 0.12))
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration)

  lfo.type = 'sine'
  lfo.frequency.setValueAtTime(0.8 + intensity * 3.5, time)
  lfoGain.gain.setValueAtTime(18 + intensity * 56, time)
  lfo.connect(lfoGain)
  lfoGain.connect(filter.frequency)

  left.connect(filter)
  right.connect(filter)
  filter.connect(gain)
  gain.connect(destination)

  left.start(time)
  right.start(time)
  lfo.start(time)
  left.stop(time + duration)
  right.stop(time + duration)
  lfo.stop(time + duration)
  return [left, right, lfo]
}

function scheduleFxSweep(context: AudioContext, destination: AudioNode, time: number, duration: number, intensity: number) {
  const osc = context.createOscillator()
  const gain = context.createGain()
  const filter = context.createBiquadFilter()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(220 + intensity * 120, time)
  osc.frequency.exponentialRampToValueAtTime(880 + intensity * 2400, time + duration)
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(500 + intensity * 500, time)
  filter.frequency.exponentialRampToValueAtTime(1800 + intensity * 3600, time + duration)
  filter.Q.setValueAtTime(9, time)
  gain.gain.setValueAtTime(0.0001, time)
  gain.gain.exponentialRampToValueAtTime(0.025 + intensity * 0.055, time + 0.08)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration)
  osc.connect(filter)
  filter.connect(gain)
  gain.connect(destination)
  osc.start(time)
  osc.stop(time + duration)
  return osc
}

function startArrangementAudioSketch(arrangement: ArrangementResult, onEnded: () => void): AudioSketch {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext
  const context = new AudioContextCtor()
  const master = context.createGain()
  const compressor = context.createDynamicsCompressor()
  const noise = makeNoiseBuffer(context)
  const sources: AudioScheduledSourceNode[] = []
  const beat = 60 / clamp(arrangement.bpm || 174, 80, 220)
  const sectionBeats = 8
  const sectionDuration = beat * sectionBeats
  const notes = [55, 49, 58.27, 51.91, 61.74, 46.25, 65.41]

  master.gain.setValueAtTime(0.82, context.currentTime)
  compressor.threshold.setValueAtTime(-16, context.currentTime)
  compressor.knee.setValueAtTime(12, context.currentTime)
  compressor.ratio.setValueAtTime(8, context.currentTime)
  compressor.attack.setValueAtTime(0.004, context.currentTime)
  compressor.release.setValueAtTime(0.12, context.currentTime)
  master.connect(compressor)
  compressor.connect(context.destination)

  const startAt = context.currentTime + 0.08
  arrangement.arrangement.forEach((section: ArrangementSection, sectionIndex: number) => {
    const sectionStart = startAt + sectionIndex * sectionDuration
    const intensity = clamp(section.energy / 100, 0.1, 1)
    const root = notes[sectionIndex % notes.length]
    const isBreakdown = /breakdown|intro|exit/i.test(section.name)

    sources.push(...scheduleReese(context, master, sectionStart, sectionDuration * 0.96, root, isBreakdown ? intensity * 0.45 : intensity))
    sources.push(scheduleFxSweep(context, master, sectionStart + sectionDuration * 0.58, sectionDuration * 0.34, intensity))

    for (let beatIndex = 0; beatIndex < sectionBeats; beatIndex += 0.5) {
      const time = sectionStart + beatIndex * beat
      const wholeBeat = Number.isInteger(beatIndex)
      if (wholeBeat && beatIndex % 2 === 0) sources.push(scheduleKick(context, master, time, intensity))
      if (wholeBeat && beatIndex % 2 === 1) sources.push(scheduleSnare(context, master, noise, time, intensity))
      if (!isBreakdown || beatIndex % 1 === 0) sources.push(scheduleHat(context, master, noise, time, intensity))
    }
  })

  const totalDuration = arrangement.arrangement.length * sectionDuration + 0.4
  const endTimer = window.setTimeout(() => {
    void context.close().catch(() => undefined)
    onEnded()
  }, totalDuration * 1000)

  return {
    stop: () => {
      window.clearTimeout(endTimer)
      sources.forEach((source) => {
        try {
          source.stop()
        } catch {
          // The source may already have ended.
        }
      })
      void context.close().catch(() => undefined)
    },
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext
  }
}

export default function CreatorDashboardPage() {
  const [category, setCategory] = useState('All')
  const [selectedPromptId, setSelectedPromptId] = useState(toolkitPrompts[0].id)
  const [selectedAgentId, setSelectedAgentId] = useState(producerAgents[0].id)
  const [trackTitle, setTrackTitle] = useState('Ghost Signal 174')
  const [mood, setMood] = useState('pirate radio pressure')
  const [arrangement, setArrangement] = useState<ArrangementResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [publishResult, setPublishResult] = useState<{ webUrl: string; remoteUrl: string } | null>(null)
  const [error, setError] = useState('')
  const audioSketchRef = useRef<AudioSketch | null>(null)

  const prompts = useMemo(
    () => category === 'All' ? toolkitPrompts : toolkitPrompts.filter((prompt) => prompt.category === category),
    [category],
  )
  const selectedPrompt = toolkitPrompts.find((prompt) => prompt.id === selectedPromptId) || toolkitPrompts[0]
  const selectedAgent = producerAgents.find((agent) => agent.id === selectedAgentId) || producerAgents[0]
  const combinedPrompt = `${selectedAgent.systemPrompt}\n\nCreator task:\n${selectedPrompt.prompt}`

  useEffect(() => () => {
    audioSketchRef.current?.stop()
  }, [])

  function stopAudioSketch() {
    audioSketchRef.current?.stop()
    audioSketchRef.current = null
    setIsPlaying(false)
  }

  async function playAudioSketch() {
    if (!arrangement) return
    stopAudioSketch()
    setError('')
    try {
      audioSketchRef.current = startArrangementAudioSketch(arrangement, () => {
        audioSketchRef.current = null
        setIsPlaying(false)
      })
      setIsPlaying(true)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Audio preview failed')
    }
  }

  async function runArrangementAgent() {
    setIsRunning(true)
    setError('')
    setPublishResult(null)
    try {
      const response = await fetch('/api/creator-toolkit/arrangement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trackTitle,
          mood,
          genre: 'dark jungle / neuro DnB',
          bpm: 174,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Arrangement Agent failed')
      stopAudioSketch()
      setArrangement(data)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Arrangement Agent failed')
    } finally {
      setIsRunning(false)
    }
  }

  async function publishToGitlawb() {
    if (!arrangement) return
    setIsPublishing(true)
    setError('')
    try {
      const response = await fetch('/api/creator-toolkit/gitlawb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ arrangement }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'GitLawb publish failed')
      setPublishResult({
        webUrl: data.gitlawb.webUrl,
        remoteUrl: data.gitlawb.remoteUrl,
      })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'GitLawb publish failed')
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-5 border-b border-zinc-900 pb-8 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 text-[10px] uppercase tracking-widest text-cyan-300">Creator Console</div>
            <h1 className="text-3xl font-black uppercase tracking-tighter sm:text-5xl">Underground AI Toolkit</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-500">
              Compose producer-agent briefs, soundpack structures, baseFM show ideas, and launch prompts from one
              focused workspace.
            </p>
          </div>
          <a
            href="/api/creator-toolkit/soundpack"
            className="inline-flex items-center justify-center border border-zinc-800 px-4 py-3 text-xs font-bold uppercase tracking-widest text-zinc-300 transition-colors hover:border-cyan-400 hover:text-white"
          >
            Export Soundpack JSON
          </a>
        </div>

        <div className="mb-8">
          <RaveTerminalPanel compact />
        </div>

        <section className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-5">
            <div className="border border-zinc-800 bg-zinc-950/60 p-4">
              <label className="mb-2 block text-[10px] uppercase tracking-widest text-zinc-500">Producer Agent</label>
              <select
                value={selectedAgentId}
                onChange={(event) => setSelectedAgentId(event.target.value)}
                className="w-full border border-zinc-800 bg-black px-3 py-3 text-sm text-white outline-none focus:border-cyan-400"
              >
                {producerAgents.map((agent) => (
                  <option key={agent.id} value={agent.id}>{agent.name}</option>
                ))}
              </select>
              <p className="mt-4 text-xs leading-6 text-zinc-500">{selectedAgent.role}</p>
            </div>

            <div className="border border-zinc-800 bg-zinc-950/60 p-4">
              <label className="mb-2 block text-[10px] uppercase tracking-widest text-zinc-500">Prompt Category</label>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full border border-zinc-800 bg-black px-3 py-3 text-sm text-white outline-none focus:border-cyan-400"
              >
                {categories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>

            <div className="border border-zinc-800 bg-zinc-950/60 p-4">
              <div className="mb-3 text-[10px] uppercase tracking-widest text-zinc-500">Soundpack Skeleton</div>
              <div className="space-y-2">
                {soundpackBlueprint.folders.map((folder) => (
                  <button
                    key={folder.path}
                    type="button"
                    className="w-full border border-zinc-900 bg-black p-3 text-left text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white"
                  >
                    <span className="block font-bold text-zinc-200">{folder.path}</span>
                    <span>{folder.contents.slice(0, 2).join(' / ')}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
            <section className="border border-cyan-400/30 bg-black xl:col-span-2">
              <div className="grid gap-px bg-zinc-900 lg:grid-cols-[.8fr_1.2fr]">
                <div className="bg-black p-4">
                  <div className="mb-3 text-[10px] uppercase tracking-widest text-cyan-300">Arrangement Agent</div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter">Break Architect</h2>
                  <p className="mt-3 text-sm leading-6 text-zinc-500">
                    Generate a timestamped dark jungle arrangement with drum evolution, Reese progression, FX,
                    and warehouse energy mapping.
                  </p>
                  <div className="mt-5 grid gap-3">
                    <input
                      value={trackTitle}
                      onChange={(event) => setTrackTitle(event.target.value)}
                      className="border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-white outline-none focus:border-cyan-400"
                      aria-label="Track title"
                    />
                    <input
                      value={mood}
                      onChange={(event) => setMood(event.target.value)}
                      className="border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-white outline-none focus:border-cyan-400"
                      aria-label="Arrangement mood"
                    />
                    <button
                      type="button"
                      onClick={runArrangementAgent}
                      disabled={isRunning}
                      className="bg-cyan-300 px-4 py-3 text-xs font-black uppercase tracking-widest text-black transition-colors hover:bg-white disabled:cursor-wait disabled:bg-zinc-700"
                    >
                      {isRunning ? 'Running Agent...' : 'Generate Arrangement'}
                    </button>
                    <button
                      type="button"
                      onClick={publishToGitlawb}
                      disabled={!arrangement || isPublishing}
                      className="border border-fuchsia-400/60 px-4 py-3 text-xs font-black uppercase tracking-widest text-fuchsia-200 transition-colors hover:border-white hover:text-white disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-700"
                    >
                      {isPublishing ? 'Publishing...' : 'Publish to GitLawb'}
                    </button>
                    <button
                      type="button"
                      onClick={isPlaying ? stopAudioSketch : playAudioSketch}
                      disabled={!arrangement}
                      className="border border-lime-300/60 px-4 py-3 text-xs font-black uppercase tracking-widest text-lime-200 transition-colors hover:border-white hover:text-white disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-700"
                    >
                      {isPlaying ? 'Stop Audio Sketch' : 'Play Audio Sketch'}
                    </button>
                  </div>
                  {error ? (
                    <p className="mt-4 border border-red-500/30 bg-red-950/20 p-3 text-xs leading-5 text-red-200">{error}</p>
                  ) : null}
                  {publishResult ? (
                    <a
                      href={publishResult.webUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 block break-all border border-lime-400/40 bg-lime-950/10 p-3 text-xs leading-5 text-lime-200 hover:border-white"
                    >
                      {publishResult.webUrl}
                    </a>
                  ) : null}
                </div>

                <div className="relative overflow-hidden bg-black p-4">
                  <div className="pointer-events-none absolute inset-0 opacity-25 [background:linear-gradient(transparent_92%,rgba(34,211,238,.35)_93%),linear-gradient(90deg,transparent_92%,rgba(236,72,153,.22)_93%)] [background-size:100%_18px,28px_100%]" />
                  <div className="relative">
                    <div className="mb-4 flex h-20 items-end gap-1 border border-zinc-900 bg-zinc-950/80 p-3">
                      {Array.from({ length: 42 }).map((_, index) => (
                        <span
                          key={index}
                          className="w-full bg-cyan-300/80"
                          style={{ height: `${18 + ((index * 19) % 58)}%` }}
                        />
                      ))}
                    </div>
                    {arrangement ? (
                      <div>
                        <div className="mb-4 flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-widest text-zinc-500">
                          <span>{arrangement.genre}</span>
                          <span>{arrangement.bpm} BPM</span>
                          <span>{arrangement.mood}</span>
                          {isPlaying ? <span className="text-lime-300">audio sketch live</span> : null}
                          {arrangement.provider ? <span>{arrangement.provider}</span> : null}
                          {arrangement.fallback ? <span className="text-amber-300">fallback</span> : null}
                        </div>
                        <div className="grid gap-2">
                          {arrangement.arrangement.map((section) => (
                            <article key={section.time} className="grid gap-3 border border-zinc-900 bg-zinc-950/80 p-3 sm:grid-cols-[64px_1fr_96px]">
                              <span className="text-cyan-300">{section.time}</span>
                              <div>
                                <strong className="block text-sm uppercase tracking-wider text-white">{section.name}</strong>
                                <span className="text-xs leading-5 text-zinc-500">{section.note}</span>
                              </div>
                              <span className="text-right text-xs uppercase tracking-widest text-fuchsia-300">{section.energy}%</span>
                            </article>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="border border-zinc-900 bg-zinc-950/80 p-5 text-sm leading-7 text-zinc-500">
                        Run the agent to generate the first timestamped arrangement. This is the demo surface: fast,
                        visual, and understandable in one glance.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="border border-zinc-800 bg-zinc-950/40">
              <div className="border-b border-zinc-900 p-4">
                <h2 className="text-sm font-bold uppercase tracking-widest">Prompt Library</h2>
              </div>
              <div className="max-h-[760px] overflow-auto">
                {prompts.map((prompt) => (
                  <button
                    key={prompt.id}
                    type="button"
                    onClick={() => setSelectedPromptId(prompt.id)}
                    className={`w-full border-b border-zinc-900 p-4 text-left transition-colors ${
                      prompt.id === selectedPrompt.id ? 'bg-cyan-400 text-black' : 'bg-black text-zinc-400 hover:bg-zinc-950 hover:text-white'
                    }`}
                  >
                    <span className="block text-[10px] uppercase tracking-widest opacity-70">{prompt.category}</span>
                    <span className="mt-2 block text-sm font-bold uppercase tracking-wider">{prompt.title}</span>
                    <span className="mt-2 block text-xs leading-5 opacity-80">{prompt.summary}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="border border-zinc-800 bg-zinc-950/40">
              <div className="border-b border-zinc-900 p-4">
                <div className="text-[10px] uppercase tracking-widest text-zinc-500">Compiled Agent Brief</div>
                <h2 className="mt-2 text-xl font-black uppercase tracking-tight">{selectedPrompt.title}</h2>
              </div>
              <div className="grid gap-5 p-4">
                <div>
                  <div className="mb-2 text-[10px] uppercase tracking-widest text-zinc-500">Master Identity</div>
                  <pre className="max-h-44 overflow-auto whitespace-pre-wrap border border-zinc-900 bg-black p-4 text-xs leading-6 text-zinc-400">
                    {masterCreatorSystemPrompt}
                  </pre>
                </div>
                <div>
                  <div className="mb-2 text-[10px] uppercase tracking-widest text-zinc-500">Ready Prompt</div>
                  <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap border border-zinc-900 bg-black p-4 text-xs leading-6 text-zinc-200">
                    {combinedPrompt}
                  </pre>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  )
}
