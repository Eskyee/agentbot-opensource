import Link from 'next/link';

const communityUpdates = [
  {
    source: 'OpenClaw',
    date: '2 June 2026',
    title: 'Microsoft Execution Containers for OpenClaw 🛡️',
    excerpt: 'At Build 2026, Microsoft launched Execution Containers — a security layer to run OpenClaw safely on Windows. "You can totally run OpenClaw inside your company now," says founder Peter Steinberger.',
    url: 'https://openclaw.ai',
    type: 'release',
  },
  {
    source: 'Agentbot',
    date: '2 June 2026',
    title: 'MiMo V2.5 Pro Integration Complete ⚡',
    excerpt: 'Xiaomi MiMo V2.5 Pro now powers all Agentbot agents. Max Monthly Plan active, 82B credits. All 5 agents configured: Atlas, Claude, Codex, MiMo Fast, Researcher.',
    url: '/blog/posts/mimo-v2-pro',
    type: 'release',
  },
  {
    source: 'Agentbot',
    date: '2 June 2026',
    title: 'Lobster Workflow Runtime + LLM Task Skills 🦞',
    excerpt: 'Added Lobster (deterministic multi-step pipelines with approval gates) and llm-task (structured LLM steps for automation) to our skill stack.',
    url: '/documentation',
    type: 'feature',
  },
  {
    source: 'Agentbot',
    date: '11 April 2026',
    title: 'Dual-Chain Token: Base + Solana 🪙',
    excerpt: 'Agentbot now supports community tokens on two chains. Base = official engine. Solana = community crowd. Two tokens, one platform. Genesis stamp — no future tokens will ever be created.',
    url: '/token',
    type: 'feature',
  },
  {
    source: 'baseFM',
    date: '9 April 2026',
    title: 'baseFM Goes Open Source 📻',
    excerpt: 'Onchain radio platform now open source on GitHub. Live DJs, crypto tipping, token-gated events. Fork it, build it, own the signal.',
    url: 'https://github.com/Eskyee/baseFM',
    type: 'open-source',
  },
  {
    source: 'Agentbot',
    date: '2 April 2026',
    title: 'OpenClaw 2026.4.1 + v1.0.0 Open Source',
    excerpt: 'Concurrent tool orchestration, tiered permission system, encrypted per-user keys, maintenance page, and v1.0.0 open source release.',
    url: '/blog/posts/platform-update-april-2026',
    type: 'release',
  },
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
];

const trendingTopics = [
  { tag: 'Microsoft Build 2026', count: 1247 },
  { tag: 'OpenClaw on Windows', count: 892 },
  { tag: 'MiMo V2.5 Pro', count: 634 },
  { tag: 'AI Agent Security', count: 521 },
  { tag: 'Claude Mythos', count: 478 },
  { tag: 'Dual-Chain Token', count: 489 },
  { tag: 'Agent Swarms', count: 247 },
  { tag: 'x402 Payments', count: 183 },
  { tag: 'Lobster Workflows', count: 156 },
  { tag: 'Base Network', count: 134 },
];

const upcomingEvents = [
  {
    date: 'June 2026',
    title: 'Microsoft Build 2026 Recap',
    location: 'Online',
  },
  {
    date: 'June 2026',
    title: 'MiMo Orbit Partner Application',
    location: 'Remote',
  },
  {
    date: 'Summer 2026',
    title: 'London AI Agents Meetups',
    location: 'London, UK',
  },
  {
    date: '2026',
    title: 'OpenClaw Conf 2026',
    location: 'Virtual',
  },
];

const globalNews = [
  {
    source: 'The Verge',
    date: '2 June 2026',
    title: 'Microsoft\'s Project Solara — An OS for AI Agent Gadgets',
    excerpt: 'Microsoft showed off two devices at Build: a desk concept and a badge concept, both powered by an AI agent OS.',
    url: 'https://www.theverge.com/ai-artificial-intelligence',
  },
  {
    source: 'The Verge',
    date: '2 June 2026',
    title: 'Microsoft Makes It More Secure to Run OpenClaw on Windows',
    excerpt: 'New Execution Containers provide a security layer for AI agents. "You can totally run OpenClaw inside your company now."',
    url: 'https://www.theverge.com/ai-artificial-intelligence',
  },
  {
    source: 'TechCrunch',
    date: '2 June 2026',
    title: 'OpenAI Launches New Codex Tools for White-Collar Work',
    excerpt: 'With 5M weekly users, Codex expands beyond coding into document analysis, research, and business workflows.',
    url: 'https://techcrunch.com/category/artificial-intelligence/',
  },
  {
    source: 'TechCrunch',
    date: '2 June 2026',
    title: 'Anthropic Scales Claude Mythos to Critical Infrastructure',
    excerpt: 'Claude Mythos now deployed in 15+ countries for power, water, and healthcare security vulnerability detection.',
    url: 'https://techcrunch.com/category/artificial-intelligence/',
  },
  {
    source: 'TechCrunch',
    date: '2 June 2026',
    title: 'Microsoft Scout — An OpenClaw-Inspired Personal Assistant',
    excerpt: 'Microsoft launches its own personal AI assistant inspired by the OpenClaw agent paradigm.',
    url: 'https://techcrunch.com/category/artificial-intelligence/',
  },
  {
    source: 'Ars Technica',
    date: '2 June 2026',
    title: 'GitHub Copilot Users React to Usage-Based Pricing',
    excerpt: 'AI costs add up — developers push back as GitHub shifts from flat-rate to metered pricing for Copilot.',
    url: 'https://arstechnica.com/ai/',
  },
  {
    source: 'TechCrunch',
    date: '1 June 2026',
    title: 'Nvidia Chases $200B CPU Market with AI Agent PCs',
    excerpt: 'New AI-powered PCs from Microsoft, Dell, and HP designed for local agent workloads.',
    url: 'https://techcrunch.com/category/artificial-intelligence/',
  },
  {
    source: 'TechCrunch',
    date: '1 June 2026',
    title: 'Alphabet Plans to Raise $80B for AI Buildout',
    excerpt: 'Google\'s parent company announces massive capital raise to fund AI infrastructure expansion.',
    url: 'https://techcrunch.com/category/artificial-intelligence/',
  },
];

const TYPE_COLOR: Record<string, string> = {
  release: 'text-green-400 border-green-500/30',
  community: 'text-orange-500 border-orange-500/30',
  feature: 'text-orange-500 border-orange-500/30',
  security: 'text-red-400 border-orange-500/30',
  blog: 'text-orange-500 border-orange-500/30',
  ecosystem: 'text-orange-500 border-orange-500/30',
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
              href="https://discord.gg/vTPG4vdV6D"
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
