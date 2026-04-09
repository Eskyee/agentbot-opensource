import { Egg, Heart, Zap, Star, ArrowRight, Shield, Gift, TrendingUp } from 'lucide-react'

export default function BuddiesGuidePage() {
  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Guide</div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter uppercase mb-4">
            Agentbot Babies
          </h1>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Everything you need to know about hatching, raising, and leveling up your digital companions.
          </p>
        </div>

        {/* What Are Buddies */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4">What are Agentbot Babies?</h2>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <p className="text-zinc-400 leading-relaxed mb-4">
              Agentbot Babies are digital companions that live alongside your AI agent. Each baby has unique stats,
              a rarity tier, and personality. Care for them by feeding and playing to earn XP and level up.
            </p>
            <p className="text-zinc-400 leading-relaxed">
              When you&apos;re signed in, your buddies are saved to the cloud and persist across devices. 
              Guest users can try the feature with local storage, but data may be lost when clearing browser data.
            </p>
          </div>
        </section>

        {/* How To Play */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold uppercase tracking-tight mb-6">How to Play</h2>
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <Egg className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">Step 1: Hatch an Egg</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-3">
                    Click the <span className="text-purple-400 font-bold">&quot;Hatch Egg&quot;</span> button to receive a random buddy. 
                    Each egg rolls from a pool of 5 rarity tiers. Common types appear most often, while 
                    Legendary buddies are extremely rare.
                  </p>
                  <p className="text-zinc-500 text-xs">You can hatch up to 20 buddies per account.</p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">Step 2: Feed Your Buddy</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-3">
                    Click a buddy card to select it, then press <span className="text-orange-400 font-bold">&quot;Feed&quot;</span>.
                    Each feed restores <span className="text-yellow-400">+20 energy</span> and gives <span className="text-yellow-400">+10 happiness</span> plus <span className="text-purple-400">+10 XP</span>.
                  </p>
                  <p className="text-zinc-500 text-xs">Energy maxes out at 100. You can&apos;t feed when full.</p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">Step 3: Play Together</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-3">
                    Press <span className="text-blue-400 font-bold">&quot;Play&quot;</span> to interact with your buddy.
                    Each play session gives <span className="text-pink-400">+15 happiness</span> and <span className="text-purple-400">+25 XP</span> -- 
                    the fastest way to level up.
                  </p>
                  <p className="text-zinc-500 text-xs">Happiness maxes at 100. Keep feeding and playing in rotation.</p>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center flex-shrink-0">
                  <Star className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">Step 4: Level Up</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-3">
                    Every <span className="text-purple-400 font-bold">100 XP</span> earned advances your buddy one level.
                    The XP progress bar shows how close you are to the next level.
                  </p>
                  <p className="text-zinc-500 text-xs">
                    Feed = 10 XP, Play = 25 XP. A mix of 3 feeds + 2 plays = 80 XP per cycle.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Rarity Guide */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold uppercase tracking-tight mb-6">Rarity Tiers</h2>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800 text-xs uppercase text-zinc-500">
                  <th className="text-left p-4">Buddy</th>
                  <th className="text-left p-4">Rarity</th>
                  <th className="text-left p-4 hidden sm:table-cell">Description</th>
                  <th className="text-right p-4">Drop Rate</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { emoji: '🤖', name: 'Agentbot Baby', rarity: 'Common', color: 'text-cyan-400', desc: 'Your basic AI companion', rate: '37.5%' },
                  { emoji: '⚡', name: 'Spark Agent', rarity: 'Uncommon', color: 'text-yellow-400', desc: 'Charged with extra energy', rate: '25%' },
                  { emoji: '👻', name: 'Ghost Agent', rarity: 'Rare', color: 'text-purple-400', desc: 'Mysterious and elusive', rate: '12.5%' },
                  { emoji: '🐉', name: 'Dragon Agent', rarity: 'Epic', color: 'text-green-400', desc: 'Powerful and wise', rate: '12.5%' },
                  { emoji: '👽', name: 'Alien Agent', rarity: 'Legendary', color: 'text-red-400', desc: 'Otherworldly rare', rate: '12.5%' },
                ].map((row) => (
                  <tr key={row.rarity} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="p-4">
                      <span className="text-xl mr-2">{row.emoji}</span>
                      <span className="text-sm font-bold">{row.name}</span>
                    </td>
                    <td className={`p-4 font-bold text-sm ${row.color}`}>{row.rarity}</td>
                    <td className="p-4 text-zinc-500 text-sm hidden sm:table-cell">{row.desc}</td>
                    <td className="p-4 text-right font-mono text-sm">{row.rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Stats Explained */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold uppercase tracking-tight mb-6">Stats Explained</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
              <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
              <h3 className="font-bold mb-2">Energy</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Represents your buddy&apos;s fuel. Decreases over time (coming soon). 
                Restore with Feed (+20). Max 100.
              </p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
              <Heart className="w-8 h-8 text-pink-400 mx-auto mb-3" />
              <h3 className="font-bold mb-2">Happiness</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                How content your buddy is. Play boosts it (+15), feed helps too (+10).
                Higher happiness means better XP gains (coming soon). Max 100.
              </p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
              <Star className="w-8 h-8 text-purple-400 mx-auto mb-3" />
              <h3 className="font-bold mb-2">XP &amp; Level</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Experience points earned from interactions. Every 100 XP = 1 level.
                Feed = 10 XP, Play = 25 XP. Levels unlock future features.
              </p>
            </div>
          </div>
        </section>

        {/* Coming Soon */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold uppercase tracking-tight mb-6">Coming Soon</h2>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="space-y-4">
              {[
                { icon: TrendingUp, title: 'Energy Decay', desc: 'Buddies get hungry over time. Check in daily to keep them happy.' },
                { icon: Gift, title: 'Trading', desc: 'Trade buddies with other Agentbot users. Rare buddies = higher value.' },
                { icon: Shield, title: 'Buddy Abilities', desc: 'Higher level buddies unlock special abilities for your AI agent.' },
                { icon: Star, title: 'Leaderboard', desc: 'Compete with other users for the highest level and rarest collections.' },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4">
                  <item.icon className="w-5 h-5 text-zinc-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-sm">{item.title}</div>
                    <div className="text-xs text-zinc-500">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center">
          <a
            href="/buddies"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity"
          >
            Start Hatching <ArrowRight className="w-5 h-5" />
          </a>
          <div className="mt-6">
            <a href="/dashboard" className="text-zinc-500 hover:text-white text-sm">
              &larr; Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
