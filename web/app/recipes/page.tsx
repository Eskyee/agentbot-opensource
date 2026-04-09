import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Community Recipes — Agentbot',
  description: 'Real-world automation recipes built by the Agentbot community. From email triage to crypto payments.',
}

const recipes = [
  {
    title: 'Email Triage Agent',
    author: 'Community',
    desc: 'Auto-sort inbox, flag urgent items, draft replies. Saves 2 hours/day.',
    tags: ['Email', 'Automation', 'Productivity'],
    difficulty: 'Easy',
  },
  {
    title: 'Crypto Payment Bot',
    author: 'Community',
    desc: 'Accept USDC payments via Telegram. Auto-invoice, track payments, send receipts.',
    tags: ['Payments', 'Crypto', 'Telegram'],
    difficulty: 'Medium',
  },
  {
    title: 'DJ Booking Agent',
    author: 'baseFM',
    desc: 'Handle booking inquiries, check availability, send quotes, process deposits.',
    tags: ['Music', 'Bookings', 'Payments'],
    difficulty: 'Medium',
  },
  {
    title: 'Social Media Manager',
    author: 'Community',
    desc: 'Schedule posts, track engagement, reply to mentions across X, Moltx, Farcaster.',
    tags: ['Social', 'Marketing', 'Multi-platform'],
    difficulty: 'Easy',
  },
  {
    title: 'Invoice Processor',
    author: 'Community',
    desc: 'Extract data from invoices, categorize expenses, sync to accounting.',
    tags: ['Finance', 'Documents', 'Automation'],
    difficulty: 'Medium',
  },
  {
    title: 'Customer Support Bot',
    author: 'Community',
    desc: 'Answer FAQs, escalate complex issues, track satisfaction. Multi-channel.',
    tags: ['Support', 'Chat', 'Multi-channel'],
    difficulty: 'Hard',
  },
]

export default function RecipesPage() {
  return (
    <main className="min-h-screen bg-black text-white font-mono px-6 py-16 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Community</div>
          <h1 className="text-4xl font-bold uppercase tracking-tighter mb-4">Automation Recipes</h1>
          <p className="text-zinc-400 text-sm max-w-xl leading-relaxed">
            Real-world automation recipes built by the Agentbot community. Copy, customize, deploy.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe, i) => (
            <div key={i} className="border border-zinc-800 bg-zinc-950 p-5 hover:border-zinc-600 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] text-zinc-500 font-mono">by {recipe.author}</span>
                <span className={`text-[9px] uppercase tracking-widest px-2 py-0.5 border rounded ${
                  recipe.difficulty === 'Easy' ? 'border-emerald-500/30 text-emerald-400' :
                  recipe.difficulty === 'Medium' ? 'border-yellow-500/30 text-yellow-400' :
                  'border-red-500/30 text-red-400'
                }`}>{recipe.difficulty}</span>
              </div>
              <h3 className="text-sm font-bold text-white mb-2">{recipe.title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-3">{recipe.desc}</p>
              <div className="flex flex-wrap gap-1.5">
                {recipe.tags.map(tag => (
                  <span key={tag} className="text-[9px] text-zinc-500 border border-zinc-800 px-1.5 py-0.5">{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center border border-zinc-800 bg-zinc-950 p-8">
          <div className="text-sm font-bold text-white mb-2">Submit Your Recipe</div>
          <p className="text-xs text-zinc-400 mb-4">Built something cool with Agentbot? Share it with the community.</p>
          <a href="https://github.com/Eskyee/agentbot-opensource/issues/new" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors">
            Submit Recipe →
          </a>
        </div>
      </div>
    </main>
  )
}
