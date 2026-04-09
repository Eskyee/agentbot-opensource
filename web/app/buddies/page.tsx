'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Egg, Heart, Zap, Star, RefreshCw, HelpCircle, X, ChevronRight, ArrowRight, BookOpen, Sparkles, Info, Dumbbell, Pencil, Check, Trophy, Trash2 } from 'lucide-react'

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

const BUDDY_TYPES: Record<BuddyType, { emoji: string; name: string; rarity: string; color: string; border: string; desc: string }> = {
  crab: { emoji: '🤖', name: 'Agentbot Baby', rarity: 'Common', color: 'from-blue-500 to-cyan-500', border: 'border-cyan-500/30', desc: 'Your basic AI companion. Reliable and eager to learn.' },
  robot: { emoji: '⚡', name: 'Spark Agent', rarity: 'Uncommon', color: 'from-yellow-500 to-orange-500', border: 'border-yellow-500/30', desc: 'Charged with energy. Gains XP faster from play.' },
  ghost: { emoji: '👻', name: 'Ghost Agent', rarity: 'Rare', color: 'from-purple-500 to-pink-500', border: 'border-purple-500/30', desc: 'Mysterious and elusive. Hard to find in eggs.' },
  dragon: { emoji: '🐉', name: 'Dragon Agent', rarity: 'Epic', color: 'from-green-500 to-emerald-500', border: 'border-green-500/30', desc: 'Powerful and wise. A prized companion.' },
  alien: { emoji: '👽', name: 'Alien Agent', rarity: 'Legendary', color: 'from-red-500 to-amber-500', border: 'border-red-500/30', desc: 'Otherworldly rare. The ultimate buddy.' },
}

const RARITY_ORDER: BuddyType[] = ['crab', 'robot', 'ghost', 'dragon', 'alien']

const HATCH_NAMES = ['Bot', 'Agent', 'Claw', 'Byte', 'Nova', 'Pulse', 'Node', 'Flux']
const HATCH_TYPES: BuddyType[] = ['crab', 'crab', 'crab', 'robot', 'robot', 'ghost', 'dragon', 'alien']

const MOOD_MESSAGES: Record<string, string[]> = {
  happy: ['Life is good!', 'I love you!', 'Best day ever!', 'Woo!', 'Let\'s gooo!'],
  content: ['Doing alright', 'Chilling...', 'Not bad!', 'Vibing', 'All good'],
  neutral: ['Meh...', 'Could be better', 'I\'m okay I guess', 'Hmm...'],
  sad: ['I\'m hungry...', 'Play with me?', 'So bored...', 'Feed me please!'],
  critical: ['HELP ME!', 'I\'m starving!', 'Don\'t leave me!', 'SOS!'],
}

function getMood(energy: number, happiness: number): string {
  const avg = (energy + happiness) / 2
  if (avg >= 90) return 'happy'
  if (avg >= 70) return 'content'
  if (avg >= 50) return 'neutral'
  if (avg >= 25) return 'sad'
  return 'critical'
}

function getMoodEmoji(mood: string): string {
  switch (mood) {
    case 'happy': return '😄'
    case 'content': return '🙂'
    case 'neutral': return '😐'
    case 'sad': return '😢'
    case 'critical': return '😱'
    default: return '🙂'
  }
}

function getRandomMessage(mood: string): string {
  const msgs = MOOD_MESSAGES[mood] || MOOD_MESSAGES.neutral
  return msgs[Math.floor(Math.random() * msgs.length)]
}

const TUTORIAL_STEPS = [
  { title: 'Welcome to Agentbot Babies!', body: 'Digital companions that live alongside your AI agent. Hatch eggs, raise buddies, and watch them grow.', icon: '🥚' },
  { title: 'Hatch an Egg', body: 'Click "Hatch Egg" to receive a random buddy. Each egg rolls from 5 rarity tiers -- Common to Legendary.', icon: '🎲' },
  { title: 'Feed, Play & Train', body: 'Feed restores energy. Play boosts happiness. Train costs energy but gives massive XP. All earn XP toward leveling up.', icon: '🎮' },
  { title: 'Level Up & Collect', body: 'Earn 100 XP per level. Collect all 5 rarity types. Rename your favorites. Compete for the highest levels.', icon: '⭐' },
  { title: 'Sign In to Save', body: 'Your buddies are saved to the cloud when signed in. Guest data is local only and may be lost.', icon: '☁️' },
]

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'levelup' | 'info'
}

export default function BuddiesPage() {
  const [buddies, setBuddies] = useState<Buddy[]>([])
  const [selectedBuddy, setSelectedBuddy] = useState<Buddy | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [isAuthed, setIsAuthed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [showTutorial, setShowTutorial] = useState(false)
  const [tutorialStep, setTutorialStep] = useState(0)
  const [showRarityInfo, setShowRarityInfo] = useState(false)
  const [hatchAnimation, setHatchAnimation] = useState(false)
  const [hatchResult, setHatchResult] = useState<Buddy | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [toasts, setToasts] = useState<Toast[]>([])
  const [speechBubble, setSpeechBubble] = useState('')
  const [actionCooldown, setActionCooldown] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const toastCounter = useRef(0)
  const speechTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const addToast = (message: string, type: Toast['type'] = 'success') => {
    const id = ++toastCounter.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }

  const showSpeech = (buddy: Buddy) => {
    const mood = getMood(buddy.energy, buddy.happiness)
    setSpeechBubble(getRandomMessage(mood))
    if (speechTimer.current) clearTimeout(speechTimer.current)
    speechTimer.current = setTimeout(() => setSpeechBubble(''), 3000)
  }

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
    setHatchAnimation(true)
    setHatchResult(null)
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
        setTimeout(() => {
          setHatchAnimation(false)
          setHatchResult(data.buddy)
          setBuddies(prev => [...prev, data.buddy])
          setSelectedBuddy(data.buddy)
          addToast(`${BUDDY_TYPES[data.buddy.type as BuddyType].emoji} ${data.buddy.name} hatched! (${BUDDY_TYPES[data.buddy.type as BuddyType].rarity})`, data.buddy.type === 'alien' || data.buddy.type === 'dragon' ? 'levelup' : 'success')
          setLoading(false)
        }, 2000)
      } catch (e: unknown) {
        setHatchAnimation(false)
        setError(e instanceof Error ? e.message : 'Failed to hatch buddy')
        setLoading(false)
      }
    } else {
      setTimeout(() => {
        const newBuddy: Buddy = {
          id: Date.now().toString(), name, type: randomType,
          level: 1, xp: 0, energy: 50, happiness: 50,
          lastFed: Date.now(), lastPlayed: Date.now(),
        }
        setHatchAnimation(false)
        setHatchResult(newBuddy)
        const updated = [...buddies, newBuddy]
        setBuddies(updated)
        setSelectedBuddy(newBuddy)
        localStorage.setItem('agentbot_buddies', JSON.stringify(updated))
        addToast(`${BUDDY_TYPES[randomType].emoji} ${name} hatched! (${BUDDY_TYPES[randomType].rarity})`, randomType === 'alien' || randomType === 'dragon' ? 'levelup' : 'success')
        setLoading(false)
      }, 2000)
    }
  }

  const doAction = async (buddy: Buddy, action: 'feed' | 'play' | 'train') => {
    if (actionCooldown) return
    setActionCooldown(true)
    setTimeout(() => setActionCooldown(false), 500)
    setError(null)

    if (isAuthed) {
      try {
        const res = await fetch(`/api/buddies/${buddy.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Action failed')
        setBuddies(prev => prev.map(b => b.id === buddy.id ? data.buddy : b))
        showSpeech(data.buddy)
        if (data.leveledUp) addToast(`LEVEL UP! ${data.buddy.name} is now level ${data.buddy.level}!`, 'levelup')
        else if (action === 'feed') addToast(`Fed ${buddy.name}! +20 energy, +10 XP`)
        else if (action === 'play') addToast(`Played with ${buddy.name}! +15 happy, +25 XP`)
        else if (action === 'train') addToast(`Trained ${buddy.name}! -30 energy, +50 XP`)
      } catch (e: unknown) {
        addToast(e instanceof Error ? e.message : 'Action failed', 'error')
      }
    } else {
      const updated = buddies.map(b => {
        if (b.id !== buddy.id) return b
        let newEnergy = b.energy, newHappiness = b.happiness, newXp = b.xp
        if (action === 'feed') { newEnergy = Math.min(100, b.energy + 20); newHappiness = Math.min(100, b.happiness + 10); newXp = b.xp + 10 }
        else if (action === 'play') { newHappiness = Math.min(100, b.happiness + 15); newXp = b.xp + 25 }
        else if (action === 'train') {
          if (b.energy < 30) { addToast('Not enough energy to train (need 30)', 'error'); return b }
          newEnergy = Math.max(0, b.energy - 30); newHappiness = Math.max(0, b.happiness - 10); newXp = b.xp + 50
        }
        const newLevel = Math.floor(newXp / 100) + 1
        const leveled = newLevel > b.level
        const result = { ...b, energy: newEnergy, happiness: newHappiness, xp: newXp, level: newLevel, lastFed: action === 'feed' ? Date.now() : b.lastFed, lastPlayed: action === 'play' ? Date.now() : b.lastPlayed }
        showSpeech(result)
        if (leveled) addToast(`LEVEL UP! ${b.name} is now level ${newLevel}!`, 'levelup')
        else if (action === 'feed') addToast(`Fed ${b.name}! +20 energy, +10 XP`)
        else if (action === 'play') addToast(`Played with ${b.name}! +15 happy, +25 XP`)
        else if (action === 'train') addToast(`Trained ${b.name}! -30 energy, +50 XP`)
        return result
      })
      setBuddies(updated)
      localStorage.setItem('agentbot_buddies', JSON.stringify(updated))
    }
  }

  const renameBuddy = async (buddy: Buddy) => {
    if (!renameValue.trim()) return
    if (isAuthed) {
      try {
        const res = await fetch(`/api/buddies/${buddy.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'rename', newName: renameValue.trim() }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Rename failed')
        setBuddies(prev => prev.map(b => b.id === buddy.id ? data.buddy : b))
        addToast(`Renamed to ${renameValue.trim()}!`)
      } catch (e: unknown) {
        addToast(e instanceof Error ? e.message : 'Rename failed', 'error')
      }
    } else {
      const updated = buddies.map(b => b.id === buddy.id ? { ...b, name: renameValue.trim() } : b)
      setBuddies(updated)
      localStorage.setItem('agentbot_buddies', JSON.stringify(updated))
      addToast(`Renamed to ${renameValue.trim()}!`)
    }
    setRenamingId(null)
    setRenameValue('')
  }

  const deleteBuddy = async (buddy: Buddy) => {
    if (isAuthed) {
      try {
        const res = await fetch(`/api/buddies/${buddy.id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Delete failed')
      } catch { addToast('Failed to delete', 'error'); return }
    }
    const updated = buddies.filter(b => b.id !== buddy.id)
    setBuddies(updated)
    if (!isAuthed) localStorage.setItem('agentbot_buddies', JSON.stringify(updated))
    if (selectedBuddy?.id === buddy.id) setSelectedBuddy(null)
    addToast(`${buddy.name} released`, 'info')
    setConfirmDelete(null)
  }

  // Collection stats
  const collectedTypes = new Set(buddies.map(b => b.type))
  const totalTypes = RARITY_ORDER.length
  const highestLevel = buddies.length > 0 ? Math.max(...buddies.map(b => b.level)) : 0
  const totalXp = buddies.reduce((sum, b) => sum + b.xp, 0)

  if (fetching) {
    return (
      <main className="min-h-screen bg-black text-white font-mono flex items-center justify-center">
        <div className="text-center">
          <Egg className="w-12 h-12 mx-auto mb-3 animate-bounce text-purple-400" />
          <p className="text-zinc-500 text-sm">Loading your buddies...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white font-mono relative">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-xl text-sm font-bold shadow-lg animate-bounce pointer-events-auto ${
              toast.type === 'levelup' ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black' :
              toast.type === 'error' ? 'bg-red-500/90 text-white' :
              toast.type === 'info' ? 'bg-zinc-700 text-white' :
              'bg-green-500/90 text-white'
            }`}
          >
            {toast.type === 'levelup' && '🎉 '}{toast.message}
          </div>
        ))}
      </div>

      {/* Tutorial Overlay */}
      {showTutorial && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-md w-full p-6 relative">
            <button onClick={dismissTutorial} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">{TUTORIAL_STEPS[tutorialStep].icon}</div>
              <h3 className="text-xl font-bold mb-2">{TUTORIAL_STEPS[tutorialStep].title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{TUTORIAL_STEPS[tutorialStep].body}</p>
            </div>
            <div className="flex justify-center gap-2 mb-6">
              {TUTORIAL_STEPS.map((_, i) => (
                <button key={i} onClick={() => setTutorialStep(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${i === tutorialStep ? 'bg-white scale-125' : 'bg-zinc-700'}`} />
              ))}
            </div>
            <div className="flex gap-3">
              {tutorialStep > 0 && (
                <button onClick={() => setTutorialStep(tutorialStep - 1)}
                  className="flex-1 bg-zinc-800 border border-zinc-700 py-3 rounded-lg font-bold text-sm hover:bg-zinc-700 transition-colors">
                  Back
                </button>
              )}
              {tutorialStep < TUTORIAL_STEPS.length - 1 ? (
                <button onClick={() => setTutorialStep(tutorialStep + 1)}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 py-3 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={dismissTutorial}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 py-3 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                  Start Hatching <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hatch Animation Overlay */}
      {hatchAnimation && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
          <div className="text-center">
            <div className="text-8xl animate-bounce mb-4">🥚</div>
            <div className="flex items-center gap-2 text-zinc-400">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm">Hatching...</span>
            </div>
          </div>
        </div>
      )}

      {/* Hatch Result Reveal */}
      {hatchResult && !hatchAnimation && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setHatchResult(null)}>
          <div className="text-center animate-bounce" onClick={e => e.stopPropagation()}>
            <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${BUDDY_TYPES[hatchResult.type].color} flex items-center justify-center text-7xl mx-auto mb-6 shadow-2xl shadow-purple-500/20`}>
              {BUDDY_TYPES[hatchResult.type].emoji}
            </div>
            <h3 className="text-3xl font-bold mb-1">{hatchResult.name}</h3>
            <p className={`text-lg font-bold bg-gradient-to-r ${BUDDY_TYPES[hatchResult.type].color} bg-clip-text text-transparent mb-2`}>
              {BUDDY_TYPES[hatchResult.type].rarity} {BUDDY_TYPES[hatchResult.type].name}
            </p>
            <p className="text-zinc-500 text-sm mb-6">{BUDDY_TYPES[hatchResult.type].desc}</p>
            <button onClick={() => setHatchResult(null)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity">
              Awesome!
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-4">New Feature</div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter uppercase mb-4">
            Agentbot Babies
          </h1>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Hatch, raise, and level up digital companions. Your AI agent&apos;s babies.
          </p>
          <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
            {!isAuthed && (
              <span className="text-yellow-500/80 text-xs bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-full">
                Guest mode -- sign in to save
              </span>
            )}
            <button onClick={() => { setShowTutorial(true); setTutorialStep(0) }}
              className="text-zinc-500 hover:text-white text-xs flex items-center gap-1 border border-zinc-800 px-3 py-1 rounded-full hover:border-zinc-600 transition-colors">
              <HelpCircle className="w-3 h-3" /> How it works
            </button>
            <a href="/buddies/guide"
              className="text-zinc-500 hover:text-white text-xs flex items-center gap-1 border border-zinc-800 px-3 py-1 rounded-full hover:border-zinc-600 transition-colors">
              <BookOpen className="w-3 h-3" /> Full guide
            </a>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg mb-6 text-center">{error}</div>
        )}

        {/* Collection Tracker */}
        {buddies.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-4 mb-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">{buddies.length}</div>
              <div className="text-xs text-zinc-500 uppercase">Buddies</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">{collectedTypes.size}/{totalTypes}</div>
              <div className="text-xs text-zinc-500 uppercase">Types Found</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold flex items-center justify-center gap-1"><Trophy className="w-4 h-4 text-yellow-400" />{highestLevel}</div>
              <div className="text-xs text-zinc-500 uppercase">Highest Lvl</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">{totalXp.toLocaleString()}</div>
              <div className="text-xs text-zinc-500 uppercase">Total XP</div>
            </div>
          </div>
        )}

        {/* Collection Progress */}
        {buddies.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-8">
            <div className="flex items-center gap-4">
              <span className="text-xs text-zinc-500 uppercase whitespace-nowrap">Collection</span>
              <div className="flex gap-2 flex-1">
                {RARITY_ORDER.map(type => {
                  const info = BUDDY_TYPES[type]
                  const owned = collectedTypes.has(type)
                  return (
                    <div key={type} title={`${info.rarity}: ${info.name}`}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all ${owned ? `bg-gradient-to-br ${info.color} shadow-lg` : 'bg-zinc-800 opacity-30 grayscale'}`}>
                      {info.emoji}
                    </div>
                  )
                })}
              </div>
              {collectedTypes.size === totalTypes && (
                <span className="text-xs text-yellow-400 font-bold whitespace-nowrap">COMPLETE!</span>
              )}
            </div>
          </div>
        )}

        {/* Getting Started */}
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
                <p className="text-xs text-zinc-500">Feed, play, and train. Each action gives different stat boosts and XP.</p>
              </div>
              <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
                <div className="text-3xl mb-3">⭐</div>
                <div className="font-bold text-sm mb-1">3. Collect &amp; Level</div>
                <p className="text-xs text-zinc-500">Find all 5 types. Level up your favorites. Compete for the highest stats.</p>
              </div>
            </div>
          </div>
        )}

        {/* Buddies Grid */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold uppercase tracking-tight">Your Buddies</h2>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowRarityInfo(!showRarityInfo)} className="text-zinc-500 hover:text-white transition-colors" title="Rarity info">
                <Info className="w-5 h-5" />
              </button>
              <button onClick={hatchNewBuddy} disabled={loading}
                className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
                {loading ? (
                  <span className="flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" /> Hatching...</span>
                ) : (
                  <span className="flex items-center gap-2"><Egg className="w-4 h-4" /> Hatch Egg</span>
                )}
              </button>
            </div>
          </div>

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
                      <span className="text-zinc-400 flex-1 hidden sm:block">{info.desc}</span>
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
                const mood = getMood(buddy.energy, buddy.happiness)
                const isSelected = selectedBuddy?.id === buddy.id
                return (
                  <button key={buddy.id} onClick={() => { setSelectedBuddy(buddy); showSpeech(buddy) }}
                    className={`bg-zinc-800 rounded-xl p-4 text-left transition-all border relative group ${
                      isSelected ? `border-white shadow-lg shadow-white/5 ${info.border}` : 'border-zinc-700 hover:border-zinc-600'
                    }`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${info.color} flex items-center justify-center text-2xl relative`}>
                        {info.emoji}
                        <span className="absolute -bottom-1 -right-1 text-xs">{getMoodEmoji(mood)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold truncate">{buddy.name}</div>
                        <div className="text-xs text-zinc-500">{info.rarity}</div>
                      </div>
                    </div>
                    {/* Mini stat bars */}
                    <div className="space-y-1.5 mb-2">
                      <div className="flex items-center gap-2">
                        <Zap className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                        <div className="flex-1 bg-zinc-700 rounded-full h-1.5">
                          <div className="bg-yellow-400 h-1.5 rounded-full transition-all" style={{ width: `${buddy.energy}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Heart className="w-3 h-3 text-pink-400 flex-shrink-0" />
                        <div className="flex-1 bg-zinc-700 rounded-full h-1.5">
                          <div className="bg-pink-400 h-1.5 rounded-full transition-all" style={{ width: `${buddy.happiness}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 text-xs text-zinc-500">
                      <span className="flex items-center gap-1"><Star className="w-3 h-3" /> Lvl {buddy.level}</span>
                      <span>{buddy.xp} XP</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Selected Buddy Detail */}
        {selectedBuddy && (() => {
          const info = BUDDY_TYPES[selectedBuddy.type]
          const mood = getMood(selectedBuddy.energy, selectedBuddy.happiness)
          const xpToNext = 100 - (selectedBuddy.xp % 100)
          return (
            <div className={`bg-zinc-900 border rounded-2xl p-6 mb-8 ${info.border} border-zinc-800`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${info.color} flex items-center justify-center text-5xl shadow-lg`}>
                      {info.emoji}
                    </div>
                    <span className="absolute -bottom-1 -right-1 text-xl">{getMoodEmoji(mood)}</span>
                    {/* Level badge */}
                    <span className="absolute -top-1 -left-1 bg-zinc-800 border border-zinc-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      Lv{selectedBuddy.level}
                    </span>
                  </div>
                  <div>
                    {renamingId === selectedBuddy.id ? (
                      <div className="flex items-center gap-2">
                        <input value={renameValue} onChange={e => setRenameValue(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && renameBuddy(selectedBuddy)}
                          className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-lg font-bold w-32 focus:outline-none focus:border-purple-500"
                          autoFocus maxLength={30} />
                        <button onClick={() => renameBuddy(selectedBuddy)} className="text-green-400 hover:text-green-300"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setRenamingId(null)} className="text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h3 className="text-2xl font-bold">{selectedBuddy.name}</h3>
                        <button onClick={() => { setRenamingId(selectedBuddy.id); setRenameValue(selectedBuddy.name) }}
                          className="text-zinc-600 hover:text-white transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                    <p className={`text-sm font-bold bg-gradient-to-r ${info.color} bg-clip-text text-transparent`}>{info.rarity} {info.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {confirmDelete === selectedBuddy.id ? (
                    <>
                      <button onClick={() => deleteBuddy(selectedBuddy)} className="text-red-400 text-xs border border-red-500/30 px-2 py-1 rounded hover:bg-red-500/10">Confirm</button>
                      <button onClick={() => setConfirmDelete(null)} className="text-zinc-500 text-xs border border-zinc-700 px-2 py-1 rounded hover:bg-zinc-800">Cancel</button>
                    </>
                  ) : (
                    <button onClick={() => setConfirmDelete(selectedBuddy.id)} className="text-zinc-600 hover:text-red-400 transition-colors" title="Release buddy">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Speech bubble */}
              {speechBubble && (
                <div className="ml-24 mb-4 inline-block bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-sm relative">
                  <div className="absolute -left-2 top-3 w-0 h-0 border-t-[6px] border-t-transparent border-r-[8px] border-r-zinc-700 border-b-[6px] border-b-transparent" />
                  &quot;{speechBubble}&quot;
                </div>
              )}

              <p className="text-xs text-zinc-600 mb-5">{info.desc}</p>

              {/* Stats */}
              <div className="grid gap-3 sm:grid-cols-3 mb-6">
                <div className="bg-zinc-800 rounded-lg p-3">
                  <div className="flex items-center justify-between text-xs text-zinc-500 uppercase mb-1.5">
                    <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Energy</span>
                    <span className="text-white font-bold">{selectedBuddy.energy}/100</span>
                  </div>
                  <div className="w-full bg-zinc-700 rounded-full h-2.5">
                    <div className={`h-2.5 rounded-full transition-all duration-500 ${selectedBuddy.energy > 60 ? 'bg-yellow-400' : selectedBuddy.energy > 30 ? 'bg-orange-400' : 'bg-red-400'}`}
                      style={{ width: `${selectedBuddy.energy}%` }} />
                  </div>
                </div>
                <div className="bg-zinc-800 rounded-lg p-3">
                  <div className="flex items-center justify-between text-xs text-zinc-500 uppercase mb-1.5">
                    <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> Happiness</span>
                    <span className="text-white font-bold">{selectedBuddy.happiness}/100</span>
                  </div>
                  <div className="w-full bg-zinc-700 rounded-full h-2.5">
                    <div className={`h-2.5 rounded-full transition-all duration-500 ${selectedBuddy.happiness > 60 ? 'bg-pink-400' : selectedBuddy.happiness > 30 ? 'bg-orange-400' : 'bg-red-400'}`}
                      style={{ width: `${selectedBuddy.happiness}%` }} />
                  </div>
                </div>
                <div className="bg-zinc-800 rounded-lg p-3">
                  <div className="flex items-center justify-between text-xs text-zinc-500 uppercase mb-1.5">
                    <span className="flex items-center gap-1"><Star className="w-3 h-3" /> XP</span>
                    <span className="text-white font-bold">{selectedBuddy.xp} XP</span>
                  </div>
                  <div className="w-full bg-zinc-700 rounded-full h-2.5">
                    <div className="bg-purple-400 h-2.5 rounded-full transition-all duration-500" style={{ width: `${selectedBuddy.xp % 100}%` }} />
                  </div>
                  <div className="text-[10px] text-zinc-600 mt-1">{xpToNext} XP to level {selectedBuddy.level + 1}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="grid gap-3 sm:grid-cols-3">
                <button onClick={() => doAction(selectedBuddy, 'feed')} disabled={actionCooldown}
                  className="bg-orange-500/10 border border-orange-500/30 text-orange-400 py-3 rounded-xl font-bold hover:bg-orange-500/20 transition-all active:scale-95 disabled:opacity-50">
                  <div className="text-lg mb-0.5">🍕</div>
                  <div className="text-sm">Feed</div>
                  <div className="text-[10px] opacity-60">+20 energy, +10 XP</div>
                </button>
                <button onClick={() => doAction(selectedBuddy, 'play')} disabled={actionCooldown}
                  className="bg-blue-500/10 border border-blue-500/30 text-blue-400 py-3 rounded-xl font-bold hover:bg-blue-500/20 transition-all active:scale-95 disabled:opacity-50">
                  <div className="text-lg mb-0.5">🎮</div>
                  <div className="text-sm">Play</div>
                  <div className="text-[10px] opacity-60">+15 happy, +25 XP</div>
                </button>
                <button onClick={() => doAction(selectedBuddy, 'train')} disabled={actionCooldown || selectedBuddy.energy < 30}
                  className={`border py-3 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 ${
                    selectedBuddy.energy >= 30
                      ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-600'
                  }`}>
                  <div className="text-lg mb-0.5"><Dumbbell className="w-5 h-5 mx-auto" /></div>
                  <div className="text-sm">Train</div>
                  <div className="text-[10px] opacity-60">{selectedBuddy.energy >= 30 ? '-30 energy, +50 XP' : 'Need 30 energy'}</div>
                </button>
              </div>
            </div>
          )
        })()}

        {/* Back link */}
        <div className="text-center">
          <a href="/dashboard" className="text-zinc-500 hover:text-white text-sm">&larr; Back to Dashboard</a>
        </div>
      </div>
    </main>
  )
}
