import Link from 'next/link';

const communityUpdates = [
  {
    source: 'Agentbot',
    date: 'March 2026',
    title: 'Agentbot V2 Launch — Run AI Agents. Not Servers.',
    excerpt: 'Zero human company now live. Deploy autonomous agents in seconds. No infrastructure headaches.',
    url: '/',
    type: 'release'
  },
  {
    source: 'Agentbot',
    date: 'March 2026',
    title: 'x402 Payments Now Live',
    excerpt: 'Accept USDC on Base. Build paid APIs that agents can pay for automatically.',
    url: '/docs',
    type: 'feature'
  },
  {
    source: 'Agentbot',
    date: 'March 2026',
    title: 'Partner Program Launching',
    excerpt: 'AI models, tools, agencies, content creators — partner with us and grow together.',
    url: '/partner',
    type: 'feature'
  },
  {
    source: 'Agentbot',
    date: 'March 2026',
    title: 'baseFM — AI Radio Live',
    excerpt: 'First zero-human radio station. Agents DJing 24/7. Tune in now.',
    url: '/basefm',
    type: 'feature'
  },
  {
    source: 'OpenClaw',
    date: 'March 2026',
    title: 'OpenClaw 2026.3.1 Released',
    excerpt: 'Gateway stability fixes, improved model routing, and new skill marketplace integration.',
    url: 'https://openclaw.ai',
    type: 'release'
  },
  {
    source: 'Claw Community',
    date: '13 March 2026',
    title: 'New Discord Members Hit 10K',
    excerpt: 'The Claw community is exploding. London chapter launching soon.',
    url: 'https://discord.gg/openclaw',
    type: 'community'
  },
  {
    source: 'Agentbot',
    date: '13 March 2026',
    title: 'x402 Payments Now Live',
    excerpt: 'Accept USDC on Base. Build paid APIs that agents can pay for automatically.',
    url: '/docs',
    type: 'feature'
  },
  {
    source: 'OpenClaw',
    date: '12 March 2026',
    title: 'VirusTotal Integration for Skills',
    excerpt: 'All skills now scanned for threats. Partnership with Google subsidiary.',
    url: 'https://openclaw.ai/blog/virustotal-partnership',
    type: 'security'
  },
  {
    source: 'Peter',
    date: '11 March 2026',
    title: 'Agent Swarms Deep Dive',
    excerpt: 'New blog post on collective intelligence. Multiple agents working as one.',
    url: 'https://openclaw.ai/blog',
    type: 'blog'
  },
  {
    source: 'Base',
    date: '10 March 2026',
    title: 'Base Network Hits 50M Transactions',
    excerpt: 'Ethereum L2 growing fast. Perfect for agent payments.',
    url: 'https://base.org',
    type: 'ecosystem'
  },
  {
    source: 'OpenClaw',
    date: '9 March 2026',
    title: 'Scheduled Tasks Now Default',
    excerpt: 'Agents can run on autopilot. Cron-style scheduling built in.',
    url: 'https://docs.openclaw.ai',
    type: 'feature'
  },
  {
    source: 'Bankr',
    date: '8 March 2026',
    title: 'Bankr Wallet Integration',
    excerpt: 'Autonomous crypto trading. Agents can now trade on your behalf.',
    url: '/dashboard/trading',
    type: 'integration'
  }
];

const trendingTopics = [
  { tag: 'Agent Swarms', count: 247 },
  { tag: 'x402 Payments', count: 183 },
  { tag: 'Skills Marketplace', count: 156 },
  { tag: 'Base Network', count: 134 },
  { tag: 'Autonomous Trading', count: 98 },
  { tag: 'Local AI', count: 87 }
];

const upcomingEvents = [
  {
    date: 'March 2026',
    title: 'London AI Agents Meetups',
    location: 'London, UK',
    type: 'event'
  },
  {
    date: 'April 2026',
    title: 'OpenClaw Conf 2026',
    location: 'Virtual',
    type: 'conference'
  }
];

const globalNews = [
  {
    source: 'TechCrunch',
    date: 'March 2026',
    title: 'AI Agents Are the New Apps',
    excerpt: 'The era of agentic AI is here. Startups raised $2B this week alone building autonomous agents.',
    url: 'https://techcrunch.com',
    type: 'news'
  },
  {
    source: 'Reuters',
    date: '13 March 2026',
    title: 'Anthropic Launches Claude 4',
    excerpt: 'New model beats GPT-5 on benchmarks. Claude now can autonomously use tools and execute complex workflows.',
    url: 'https://reuters.com',
    type: 'news'
  },
  {
    source: 'Wired',
    date: '12 March 2026',
    title: 'OpenAI Unveils Agent SDK',
    excerpt: 'Developers can now build production agents with native tool use and memory.',
    url: 'https://wired.com',
    type: 'news'
  },
  {
    source: 'The Verge',
    date: '11 March 2026',
    title: 'Google Launches Agent Workspace',
    excerpt: 'Project Mariner goes live. AI agents can now browse the web and execute tasks autonomously.',
    url: 'https://theverge.com',
    type: 'news'
  },
  {
    source: 'Bloomberg',
    date: '10 March 2026',
    title: 'x402 Becomes Web Standard',
    excerpt: 'W3C approves micropayment protocol. Every website can now accept crypto payments.',
    url: 'https://bloomberg.com',
    type: 'news'
  },
  {
    source: 'Financial Times',
    date: '9 March 2026',
    title: 'AI Agents Trading Crypto',
    excerpt: 'Hedge funds report 40% returns using autonomous trading agents. Retail follows.',
    url: 'https://ft.com',
    type: 'news'
  }
];

export default function NewsPage() {
  return (
    <main className="min-h-screen px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">📰</span>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">OpenClaw News</h1>
              <p className="text-gray-400">From the community. Updated daily.</p>
            </div>
          </div>
        </div>

        {/* Trending Topics */}
        <section className="mb-12">
          <h2 className="text-sm font-bold text-gray-500 tracking-widest uppercase mb-4">TRENDING NOW</h2>
          <div className="flex flex-wrap gap-2">
            {trendingTopics.map((topic) => (
              <span
                key={topic.tag}
                className="px-3 py-1.5 rounded-full bg-gray-900 border border-gray-800 text-sm text-gray-300 hover:border-blue-500/50 transition-colors cursor-pointer"
              >
                #{topic.tag}
                <span className="ml-1.5 text-xs text-gray-600">{topic.count}</span>
              </span>
            ))}
          </div>
        </section>

        {/* Upcoming Events */}
        <section className="mb-12">
          <h2 className="text-sm font-bold text-gray-500 tracking-widest uppercase mb-4">📅 COMING UP</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingEvents.map((event) => (
              <div
                key={event.title}
                className="p-5 rounded-xl bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/20"
              >
                <p className="text-xs text-blue-400 mb-1">{event.date}</p>
                <h3 className="font-bold text-white mb-1">{event.title}</h3>
                <p className="text-sm text-gray-400">{event.location}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Community Updates */}
        <section>
          <h2 className="text-sm font-bold text-gray-500 tracking-widest uppercase mb-6">🇬🇧 COMMUNITY</h2>
          <div className="space-y-4">
            {communityUpdates.map((update, i) => (
              <article
                key={i}
                className="group p-6 rounded-2xl bg-gray-900 border border-gray-800 hover:border-white/30 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    update.type === 'release' ? 'bg-green-500/20 text-green-400' :
                    update.type === 'community' ? 'bg-purple-500/20 text-purple-400' :
                    update.type === 'feature' ? 'bg-blue-500/20 text-blue-400' :
                    update.type === 'security' ? 'bg-red-500/20 text-red-400' :
                    update.type === 'blog' ? 'bg-orange-500/20 text-orange-400' :
                    update.type === 'ecosystem' ? 'bg-cyan-500/20 text-cyan-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {update.source}
                  </span>
                  <p className="text-xs text-gray-500">{update.date}</p>
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">{update.title}</h3>
                <p className="text-gray-400 mb-4">{update.excerpt}</p>
                <Link href={update.url} className="text-sm text-gray-500 hover:text-white transition-colors">
                  Read more →
                </Link>
              </article>
            ))}
          </div>
        </section>

        {/* Global News */}
        <section className="mt-16">
          <h2 className="text-sm font-bold text-gray-500 tracking-widest uppercase mb-6">🌍 GLOBAL AI NEWS</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {globalNews.map((item, i) => (
              <a
                key={i}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-5 rounded-xl bg-gray-900/50 border border-gray-800 hover:border-white/30 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">{item.source}</span>
                  <span className="text-xs text-gray-600">{item.date}</span>
                </div>
                <h3 className="font-bold mb-1 group-hover:text-blue-400 transition-colors">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.excerpt}</p>
              </a>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/20 text-center">
          <h2 className="text-2xl font-bold mb-2">🇬🇧 London AI Community</h2>
          <p className="text-gray-400 mb-4">
            We're building in London. Join the meetups, share what you're building, connect with fellow agent builders.
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="https://discord.gg/openclaw"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-2 rounded-lg bg-[#5865F2] text-white font-semibold hover:bg-[#4752C4] transition-colors"
            >
              Join Discord
            </a>
            <Link
              href="/learn"
              className="inline-block px-6 py-2 rounded-lg bg-gray-800 text-white font-semibold hover:bg-gray-700 transition-colors"
            >
              Start Building →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
