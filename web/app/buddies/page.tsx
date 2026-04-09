'use client'

import { useState, useEffect } from 'react'
import { Egg, Heart, Zap, Star, Coins, RefreshCw, MessageCircle, Music } from 'lucide-react'

type BuddyType = 'crab' | 'robot' | 'ghost' | 'dragon' | 'alien'

interface Buddy {
  id: string
  name: string
  type: BuddyType
  level: number
  xp: number
  energy: number
  happiness: number
  lastFed: number
  lastPlayed: number
}

const BUDDY_TYPES: Record<BuddyType, { emoji: string; name: string; rarity: string; color: string }> = {
  crab: { emoji: '🤖', name: 'Agentbot Baby', rarity: 'Common', color: 'from-blue-500 to-cyan-500' },
  robot: { emoji: '⚡', name: 'Spark Agent', rarity: 'Uncommon', color: 'from-yellow-500 to-orange-500' },
  ghost: { emoji: '👻', name: 'Ghost Agent', rarity: 'Rare', color: 'from-purple-500 to-pink-500' },
  dragon: { emoji: '🐉', name: 'Dragon Agent', rarity: 'Epic', color: 'from-green-500 to-emerald-500' },
  alien: { emoji: '👽', name: 'Alien Agent', rarity: 'Legendary', color: 'from-red-500 to-amber-500' },
}

const ANIMATIONS = ['spin', 'bounce', 'float', 'pulse', 'wiggle']

export default function BlockchainBuddiesPage() {
  const [buddies, setBuddies] = useState<Buddy[]>([])
  const [selectedBuddy, setSelectedBuddy] = useState<Buddy | null>(null)
  const [loading, setLoading] = useState(false)
  const [animation, setAnimation] = useState('bounce')

  useEffect(() => {
    const saved = localStorage.getItem('agentbot_buddies')
    if (saved) {
      setBuddies(JSON.parse(saved))
    } else {
      setBuddies([
        { id: '1', name: 'Baby', type: 'crab', level: 1, xp: 0, energy: 100, happiness: 80, lastFed: Date.now(), lastPlayed: Date.now() },
      ])
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('agentbot_buddies', JSON.stringify(buddies))
  }, [buddies])

  const hatchNewBuddy = () => {
    setLoading(true)
    setTimeout(() => {
      const types: BuddyType[] = ['crab', 'crab', 'crab', 'robot', 'robot', 'ghost', 'dragon', 'alien']
      const randomType = types[Math.floor(Math.random() * types.length)]
      const names = ['Bot', 'Agent', 'Claw', 'Byte', 'Nova', 'Pulse', 'Node', 'Flux']
      const newBuddy: Buddy = {
        id: Date.now().toString(),
        name: names[Math.floor(Math.random() * names.length)] + (Math.floor(Math.random() * 99) + 1),
        type: randomType,
        level: 1,
        xp: 0,
        energy: 100,
        happiness: 100,
        lastFed: Date.now(),
        lastPlayed: Date.now(),
      }
      setBuddies([...buddies, newBuddy])
      setSelectedBuddy(newBuddy)
      setLoading(false)
    }, 1500)
  }

  const feedBuddy = (buddy: Buddy) => {
    setBuddies(buddies.map(b => {
      if (b.id === buddy.id) {
        return {
          ...b,
          energy: Math.min(100, b.energy + 20),
          happiness: Math.min(100, b.happiness + 10),
          xp: b.xp + 10,
          lastFed: Date.now(),
        }
      }
      return b
    }))
  }

  const playWithBuddy = (buddy: Buddy) => {
    setAnimation(ANIMATIONS[Math.floor(Math.random() * ANIMATIONS.length)])
    setBuddies(buddies.map(b => {
      if (b.id === buddy.id) {
        return {
          ...b,
          happiness: Math.min(100, b.happiness + 15),
          xp: b.xp + 25,
          lastPlayed: Date.now(),
        }
      }
      return b
    }))
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

  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-4">New Feature</div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter uppercase mb-4">
            Agentbot Babies
          </h1>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Hatch, raise, and trade digital companions. Your AI agent's babies.
          </p>
        </div>

        {/* Current Buddies */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold uppercase tracking-tight">Your Buddies</h2>
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

          {buddies.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <Egg className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No buddies yet. Hatch your first egg!</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {buddies.map((buddy) => {
                const info = BUDDY_TYPES[buddy.type]
                return (
                  <button
                    key={buddy.id}
                    onClick={() => setSelectedBuddy(buddy)}
                    className={`bg-zinc-800 rounded-xl p-4 text-left hover:border-zinc-600 transition-colors ${
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
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${BUDDY_TYPES[selectedBuddy.type].color} flex items-center justify-center text-5xl ${getAnimationClass()}`}>
                {BUDDY_TYPES[selectedBuddy.type].emoji}
              </div>
              <div>
                <h3 className="text-2xl font-bold">{selectedBuddy.name}</h3>
                <p className="text-zinc-400">{BUDDY_TYPES[selectedBuddy.type].name}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-3 mb-6">
              <div className="bg-zinc-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-zinc-500 text-xs uppercase mb-2">
                  <Zap className="w-4 h-4" /> Energy
                </div>
                <div className="w-full bg-zinc-700 rounded-full h-2">
                  <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${selectedBuddy.energy}%` }} />
                </div>
                <div className="text-right text-sm mt-1">{selectedBuddy.energy}/100</div>
              </div>
              <div className="bg-zinc-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-zinc-500 text-xs uppercase mb-2">
                  <Heart className="w-4 h-4" /> Happiness
                </div>
                <div className="w-full bg-zinc-700 rounded-full h-2">
                  <div className="bg-pink-400 h-2 rounded-full" style={{ width: `${selectedBuddy.happiness}%` }} />
                </div>
                <div className="text-right text-sm mt-1">{selectedBuddy.happiness}/100</div>
              </div>
              <div className="bg-zinc-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-zinc-500 text-xs uppercase mb-2">
                  <Star className="w-4 h-4" /> XP Progress
                </div>
                <div className="w-full bg-zinc-700 rounded-full h-2">
                  <div className="bg-purple-400 h-2 rounded-full" style={{ width: `${(selectedBuddy.xp % 100)}%` }} />
                </div>
                <div className="text-right text-sm mt-1">{selectedBuddy.xp} XP</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => feedBuddy(selectedBuddy)}
                disabled={selectedBuddy.energy >= 100}
                className="flex-1 bg-orange-500/20 border border-orange-500/50 text-orange-400 py-3 rounded-lg font-bold hover:bg-orange-500/30 transition-colors disabled:opacity-50"
              >
                🍕 Feed
              </button>
              <button
                onClick={() => playWithBuddy(selectedBuddy)}
                disabled={selectedBuddy.happiness >= 100}
                className="flex-1 bg-blue-500/20 border border-blue-500/50 text-blue-400 py-3 rounded-lg font-bold hover:bg-blue-500/30 transition-colors disabled:opacity-50"
              >
                🎮 Play
              </button>
            </div>
          </div>
        )}

        {/* Unicode Animations Showcase */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold uppercase tracking-tight mb-6">Unicode Animations</h2>
          <div className="grid gap-4 sm:grid-cols-5">
            {[
              { chars: '◐ ◑ ◒ ◓', name: 'Spinner' },
              { chars: '▖ ▗ ▘ ▙', name: 'Blocks' },
              { chars: '┤ ┦ ┧ ┨ ┩ ┪ ┫', name: 'Bars' },
              { chars: '▌▀▄▌▀▄▌', name: 'Wave' },
              { chars: '⠋⠙⠹⠸⠼⠴⠦⠧', name: 'Braille' },
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
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </main>
  )
}