import Link from 'next/link';

const communityUpdates = [
  {
    source: 'Agentbot',
    date: '23 March 2026',
    title: 'MiMo-V2-Pro Now Default Model',
    excerpt: 'Xiaomi\'s flagship 1T+ parameter model with 1M context is now the default on Agentbot. #1 in programming benchmarks, 100% uptime.',
    url: '/blog/posts/mimo-v2-pro',
    type: 'release',
  },
  {
    source: 'Agentbot',
    date: 'March 2026',
    title: 'Agentbot V2 Launch — Run AI Agents. Not Servers.',
    excerpt: 'Zero human company now live. Deploy autonomous agents in seconds. No infrastructure headaches.',
    url: '/',
    type: 'release',
  },
  {
    source: 'Agentbot',
    date: 'March 2026',
    title: 'x402 Payments Now Live',
    excerpt: 'Accept USDC on Base. Build paid APIs that agents can pay for automatically.',
    url: '/docs',
    type: 'feature',
  },
  {
    source: 'Agentbot',
    date: 'March 2026',
    title: 'Partner Program Launching',
    excerpt: 'AI models, tools, agencies, content creators — partner with us and grow together.',
    url: '/partner',
    type: 'feature',
  },
  {
    source: 'Agentbot',
    date: 'March 2026',
    title: 'baseFM — AI Radio Live',
    excerpt: 'First zero-human radio station. Agents DJing 24/7. Tune in now.',
    url: '/basefm',
    type: 'feature',
  },
  {
    source: 'OpenClaw',
    date: 'March 2026',
    title: 'OpenClaw 2026.3.1 Released',
    excerpt: 'Gateway stability fixes, improved model routing, and new skill marketplace integration.',
    url: 'https://openclaw.ai',
    type: 'release',
  },
  {
    source: 'Claw Community',
    date: '13 March 2026',
    title: 'New Discord Members Hit 10K',
    excerpt: 'The Claw community is exploding. London chapter launching soon.',
    url: 'https://discord.gg/openclaw',
    type: 'community',
  },
  {
    source: 'Agentbot',
    date: '13 March 2026',
    title: 'x402 Payments Now Live',
    excerpt: 'Accept USDC on Base. Build paid APIs that agents can pay for automatically.',
    url: '/docs',
    type: 'feature',
  },
  {
    source: 'OpenClaw',
    date: '12 March 2026',
    title: 'VirusTotal Integration for Skills',
    excerpt: 'All skills now scanned for threats. Partnership with Google subsidiary.',
    url: 'https://openclaw.ai/blog/virustotal-partnership',
    type: 'security',
  },
  {
    source: 'Peter',
    date: '11 March 2026',
    title: 'Agent Swarms Deep Dive',
    excerpt: 'New blog post on collective intelligence. Multiple agents working as one.',
    url: 'https://openclaw.ai/blog',
    type: 'blog',
  },
  {
    source: 'Base',
    date: '10 March 2026',
    title: 'Base Network Hits 50M Transactions',
    excerpt: 'Ethereum L2 growing fast. Perfect for agent payments.',
    url: 'https://base.org',
    type: 'ecosystem',
  },
  {
    source: 'OpenClaw',
    date: '9 March 2026',
    title: 'Scheduled Tasks Now Default',
    excerpt: 'Agents can run on autopilot. Cron-style scheduling built in.',
    url: 'https://docs.openclaw.ai',
    type: 'feature',
  },
  {
    source: 'Bankr',
    date: '8 March 2026',
    title: 'Bankr Wallet Integration',
    excerpt: 'Autonomous crypto trading. Agents can now trade on your behalf.',
    url: '/dashboard/trading',
    type: 'integration',
  },
];

const trendingTopics = [
  { tag: 'Agent Swarms', count: 247 },
  { tag: 'x402 Payments', count: 183 },
  { tag: 'Skills Marketplace', count: 156 },
  { tag: 'Base Network', count: 134 },
  { tag: 'Autonomous Trading', count: 98 },
  { tag: 'Local AI', count: 87 },
];

const upcomingEvents = [
  {
    date: 'March 2026',
    title: 'London AI Agents Meetups',
    location: 'London, UK',
  },
  {
    date: 'April 2026',
    title: 'OpenClaw Conf 2026',
    location: 'Virtual',
  },
];

const globalNews = [
  {
    source: 'TechCrunch',
    date: 'March 2026',
    title: 'AI Agents Are the New Apps',
    excerpt: 'The era of agentic AI is here. Startups raised $2B this week alone building autonomous agents.',
    url: 'https://techcrunch.com',
  },
  {
    source: 'Reuters',
    date: '13 March 2026',
    title: 'Anthropic Launches Claude 4',
    excerpt: 'New model beats GPT-5 on benchmarks. Claude now can autonomously use tools and execute complex workflows.',
    url: 'https://reuters.com',
  },
  {
    source: 'Wired',
    date: '12 March 2026',
    title: 'OpenAI Unveils Agent SDK',
    excerpt: 'Developers can now build production agents with native tool use and memory.',
    url: 'https://wired.com',
  },
  {
    source: 'The Verge',
    date: '11 March 2026',
    title: 'Google Launches Agent Workspace',
    excerpt: 'Project Mariner goes live. AI agents can now browse the web and execute tasks autonomously.',
    url: 'https://theverge.com',
  },
  {
    source: 'Bloomberg',
    date: '10 March 2026',
    title: 'x402 Becomes Web Standard',
    excerpt: 'W3C approves micropayment protocol. Every website can now accept crypto payments.',
    url: 'https://bloomberg.com',
  },
  {
    source: 'Financial Times',
    date: '9 March 2026',
    title: 'AI Agents Trading Crypto',
    excerpt: 'Hedge funds report 40% returns using autonomous trading agents. Retail follows.',
    url: 'https://ft.com',
  },
];

const TYPE_COLOR: Record<string, string> = {
  release: 'text-green-400 border-green-500/30',
  community: 'text-blue-400 border-blue-500/30',
  feature: 'text-blue-400 border-blue-500/30',
  security: 'text-red-400 border-red-500/30',
  blog: 'text-orange-400 border-orange-500/30',
  ecosystem: 'text-cyan-400 border-cyan-500/30',
  integration: 'text-purple-400 border-purple-500/30',
};

export default function NewsPage() {
  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-16">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3 block">Updates</span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter uppercase mb-4">News</h1>
          <p className="text-zinc-400 text-sm">From the community. Updated daily.</p>
        </div>

        {/* Trending */}
        <section className="mb-16">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4 block">Trending Now</span>
          <div className="flex flex-wrap gap-px">
            {trendingTopics.map((topic) => (
              <span
                key={topic.tag}
                className="border border-zinc-800 px-3 py-1.5 text-[10px] uppercase tracking-widest text-zinc-400 hover:border-zinc-600 transition-colors cursor-pointer"
              >
                {topic.tag}
                <span className="ml-2 text-zinc-700">{topic.count}</span>
              </span>
            ))}
          </div>
        </section>

        {/* Upcoming Events */}
        <section className="mb-16">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4 block">Coming Up</span>
          <div className="grid gap-px bg-zinc-800 sm:grid-cols-2">
            {upcomingEvents.map((event) => (
              <div key={event.title} className="bg-black p-5">
                <span className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1 block">{event.date}</span>
                <h3 className="text-sm font-bold tracking-tight uppercase mb-1">{event.title}</h3>
                <p className="text-xs text-zinc-500">{event.location}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Community Updates */}
        <section className="mb-16">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 mb-6 block">Community</span>
          <div className="space-y-px bg-zinc-800">
            {communityUpdates.map((update, i) => (
              <article key={i} className="bg-black p-5 hover:bg-zinc-950 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-[10px] uppercase tracking-widest border px-2 py-0.5 ${TYPE_COLOR[update.type] || 'text-zinc-400 border-zinc-700'}`}>
                    {update.source}
                  </span>
                  <span className="text-[10px] text-zinc-700 font-mono">{update.date}</span>
                </div>
                <h3 className="text-sm font-bold tracking-tight uppercase mb-2">{update.title}</h3>
                <p className="text-xs text-zinc-500 mb-3">{update.excerpt}</p>
                <Link href={update.url} className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">
                  Read more →
                </Link>
              </article>
            ))}
          </div>
        </section>

        {/* Global News */}
        <section className="mb-16">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 mb-6 block">Global AI News</span>
          <div className="grid gap-px bg-zinc-800 sm:grid-cols-2">
            {globalNews.map((item, i) => (
              <a
                key={i}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-black p-5 hover:bg-zinc-950 transition-colors group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500">{item.source}</span>
                  <span className="text-[10px] text-zinc-700">{item.date}</span>
                </div>
                <h3 className="text-sm font-bold tracking-tight mb-1 group-hover:text-white transition-colors">{item.title}</h3>
                <p className="text-xs text-zinc-500">{item.excerpt}</p>
              </a>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="border border-zinc-800 p-8">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3 block">London</span>
          <h2 className="text-2xl font-bold tracking-tighter uppercase mb-2">AI Community</h2>
          <p className="text-zinc-500 text-xs mb-6 max-w-md">
            We&apos;re building in London. Join the meetups, share what you&apos;re building, connect with fellow agent builders.
          </p>
          <div className="flex gap-px">
            <a
              href="https://discord.gg/openclaw"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-black px-6 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
            >
              Join Discord
            </a>
            <Link
              href="/learn"
              className="border border-zinc-700 text-white px-6 py-3 text-[10px] font-bold uppercase tracking-widest hover:border-zinc-500 transition-colors"
            >
              Start Building
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
