import Link from 'next/link'

export const metadata = {
  title: 'Skills — Agentbot',
  description: 'Browse the Agentbot skills catalog. Add capabilities to your agent — payments, music, channels, events, and more.',
}

const SKILLS = [
  { name: 'baseFM DJ',           category: 'streaming',    description: 'Create baseFM streams, fetch live DJs, and generate broadcaster commands.',   featured: true },
  { name: 'Browser Automation',  category: 'development',  description: 'Browse websites, fill forms, and scrape data autonomously.',                   featured: true },
  { name: 'Telegram',            category: 'channels',     description: 'Connect via Telegram. Bot commands, messages, groups.',                        featured: true },
  { name: 'Discord',             category: 'channels',     description: 'Connect via Discord. Slash commands, embeds, voice channels.',                 featured: true },
  { name: 'WhatsApp',            category: 'channels',     description: 'Connect via WhatsApp. Message templates, media, status updates.',              featured: true },
  { name: 'USDC Payments',       category: 'payments',     description: 'Accept USDC payments on Base. Generate payment links, track transactions.',    featured: true },
  { name: 'Event Ticketing',     category: 'events',       description: 'Sell tickets with USDC payments on Base via x402 protocol.',                   featured: true },
  { name: 'Guestlist Manager',   category: 'events',       description: 'Manage event guestlists, RSVPs, check-ins, and capacity limits.',              featured: true },
  { name: 'Google Calendar',     category: 'productivity', description: 'Schedule events, manage availability, set reminders. Full Google Calendar sync.', featured: true },
  { name: 'Royalty Tracker',     category: 'finance',      description: 'Track streaming royalties across platforms in USDC.',                          featured: true },
  { name: 'Spotify Analytics',   category: 'music',        description: 'Track streams, followers, playlist placements. Cross-platform analytics.',     featured: true },
  { name: 'Setlist Oracle',      category: 'music',        description: 'Analyse BPM, key, and energy curves to build perfect DJ sets.',                featured: true },
  { name: 'Track Archaeologist', category: 'music',        description: 'Deep catalog digging via similarity search. Find tracks, clear samples.',      featured: true },
  { name: 'Demo Submitter',      category: 'music',        description: 'Submit demos to baseFM for airplay consideration.',                            featured: true },
  { name: 'Visual Synthesizer',  category: 'creative',     description: 'Generate release artwork and social media assets using Stable Diffusion XL.',  featured: true },
  { name: 'Venue Finder',        category: 'events',       description: 'Find venues worldwide with capacity and price filters.',                        featured: false },
  { name: 'Festival Finder',     category: 'events',       description: 'Discover festivals globally, compare lineups, get UK/Europe recommendations.',  featured: false },
  { name: 'Groupie Manager',     category: 'marketing',    description: 'Fan segmentation, lifecycle tracking, and automated merch drop campaigns.',     featured: false },
  { name: 'Event Scheduler',     category: 'events',       description: 'Schedule events across Telegram, Discord, WhatsApp, Email.',                   featured: false },
  { name: 'Community Treasury',  category: 'finance',      description: 'Track spending, reimbursements, and multi-sig treasury management.',           featured: false },
  { name: 'Webhooks',            category: 'development',  description: 'Connect to any API. HTTP requests, webhooks, integrations.',                   featured: false },
  { name: 'Email',               category: 'communication',description: 'Send and receive emails. Newsletter support included.',                         featured: false },
  { name: 'Slack',               category: 'channels',     description: 'Post to channels, create threads, handle slash commands.',                     featured: false },
  { name: 'Notion',              category: 'productivity', description: 'Sync with Notion databases, pages, and workflows.',                            featured: false },
  { name: 'Google Workspace',    category: 'productivity', description: 'Gmail, Calendar, Drive, Sheets integration.',                                  featured: false },
  { name: 'File Manager',        category: 'productivity', description: 'Upload, download, organize files. Local storage integration.',                  featured: false },
  { name: 'Crypto Price Alerts', category: 'finance',      description: 'Monitor crypto prices and send alerts when thresholds hit.',                   featured: false },
  { name: 'SoundCloud Manager',  category: 'music',        description: 'Upload tracks, manage likes, track reposts, analyse audience demographics.',   featured: false },
  { name: 'Bandcamp Sync',       category: 'music',        description: 'Sync releases, track sales, manage merchandise across Bandcamp.',              featured: false },
  { name: 'WhatsApp Business',   category: 'channels',     description: 'Full WhatsApp Business API. Automated replies, labels, catalogs.',             featured: false },
]

const CATEGORY_COLORS: Record<string, string> = {
  streaming:    'text-amber-400 border-amber-400/30 bg-amber-400/5',
  development:  'text-orange-400 border-orange-400/30 bg-orange-400/5',
  channels:     'text-purple-400 border-purple-400/30 bg-purple-400/5',
  payments:     'text-green-400 border-green-400/30 bg-green-400/5',
  events:       'text-pink-400 border-pink-400/30 bg-pink-400/5',
  productivity: 'text-orange-400 border-orange-400/30 bg-orange-400/5',
  finance:      'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
  music:        'text-red-400 border-red-400/30 bg-red-400/5',
  creative:     'text-orange-400 border-orange-400/30 bg-orange-400/5',
  marketing:    'text-yellow-400 border-yellow-400/30 bg-yellow-400/5',
  communication:'text-orange-400 border-orange-400/30 bg-orange-400/5',
}

const CATEGORIES = ['all', ...Array.from(new Set(SKILLS.map(s => s.category))).sort()]

export default function SkillsPage() {
  const featured = SKILLS.filter(s => s.featured)
  const rest = SKILLS.filter(s => !s.featured)

  return (
    <div className="min-h-screen bg-black">
      {/* Hero */}
      <div className="border-b border-zinc-900 bg-zinc-950">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-600 mb-4 font-mono">
            Agentbot Skills Catalog
          </p>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white mb-4">
            Extend Your Agent
          </h1>
          <p className="text-zinc-500 text-sm max-w-xl mx-auto leading-relaxed">
            Plug-and-play capabilities for your OpenClaw runtime. Music, payments, channels,
            events — install a skill in seconds from your dashboard.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/dashboard/skills"
              className="bg-white text-black px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
            >
              Install Skills →
            </Link>
            <Link
              href="/onboard"
              className="border border-zinc-700 text-zinc-300 px-8 py-3 text-xs font-bold uppercase tracking-widest hover:text-white hover:border-zinc-500 transition-colors"
            >
              Deploy Agent
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-12">

        {/* Featured */}
        <section className="mb-12">
          <h2 className="text-[10px] uppercase tracking-widest text-zinc-600 font-mono mb-6">
            Featured Skills — {featured.length}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((skill) => {
              const colorCls = CATEGORY_COLORS[skill.category] ?? 'text-zinc-400 border-zinc-700 bg-zinc-900'
              return (
                <div
                  key={skill.name}
                  className="border border-zinc-800 bg-zinc-950 p-4 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                      {skill.name}
                    </h3>
                    <span className={`shrink-0 border rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${colorCls}`}>
                      {skill.category}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">{skill.description}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* All skills */}
        <section>
          <h2 className="text-[10px] uppercase tracking-widest text-zinc-600 font-mono mb-6">
            All Skills — {SKILLS.length}
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((skill) => {
              const colorCls = CATEGORY_COLORS[skill.category] ?? 'text-zinc-400 border-zinc-700 bg-zinc-900'
              return (
                <div
                  key={skill.name}
                  className="border border-zinc-800 bg-zinc-950 p-4 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                      {skill.name}
                    </h3>
                    <span className={`shrink-0 border rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${colorCls}`}>
                      {skill.category}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">{skill.description}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* CTA */}
        <div className="mt-12 border border-zinc-800 bg-zinc-950 p-8 text-center">
          <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-mono mb-3">
            Ready to extend your agent?
          </p>
          <h3 className="text-xl font-bold uppercase tracking-tight text-white mb-4">
            Install skills from your dashboard
          </h3>
          <Link
            href="/dashboard/skills"
            className="inline-block bg-white text-black px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
          >
            Open Skills Dashboard →
          </Link>
        </div>

      </div>
    </div>
  )
}
