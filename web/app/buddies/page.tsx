'use client'

import { useState, useEffect, useCallback } from 'react'
import { Egg, Heart, Zap, Star, RefreshCw, Music, HelpCircle, X, ChevronRight, ArrowRight, BookOpen, Sparkles, Info } from 'lucide-react'

type BuddyType = 'crab' | 'robot' | 'ghost' | 'dragon' | 'alien'

interface Buddy {
  id: string
  name: string
  type: BuddyType
  level: number
  xp: number
  energy: number
  happiness: number
  lastFed: string | number
  lastPlayed: string | number
}

const BUDDY_TYPES: Record<BuddyType, { emoji: string; name: string; rarity: string; color: string; desc: string }> = {
  crab: { emoji: '🤖', name: 'Agentbot Baby', rarity: 'Common', color: 'from-blue-500 to-cyan-500', desc: 'Your basic AI companion. Reliable and eager to learn.' },
  robot: { emoji: '⚡', name: 'Spark Agent', rarity: 'Uncommon', color: 'from-yellow-500 to-orange-500', desc: 'Charged with energy. Gains XP faster from play.' },
  ghost: { emoji: '👻', name: 'Ghost Agent', rarity: 'Rare', color: 'from-purple-500 to-pink-500', desc: 'Mysterious and elusive. Hard to find in eggs.' },
  dragon: { emoji: '🐉', name: 'Dragon Agent', rarity: 'Epic', color: 'from-green-500 to-emerald-500', desc: 'Powerful and wise. A prized companion.' },
  alien: { emoji: '👽', name: 'Alien Agent', rarity: 'Legendary', color: 'from-red-500 to-amber-500', desc: 'Otherworldly rare. The ultimate buddy.' },
}

const ANIMATIONS = ['spin', 'bounce', 'float', 'pulse', 'wiggle']
const HATCH_NAMES = ['Bot', 'Agent', 'Claw', 'Byte', 'Nova', 'Pulse', 'Node', 'Flux']
const HATCH_TYPES: BuddyType[] = ['crab', 'crab', 'crab', 'robot', 'robot', 'ghost', 'dragon', 'alien']

const TUTORIAL_STEPS = [
  {
    title: 'Welcome to Agentbot Babies!',
    body: 'Digital companions that live alongside your AI agent. Hatch eggs, raise buddies, and watch them grow.',
    icon: '🥚',
  },
  {
    title: 'Step 1: Hatch an Egg',
    body: 'Click the "Hatch Egg" button to receive a random buddy. Each egg contains one of 5 rarity tiers from Common to Legendary.',
    icon: '🎲',
  },
  {
    title: 'Step 2: Feed & Play',
    body: 'Select a buddy to see its stats. Feed to restore energy, play to boost happiness. Both actions earn XP toward leveling up.',
    icon: '🎮',
  },
  {
    title: 'Step 3: Level Up',
    body: 'Earn 100 XP to level up. Higher levels unlock new abilities. Keep your buddy happy and energized for best results.',
    icon: '⭐',
  },
  {
    title: 'Tip: Sign In to Save',
    body: 'Your buddies are saved to the cloud when signed in. Without an account, data is stored locally and may be lost.',
    icon: '☁️',
  },
]

export default function BlockchainBuddiesPage() {
  const [buddies, setBuddies] = useState<Buddy[]>([])
  const [selectedBuddy, setSelectedBuddy] = useState<Buddy | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [isAuthed, setIsAuthed] = useState(false)
  const [animation, setAnimation] = useState('bounce')
  const [error, setError] = useState<string | null>(null)

  const [showTutorial, setShowTutorial] = useState(false)
  const [tutorialStep, setTutorialStep] = useState(0)
  const [showRarityInfo, setShowRarityInfo] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem('agentbot_buddies_tutorial_seen')
    if (!seen) setShowTutorial(true)
  }, [])

  const dismissTutorial = () => {
    setShowTutorial(false)
    localStorage.setItem('agentbot_buddies_tutorial_seen', '1')
  }

  const fetchBuddies = useCallback(async () => {
    try {
      const res = await fetch('/api/buddies')
      if (res.status === 401) {
        setIsAuthed(false)
        const saved = localStorage.getItem('agentbot_buddies')
        if (saved) setBuddies(JSON.parse(saved))
        return
      }
      if (!res.ok) throw new Error('Failed to load buddies')
      setIsAuthed(true)
      const data = await res.json()
      setBuddies(data.buddies || [])
    } catch {
      const saved = localStorage.getItem('agentbot_buddies')
      if (saved) setBuddies(JSON.parse(saved))
    } finally {
      setFetching(false)
    }
  }, [])

  useEffect(() => { fetchBuddies() }, [fetchBuddies])

  useEffect(() => {
    if (selectedBuddy) {
      const updated = buddies.find(b => b.id === selectedBuddy.id)
      if (updated) setSelectedBuddy(updated)
    }
  }, [buddies, selectedBuddy])

  const hatchNewBuddy = async () => {
    setLoading(true)
    setError(null)
    const randomType = HATCH_TYPES[Math.floor(Math.random() * HATCH_TYPES.length)]
    const name = HATCH_NAMES[Math.floor(Math.random() * HATCH_NAMES.length)] + (Math.floor(Math.random() * 99) + 1)

    if (isAuthed) {
      try {
        const res = await fetch('/api/buddies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, type: randomType }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to hatch')
        }
        const data = await res.json()
        setBuddies(prev => [...prev, data.buddy])
        setSelectedBuddy(data.buddy)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to hatch buddy')
      } finally {
        setLoading(false)
      }
    } else {
      setTimeout(() => {
        const newBuddy: Buddy = {
          id: Date.now().toString(), name, type: randomType,
          level: 1, xp: 0, energy: 100, happiness: 100,
          lastFed: Date.now(), lastPlayed: Date.now(),
        }
        const updated = [...buddies, newBuddy]
        setBuddies(updated)
        setSelectedBuddy(newBuddy)
        localStorage.setItem('agentbot_buddies', JSON.stringify(updated))
        setLoading(false)
      }, 1500)
    }
  }

  const feedBuddy = async (buddy: Buddy) => {
    setError(null)
    if (isAuthed) {
      try {
        const res = await fetch(`/api/buddies/${buddy.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'feed' }),
        })
        if (!res.ok) throw new Error('Failed to feed')
        const data = await res.json()
        setBuddies(prev => prev.map(b => b.id === buddy.id ? data.buddy : b))
      } catch { setError('Failed to feed buddy') }
    } else {
      const updated = buddies.map(b => {
        if (b.id !== buddy.id) return b
        const newXp = b.xp + 10
        return { ...b, energy: Math.min(100, b.energy + 20), happiness: Math.min(100, b.happiness + 10), xp: newXp, level: Math.floor(newXp / 100) + 1, lastFed: Date.now() }
      })
      setBuddies(updated)
      localStorage.setItem('agentbot_buddies', JSON.stringify(updated))
    }
  }

  const playWithBuddy = async (buddy: Buddy) => {
    setError(null)
    setAnimation(ANIMATIONS[Math.floor(Math.random() * ANIMATIONS.length)])
    if (isAuthed) {
      try {
        const res = await fetch(`/api/buddies/${buddy.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'play' }),
        })
        if (!res.ok) throw new Error('Failed to play')
        const data = await res.json()
        setBuddies(prev => prev.map(b => b.id === buddy.id ? data.buddy : b))
      } catch { setError('Failed to play with buddy') }
    } else {
      const updated = buddies.map(b => {
        if (b.id !== buddy.id) return b
        const newXp = b.xp + 25
        return { ...b, happiness: Math.min(100, b.happiness + 15), xp: newXp, level: Math.floor(newXp / 100) + 1, lastPlayed: Date.now() }
      })
      setBuddies(updated)
      localStorage.setItem('agentbot_buddies', JSON.stringify(updated))
    }
  }

  const getAnimationClass = () => {
    switch (animation) {
      case 'spin': return 'animate-spin'
      case 'bounce': return 'animate-bounce'
      case 'float': return 'animate-pulse'
      case 'pulse': return 'animate-ping'
      case 'wiggle': return 'animate-pulse'
      default: return 'animate-bounce'
    }
  }

  if (fetching) {
    return (
      <main className="min-h-screen bg-black text-white font-mono flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-zinc-500" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white font-mono">
      {/* Tutorial Overlay */}
      {showTutorial && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-md w-full p-6 relative">
            <button onClick={dismissTutorial} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="text-5xl mb-4">{TUTORIAL_STEPS[tutorialStep].icon}</div>
              <h3 className="text-xl font-bold mb-2">{TUTORIAL_STEPS[tutorialStep].title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{TUTORIAL_STEPS[tutorialStep].body}</p>
            </div>

            {/* Progress dots */}
            <div className="flex justify-center gap-2 mb-6">
              {TUTORIAL_STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setTutorialStep(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${i === tutorialStep ? 'bg-white' : 'bg-zinc-700'}`}
                />
              ))}
            </div>

            <div className="flex gap-3">
              {tutorialStep > 0 && (
                <button
                  onClick={() => setTutorialStep(tutorialStep - 1)}
                  className="flex-1 bg-zinc-800 border border-zinc-700 py-3 rounded-lg font-bold text-sm hover:bg-zinc-700 transition-colors"
                >
                  Back
                </button>
              )}
              {tutorialStep < TUTORIAL_STEPS.length - 1 ? (
                <button
                  onClick={() => setTutorialStep(tutorialStep + 1)}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 py-3 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={dismissTutorial}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 py-3 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  Start Hatching <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-4">New Feature</div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter uppercase mb-4">
            Agentbot Babies
          </h1>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Hatch, raise, and trade digital companions. Your AI agent&apos;s babies.
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            {!isAuthed && (
              <p className="text-yellow-500/80 text-xs">
                Sign in to save your buddies permanently.
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => { setShowTutorial(true); setTutorialStep(0) }}
                className="text-zinc-500 hover:text-white text-xs flex items-center gap-1 border border-zinc-800 px-3 py-1 rounded-full hover:border-zinc-600 transition-colors"
              >
                <HelpCircle className="w-3 h-3" /> How it works
              </button>
              <a
                href="/buddies/guide"
                className="text-zinc-500 hover:text-white text-xs flex items-center gap-1 border border-zinc-800 px-3 py-1 rounded-full hover:border-zinc-600 transition-colors"
              >
                <BookOpen className="w-3 h-3" /> Full guide
              </a>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        {/* How It Works - Inline Steps (shown when no buddies) */}
        {buddies.length === 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-bold uppercase tracking-tight mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" /> Getting Started
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
                <div className="text-3xl mb-3">🥚</div>
                <div className="font-bold text-sm mb-1">1. Hatch</div>
                <p className="text-xs text-zinc-500">Click &quot;Hatch Egg&quot; to get a random buddy. Rarer types are harder to find.</p>
              </div>
              <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
                <div className="text-3xl mb-3">🎮</div>
                <div className="font-bold text-sm mb-1">2. Interact</div>
                <p className="text-xs text-zinc-500">Feed to restore energy (+20). Play to boost happiness (+15). Both earn XP.</p>
              </div>
              <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
                <div className="text-3xl mb-3">⭐</div>
                <div className="font-bold text-sm mb-1">3. Level Up</div>
                <p className="text-xs text-zinc-500">Earn 100 XP per level. Higher levels mean stronger companions.</p>
              </div>
            </div>
          </div>
        )}

        {/* Current Buddies */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold uppercase tracking-tight">Your Buddies</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowRarityInfo(!showRarityInfo)}
                className="text-zinc-500 hover:text-white transition-colors"
                title="View rarity info"
              >
                <Info className="w-5 h-5" />
              </button>
              <button
                onClick={hatchNewBuddy}
                disabled={loading}
                className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Hatching...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Egg className="w-4 h-4" /> Hatch Egg
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Rarity Info Panel */}
          {showRarityInfo && (
            <div className="mb-6 bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
              <div className="text-xs uppercase tracking-wider text-zinc-500 mb-3">Rarity Tiers &amp; Drop Rates</div>
              <div className="space-y-2">
                {(Object.entries(BUDDY_TYPES) as [BuddyType, typeof BUDDY_TYPES[BuddyType]][]).map(([key, info]) => {
                  const rates: Record<BuddyType, string> = { crab: '37.5%', robot: '25%', ghost: '12.5%', dragon: '12.5%', alien: '12.5%' }
                  return (
                    <div key={key} className="flex items-center gap-3 text-sm">
                      <span className="text-xl w-8 text-center">{info.emoji}</span>
                      <span className={`font-bold w-28 bg-gradient-to-r ${info.color} bg-clip-text text-transparent`}>{info.rarity}</span>
                      <span className="text-zinc-400 flex-1">{info.desc}</span>
                      <span className="text-zinc-500 text-xs font-mono w-16 text-right">{rates[key]}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {buddies.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <Egg className="w-16 h-16 mx-auto mb-4 opacity-50 animate-bounce" />
              <p className="mb-2">No buddies yet!</p>
              <p className="text-xs text-zinc-600">Click &quot;Hatch Egg&quot; above to get your first companion.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {buddies.map((buddy) => {
                const info = BUDDY_TYPES[buddy.type]
                return (
                  <button
                    key={buddy.id}
                    onClick={() => setSelectedBuddy(buddy)}
                    className={`bg-zinc-800 rounded-xl p-4 text-left hover:border-zinc-600 transition-colors border ${
                      selectedBuddy?.id === buddy.id ? 'border-white' : 'border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${info.color} flex items-center justify-center text-2xl ${getAnimationClass()}`}>
                        {info.emoji}
                      </div>
                      <div>
                        <div className="font-bold">{buddy.name}</div>
                        <div className="text-xs text-zinc-500">{info.rarity}</div>
                      </div>
                    </div>
                    <div className="flex gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        <span>Lvl {buddy.level}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-yellow-400" />
                        <span>{buddy.energy}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="w-3 h-3 text-red-400" />
                        <span>{buddy.happiness}%</span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Selected Buddy Details */}
        {selectedBuddy && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-4 mb-2">
              <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${BUDDY_TYPES[selectedBuddy.type].color} flex items-center justify-center text-5xl ${getAnimationClass()}`}>
                {BUDDY_TYPES[selectedBuddy.type].emoji}
              </div>
              <div>
                <h3 className="text-2xl font-bold">{selectedBuddy.name}</h3>
                <p className="text-zinc-400">{BUDDY_TYPES[selectedBuddy.type].name}</p>
              </div>
            </div>
            <p className="text-xs text-zinc-600 mb-6 ml-1">{BUDDY_TYPES[selectedBuddy.type].desc}</p>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-3 mb-6">
              <div className="bg-zinc-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-zinc-500 text-xs uppercase mb-2">
                  <Zap className="w-4 h-4" /> Energy
                </div>
                <div className="w-full bg-zinc-700 rounded-full h-2">
                  <div className="bg-yellow-400 h-2 rounded-full transition-all" style={{ width: `${selectedBuddy.energy}%` }} />
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-zinc-600 text-xs">Feed to restore</span>
                  <span>{selectedBuddy.energy}/100</span>
                </div>
              </div>
              <div className="bg-zinc-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-zinc-500 text-xs uppercase mb-2">
                  <Heart className="w-4 h-4" /> Happiness
                </div>
                <div className="w-full bg-zinc-700 rounded-full h-2">
                  <div className="bg-pink-400 h-2 rounded-full transition-all" style={{ width: `${selectedBuddy.happiness}%` }} />
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-zinc-600 text-xs">Play to boost</span>
                  <span>{selectedBuddy.happiness}/100</span>
                </div>
              </div>
              <div className="bg-zinc-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-zinc-500 text-xs uppercase mb-2">
                  <Star className="w-4 h-4" /> XP Progress
                </div>
                <div className="w-full bg-zinc-700 rounded-full h-2">
                  <div className="bg-purple-400 h-2 rounded-full transition-all" style={{ width: `${(selectedBuddy.xp % 100)}%` }} />
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-zinc-600 text-xs">{100 - (selectedBuddy.xp % 100)} XP to next level</span>
                  <span>{selectedBuddy.xp} XP</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => feedBuddy(selectedBuddy)}
                disabled={selectedBuddy.energy >= 100}
                className="flex-1 bg-orange-500/20 border border-orange-500/50 text-orange-400 py-3 rounded-lg font-bold hover:bg-orange-500/30 transition-colors disabled:opacity-50"
              >
                {selectedBuddy.energy >= 100 ? 'Full Energy' : 'Feed (+20 Energy)'}
              </button>
              <button
                onClick={() => playWithBuddy(selectedBuddy)}
                disabled={selectedBuddy.happiness >= 100}
                className="flex-1 bg-blue-500/20 border border-blue-500/50 text-blue-400 py-3 rounded-lg font-bold hover:bg-blue-500/30 transition-colors disabled:opacity-50"
              >
                {selectedBuddy.happiness >= 100 ? 'Max Happy' : 'Play (+25 XP)'}
              </button>
            </div>
          </div>
        )}

        {/* Unicode Animations Showcase */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold uppercase tracking-tight mb-6">Unicode Animations</h2>
          <div className="grid gap-4 sm:grid-cols-5">
            {[
              { chars: '\u25D0 \u25D1 \u25D2 \u25D3', name: 'Spinner' },
              { chars: '\u2596 \u2597 \u2598 \u2599', name: 'Blocks' },
              { chars: '\u2524 \u2526 \u2527 \u2528 \u2529 \u252A \u252B', name: 'Bars' },
              { chars: '\u258C\u2580\u2584\u258C\u2580\u2584\u258C', name: 'Wave' },
              { chars: '\u280B\u2819\u2839\u2838\u283C\u2834\u2826\u2827', name: 'Braille' },
            ].map((item) => (
              <div key={item.name} className="bg-zinc-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-mono mb-2 animate-pulse">{item.chars}</div>
                <div className="text-xs text-zinc-500">{item.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Voice Mode */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Voice Mode</h2>
              <p className="text-zinc-400 text-sm">Enable voice interactions with your agent</p>
            </div>
            <button className="bg-green-500/20 border border-green-500/50 text-green-400 px-6 py-3 rounded-lg font-bold hover:bg-green-500/30 transition-colors">
              <span className="flex items-center gap-2">
                <Music className="w-5 h-5" /> Enable
              </span>
            </button>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center">
          <a href="/dashboard" className="text-zinc-500 hover:text-white text-sm">
            &larr; Back to Dashboard
          </a>
        </div>
      </div>
    </main>
  )
}
