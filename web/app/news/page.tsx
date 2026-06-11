import Link from 'next/link';

const tickerHeadlines = [
  'WWDC 2026: Apple Intelligence + Siri AI overhaul',
  'Anthropic Claude Fable 5 now public',
  'Deezer AI music detection tool launched',
  'DoorDash AI chatbot for ordering',
  'xAI fired engineer over Grok safety concerns',
  'Amazon borrows $17.5B for AI spending',
  'Agentbot AgentKit integration complete',
  'Lovable hits $500M ARR',
  'OpenAI files confidentially for IPO',
  'Google AI subscription price wars begin',
];

const communityUpdates = [
  {
    source: 'Agentbot',
    date: '11 June 2026',
    title: 'Coinbase AgentKit Integration Complete 🪙',
    excerpt: 'All Agentbot agents now have their own crypto wallets via Coinbase AgentKit. Send USDC, trade tokens, pay for x402 services — fully autonomous onchain agents.',
    url: '/dashboard/wallet',
    type: 'feature',
  },
  {
    source: 'OpenClaw',
    date: '9 June 2026',
    title: 'WWDC 2026: Apple Intelligence + Siri AI 🍎',
    excerpt: 'Apple announced iOS 27 with a complete Siri AI overhaul powered by Apple Intelligence. On-device LLMs, personal context, and cross-app actions.',
    url: 'https://techcrunch.com/2026/06/09/wwdc-2026-everything-announced-on-siri-ai-os-27-apple-intelligence-and-more/',
    type: 'release',
  },
  {
    source: 'Agentbot',
    date: '9 June 2026',
    title: 'Anthropic Claude Fable 5 Goes Public 🎮',
    excerpt: 'Anthropic released Claude Fable 5 — a version of Mythos the public can access. Makes weirdly fun video games with the click of a button.',
    url: 'https://techcrunch.com/2026/06/09/anthropics-claude-fable-5-is-a-version-of-mythos-the-public-can-access-today/',
    type: 'release',
  },
  {
    source: 'Agentbot',
    date: '2 June 2026',
    title: 'Microsoft Execution Containers for OpenClaw 🛡️',
    excerpt: 'At Build 2026, Microsoft launched Execution Containers — a security layer to run OpenClaw safely on Windows. "You can totally run OpenClaw inside your company now."',
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
    date: '11 April 2026',
    title: 'Dual-Chain Token: Base + Solana 🪙',
    excerpt: 'Agentbot now supports community tokens on two chains. Base = official engine. Solana = community crowd. Two tokens, one platform.',
    url: '/token',
    type: 'feature',
  },
  {
    source: 'baseFM',
    date: '9 April 2026',
    title: 'baseFM Goes Open Source 📻',
    excerpt: 'Onchain radio platform now open source on GitHub. Live DJs, crypto tipping, token-gated events.',
    url: 'https://github.com/Eskyee/baseFM',
    type: 'open-source',
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
  { tag: 'WWDC 2026', count: 2147 },
  { tag: 'Claude Fable 5', count: 1892 },
  { tag: 'AgentKit', count: 1234 },
  { tag: 'Apple Intelligence', count: 1100 },
  { tag: 'OpenAI IPO', count: 987 },
  { tag: 'x402 Payments', count: 876 },
  { tag: 'AI Agent Security', count: 750 },
  { tag: 'Lovable $500M', count: 654 },
  { tag: 'Agent Swarms', count: 543 },
  { tag: 'Base Network', count: 432 },
];

const upcomingEvents = [
  {
    date: 'June 2026',
    title: 'StrictlyVC Los Angeles',
    location: 'Los Angeles, CA',
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
  {
    date: '2026',
    title: 'Agentbot DevCon',
    location: 'Remote',
  },
];

const globalNews = [
  {
    source: 'TechCrunch',
    date: '11 June 2026',
    title: 'Deezer\'s new tool can identify AI music from Spotify',
    excerpt: 'Deezer launches AI music detection across major streaming platforms to combat fake artist flooding.',
    url: 'https://techcrunch.com/2026/06/11/deezers-new-tool-can-identify-ai-music-from-spotify-apple-music-and-others/',
  },
  {
    source: 'TechCrunch',
    date: '11 June 2026',
    title: 'DoorDash\'s new AI chatbot lets you order with prompts',
    excerpt: 'DoorDash launches AI-powered ordering assistant that accepts text prompts and photos for food delivery.',
    url: 'https://techcrunch.com/2026/06/11/doordashs-new-ai-chatbot-lets-you-order-with-prompts-and-photos/',
  },
  {
    source: 'TechCrunch',
    date: '10 June 2026',
    title: 'xAI fired engineer who raised alarms about Grok safety',
    excerpt: 'New lawsuit claims xAI terminated an engineer who flagged safety concerns about the Grok AI model.',
    url: 'https://techcrunch.com/2026/06/10/xai-fired-an-engineer-who-raised-alarms-about-grok-safety-new-lawsuit-claims/',
  },
  {
    source: 'TechCrunch',
    date: '10 June 2026',
    title: 'Amazon borrows $17.5B as AI spending continues',
    excerpt: 'Fresh off a bond sale, Amazon secures $17.5B in bank financing to fund AI infrastructure expansion.',
    url: 'https://techcrunch.com/2026/06/10/fresh-off-bond-sale-amazon-borrows-17-5-billion-from-banks-as-ai-spending-continues/',
  },
  {
    source: 'TechCrunch',
    date: '10 June 2026',
    title: 'Cybersecurity researchers push back on Anthropic Fable guardrails',
    excerpt: 'Security researchers criticize the safety guardrails on Anthropic\'s Fable 5 as overly restrictive.',
    url: 'https://techcrunch.com/2026/06/10/cybersecurity-researchers-arent-happy-about-the-guardrails-on-anthropics-fable/',
  },
  {
    source: 'TechCrunch',
    date: '9 June 2026',
    title: 'Lovable hits $500M in annualized revenue',
    excerpt: 'AI coding platform Lovable reaches $500M ARR with 1 million new projects created per week.',
    url: 'https://techcrunch.com/2026/06/09/lovable-says-it-has-hit-500m-in-annualized-revenue-with-1-million-new-projects-a-week/',
  },
  {
    source: 'TechCrunch',
    date: '9 June 2026',
    title: 'It\'s not FAANG anymore. It\'s MANGOS.',
    excerpt: 'Tech\'s elite group has a new acronym as Meta, Amazon, Nvidia, Google, OpenAI, and Salesforce dominate.',
    url: 'https://techcrunch.com/2026/06/09/its-not-faang-anymore-its-mangos/',
  },
  {
    source: 'TechCrunch',
    date: '9 June 2026',
    title: 'Google fires warning shot in AI subscription price wars',
    excerpt: 'Google adjusts AI pricing strategy, signaling intensifying competition in the AI subscription market.',
    url: 'https://techcrunch.com/2026/06/09/google-just-fired-a-warning-shot-in-the-ai-subscription-price-wars/',
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
  'open-source': 'text-blue-400 border-blue-500/30',
};

export default function NewsPage() {
  return (
    <main className="min-h-screen bg-black text-white font-mono">
      {/* Live Ticker */}
      <div className="border-b border-zinc-900 overflow-hidden">
        <div className="py-3">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 text-center mb-2">
            Live
          </div>
          <div className="relative">
            <div className="flex animate-ticker whitespace-nowrap">
              {[...tickerHeadlines, ...tickerHeadlines].map((headline, i) => (
                <span
                  key={i}
                  className="inline-block px-6 text-xs text-zinc-500 hover:text-white transition-colors cursor-default shrink-0"
                >
                  {headline}
                  <span className="text-zinc-800 ml-6">·</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

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
