import Link from 'next/link';

const blogPosts = [
  {
    slug: 'openclaw-v2026-3-24',
    date: '26 March 2026',
    title: 'Agentbot Now Runs OpenClaw v2026.3.24',
    excerpt: 'Gateway OpenAI compatibility, security fix, CLI container support, channel isolation, and restart recovery.',
    tags: ["Release", "OpenClaw", "Security"]
  },
  {
    slug: 'countdown-d6',
    date: '25 March 2026',
    title: 'T-6 Days: Agentbot Launches March 31',
    excerpt: '6 days until launch. Platform hardened, security audited, countdown on. Your AI agent. Your hardware. Your rules.',
    tags: ["Countdown", "Launch", "D-6"]
  },
  {
    slug: 'agentbot-launch',
    date: '31 March 2026',
    title: 'Agentbot: The Managed Platform for Self-Hosted AI Agents',
    excerpt: 'Your AI agent. Your hardware. Your rules. Self-hosted, BYOK, one command deploy. No cloud dependency.',
    tags: ["Launch", "v0.1.0-beta.1", "Self-Hosted"]
  },
  {
    slug: 'platform-ops-2026-03-25',
    date: '25 March 2026',
    title: 'Platform Ops: Dashboard Overhaul & Infrastructure Hardening',
    excerpt: 'Unified dashboard layout, Redis recovery, Google Calendar integration, full infra audit. All services green.',
    tags: ["Update", "Infrastructure"]
  },
  {
    slug: 'openclaw-2026-3-23',
    date: '24 March 2026',
    title: 'OpenClaw v2026.3.23 — Stability & Auth Fixes',
    excerpt: '30+ fixes for browser attach, ClawHub auth, gateway reliability, and security hardening. Now live on Agentbot.',
    tags: ["Release", "OpenClaw", "Stability"]
  },
  {
    slug: 'mimo-v2-pro',
    date: '23 March 2026',
    title: 'MiMo-V2-Pro: Xiaomi\'s Flagship AI Model Now Default',
    excerpt: 'Over 1T parameters, 1M context length, #1 in programming benchmarks. MiMo-V2-Pro is now the default model on Agentbot — the brain your agent deserves.',
    tags: ["New Model", "Xiaomi", "Default"]
  },
  {
    slug: 'launch-week-2026-3-21',
    date: '21 March 2026',
    title: '10 Days Out: What We Shipped This Week',
    excerpt: '313 commits. Security hardening, RLS, real agent provisioning end-to-end, BullMQ worker service, design system locked, build clean. March 31 is on.',
    tags: ["Build Log", "Security", "Platform", "Launch"]
  },
  {
    slug: 'openclaw-2026-3-13-release',
    date: '16 March 2026',
    title: 'OpenClaw 2026.3.13 Released + Agentbot Progress Update',
    excerpt: 'OpenClaw 2026.3.13 is now live with enhanced agent orchestration, Ollama support, streaming infrastructure, and A2A protocol. Plus: Agentbot achieves A++ certification.',
    tags: ["Release", "OpenClaw", "Agentbot", "A++"]
  },
  {
    slug: 'battle-tested',
    date: '14 March 2026',
    title: 'Battle Tested: Live in the Field',
    excerpt: 'How we built Agentbot in the trenches - real problems, real solutions, zero marketing fluff.',
    tags: ["Field Report", "Philosophy", "Build"]
  },
  {
    slug: 'zero-human-company',
    date: '14 March 2026',
    title: 'Running a Zero-Human Company with AI Agents',
    excerpt: 'How Atlas operates autonomously - no humans required. AI agents handle deployments, support, trading, and content creation.',
    tags: ["AI", "Autonomy", "Operations"]
  },
  {
    slug: 'bankr-wallet-guide',
    date: '14 March 2026',
    title: 'How to Connect Your Bankr Wallet',
    excerpt: 'Step-by-step guide to connecting your Bankr wallet for crypto trading and payments on the Agentbot platform.',
    tags: ["Guide", "Crypto", "Bankr"]
  },
  {
    slug: 'platform-v2-launch',
    date: '14 March 2026',
    title: 'Agentbot V2 Launch: Trading, Payments & More',
    excerpt: 'Major platform update brings Bankr crypto integration, x402 USDC payments, and a complete trading dashboard.',
    tags: ["Launch", "Trading", "V2"]
  },
  {
    slug: 'security-hardening-2026',
    date: '7 March 2026',
    title: 'Security Hardening 2026: Protecting Your AI Agents',
    excerpt: 'Comprehensive security review completed. Authorization checks, rate limiting, input validation, and production hardening applied across all endpoints.',
    tags: ["Security", "Production"]
  },
  {
    slug: 'daily-2026-03-05',
    date: '5 March 2026',
    title: 'baseFM March Update: Agent Skills, Autonomous Trading & More',
    excerpt: 'Explore the latest improvements in the OpenClaw framework that enhance the functionality and user experience on the Agentbot platform.',
    tags: ["Update", "Skills", "Trading"]
  },
  {
    slug: 'daily-2026-03-04',
    date: '4 March 2026',
    title: 'Enhancing User Experience with OpenClaw 2026: Live Activity Connection Status',
    excerpt: 'Discover how the latest updates in OpenClaw improve connection management for AI agents deployed on Agentbot.',
    tags: ["OpenClaw","Agentbot"]
  },
  {
    slug: 'daily-2026-03-03',
    date: '3 March 2026',
    title: 'Enhancements in OpenClaw: Elevating Your Agentbot Experience',
    excerpt: 'Explore the latest improvements in the OpenClaw framework that enhance the functionality and user experience on the Agentbot platform.',
    tags: ["OpenClaw","Agentbot"]
  },
  {
    slug: 'v2026-3-2',
    date: '3 March 2026',
    title: 'OpenClaw v2026.3.2 + Agentbot Platform Update',
    excerpt: 'OpenClaw v2026.3.2 released with gateway stability fixes. Plus: Agentbot platform is almost live with 5 pricing plans.',
    tags: ["OpenClaw", "Release", "Platform"]
  },
  {
    slug: 'daily-2026-03-02',
    date: '2 March 2026',
    title: 'Daily OpenClaw Updates: Performance & Stability Improvements',
    excerpt: 'Latest improvements to OpenClaw including gateway stability enhancements and configuration fixes.',
    tags: ["OpenClaw","Updates"]
  },
  {
    slug: 'daily-2026-03-01',
    date: '1 March 2026',
    title: 'Exciting OpenClaw Updates: Improved Performance and Enhanced Usability',
    excerpt: 'The latest updates to the OpenClaw framework bring significant improvements that enhance the Agentbot user experience.',
    tags: ["OpenClaw","Platform Improvements"]
  },
  {
    slug: 'daily-2026-02-28',
    date: '28 February 2026',
    title: 'Unlocking New Features in Agentbot: Enhancements from OpenClaw',
    excerpt: 'Discover the latest updates in OpenClaw and how they enhance your experience with Agentbot.',
    tags: ["OpenClaw","Agentbot"]
  },
  {
    slug: 'daily-2026-02-27',
    date: '27 February 2026',
    title: 'Enhancing Agentbot with OpenClaw: New Features and Improvements',
    excerpt: 'Explore the latest updates in the OpenClaw framework and how they enhance your experience with Agentbot.',
    tags: ["Platform Improvements","OpenClaw Updates"]
  },
  {
    slug: 'daily-2026-02-26',
    date: '26 February 2026',
    title: 'Enhancing Agentbot with OpenClaw Updates: February 2026',
    excerpt: 'Explore the latest improvements in the OpenClaw framework that empower Agentbot users to create more efficient AI agents.',
    tags: ["OpenClaw","Platform Updates"]
  },
  {
    slug: 'daily-2026-02-25',
    date: '25 February 2026',
    title: 'Embracing New Heights: OpenClaw Framework Updates and Features',
    excerpt: 'Discover the latest enhancements in the OpenClaw framework that are set to elevate your AI agent deployment experience on Agentbot.',
    tags: ['OpenClaw', 'AI Deployment']
  },
  {
    slug: 'underground-agents-drop',
    date: '24 February 2026',
    title: 'Underground Agents Drop: Built by Ravers, for Ravers',
    excerpt: 'Introducing Rave Event Agent and Community Treasury Agent - crypto-native tools for underground collectives. USDC payments, transparent treasuries, no gatekeepers.',
    tags: ['Release', 'Underground']
  },
  {
    slug: 'kimi-drop',
    date: '24 February 2026',
    title: 'The Kimi Drop: How We Built Feature Parity in 18 Hours',
    excerpt: 'We analyzed Kimi Claw and shipped everything they have, plus agent swarms and visual workflows. Here\'s how we did it.',
    tags: ['Release', 'Engineering']
  },
  {
    slug: 'major-update-2026',
    date: '24 February 2026',
    title: 'Major Update: Agentbot Now Matches Kimi Claw',
    excerpt: 'Scheduled tasks, skill marketplace, agent swarms, and more. The biggest update in Agentbot history.',
    tags: ['Release', 'Major Update']
  },
  {
    slug: 'daily-2026-02-24',
    date: '24 February 2026',
    title: 'Automated Blog System Now Live',
    excerpt: 'We have just launched our automated blog system that publishes fresh content daily at 9am UK time.',
    tags: ['Platform', 'Automation']
  },
  {
    slug: 'platform-v2',
    date: 'February 2026',
    title: 'Platform V2: Faster Deployments & New AI Models',
    excerpt: 'Major performance improvements with 3x faster container startup times. Added support for GPT-4o, Claude 3.5 Sonnet, and Gemini 1.5 Pro.',
    tags: ['Release', 'Performance']
  },
  {
    slug: 'credit-pricing',
    date: 'February 2026',
    title: 'Introducing Credit-Based Pricing',
    excerpt: 'New flexible credit system lets you pay only for what you use. Buy credits upfront and use across any AI model with transparent pricing.',
    tags: ['Feature', 'Pricing']
  },
  {
    slug: 'first-agent',
    date: 'February 2026',
    title: 'How to Deploy Your First AI Agent in 60 Seconds',
    excerpt: 'Step-by-step guide to launching your OpenClaw agent with Telegram integration. No server setup required.',
    tags: ['Tutorial', 'Getting Started']
  },
  {
    slug: 'weekly-improvements',
    date: 'February 2026',
    title: 'Weekly Improvements: What is Shipping',
    excerpt: 'Dark mode UI refresh, Stripe checkout flow, OAuth with Google & GitHub, and Resend email integration for welcome emails.',
    tags: ['Update', 'Weekly']
  },
  {
    slug: 'resource-management',
    date: 'January 2026',
    title: 'Managing AI Agent Resources: Memory, CPU, and Scaling',
    excerpt: 'Understanding resource allocation and when to upgrade your plan for production workloads.',
    tags: ['Technical', 'Scaling']
  },
  {
    slug: 'best-practices',
    date: 'January 2026',
    title: 'Best Practices for Production AI Agents',
    excerpt: 'Security tips, monitoring strategies, and automation patterns for running agents at scale.',
    tags: ['Best Practices', 'Security']
  },
  {
    slug: 'webhooks',
    date: 'January 2026',
    title: 'API Webhooks and External Integrations',
    excerpt: 'Connect your AI agent to external systems using webhooks, APIs, and custom workflows.',
    tags: ['Tutorial', 'Integrations']
  },
  {
    slug: 'welcome-openclaw-users',
    date: 'February 2026',
    title: 'Welcome OpenClaw Users',
    excerpt: 'Agentbot is now the recommended hosting platform for OpenClaw. Migrate your agents in minutes.',
    tags: ["OpenClaw", "Migration"]
  },
  {
    slug: 'powerful-builders-in-the-cloud',
    date: 'February 2026',
    title: 'Powerful Builders in the Cloud',
    excerpt: 'Why we built Agentbot - a platform for powerful builders who want to deploy AI agents without server headaches.',
    tags: ["Philosophy", "Builders"]
  },
  {
    slug: 'agentbot-launch',
    date: 'February 2026',
    title: 'Agentbot Public Launch',
    excerpt: 'After months of development, Agentbot is finally here. Deploy OpenClaw agents in seconds.',
    tags: ["Launch", "Announcement"]
  },
  {
    slug: 'welcome',
    date: 'January 2026',
    title: 'Welcome to Agentbot',
    excerpt: 'We built this platform to remove server setup friction and help builders launch AI agents in under a minute.',
    tags: ['Announcement']
  }
];

const upcomingFeatures = [
  { status: 'In Progress', title: 'Custom Domains', desc: 'Deploy to your own .com' },
  { status: 'In Progress', title: 'Metrics Dashboard', desc: 'Real-time usage graphs' },
  { status: 'In Progress', title: 'REST API', desc: 'Programmatic control' },
  { status: 'Coming Soon', title: 'Vercel Workflows', desc: 'Lightweight agent workflows' },
  { status: 'Coming Soon', title: 'WhatsApp', desc: 'Deploy agents to WA' },
  { status: 'Coming Soon', title: 'Agent Builder', desc: 'Visual drag-drop UI' },
  { status: 'Coming Soon', title: 'Voice Mode', desc: 'Talk to your agent' },
  { status: 'Research', title: 'Neural Link', desc: 'Direct brain interface' },
  { status: 'Research', title: 'Time Travel', desc: 'Replay agent decisions' },
];

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-black text-white selection:bg-blue-500/30 font-mono">
      <div className="max-w-7xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="mb-16">
          <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Updates & Guides</p>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-none mb-4">Blog</h1>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-xl">
            Product updates, deployment tips, and guides for running OpenClaw agents in production.
          </p>
          <p className="text-[10px] uppercase tracking-widest text-zinc-600 mt-3">
            Fresh content published daily at 9am UK London time
          </p>
        </div>

        {/* Powered By - restyled to match */}
        <div className="border-t border-zinc-900 py-8 mb-12">
          <p className="text-[10px] font-bold text-zinc-600 tracking-widest uppercase mb-4">Powered By</p>
          <div className="flex flex-wrap gap-6 text-sm font-bold">
            <span className="text-zinc-400">OpenAI</span>
            <span className="text-zinc-700">/</span>
            <span className="text-zinc-400">Anthropic</span>
            <span className="text-zinc-700">/</span>
            <span className="text-zinc-400">Google</span>
            <span className="text-zinc-700">/</span>
            <span className="text-zinc-400">xAI</span>
            <span className="text-zinc-700">/</span>
            <span className="text-zinc-400">DeepSeek</span>
            <span className="text-zinc-700">/</span>
            <span className="text-zinc-400">Meta</span>
            <span className="text-zinc-700">/</span>
            <span className="text-zinc-400">OpenRouter</span>
          </div>
        </div>

        {/* Learn Agentbot */}
        <div className="border-t border-zinc-900 py-8 mb-12">
          <p className="text-[10px] font-bold text-zinc-600 tracking-widest uppercase mb-2">New</p>
          <Link href="/learn" className="group block">
            <h2 className="text-3xl font-bold tracking-tighter uppercase leading-none mb-2 group-hover:text-zinc-400 transition-colors">Learn Agentbot</h2>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-xl">
              User guides, advanced tutorials, and embedded OpenClaw docs — everything you need to master agent deployment.
            </p>
            <span className="text-zinc-400 hover:text-white text-xs uppercase tracking-widest mt-3 inline-block">
              Explore guides
            </span>
          </Link>
        </div>

        {/* Quick Links Grid */}
        <div className="grid gap-px md:grid-cols-2 mb-12 border-t border-zinc-900">
          <Link href="/learn" className="group border-b border-zinc-900 md:border-r py-6 pr-6">
            <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Guide</p>
            <h3 className="text-lg font-bold uppercase tracking-tighter mb-1 group-hover:text-zinc-400 transition-colors">User Guide</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">Getting started for the first time. Deploy your first agent in 60 seconds.</p>
          </Link>
          <Link href="/learn" className="group border-b border-zinc-900 py-6 md:pl-6">
            <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Advanced</p>
            <h3 className="text-lg font-bold uppercase tracking-tighter mb-1 group-hover:text-zinc-400 transition-colors">Advanced</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">Swarms, skills, workflows, and production deployment strategies.</p>
          </Link>
        </div>

        {/* OpenClaw News */}
        <div className="border-t border-zinc-900 py-8 mb-12">
          <p className="text-[10px] font-bold text-zinc-600 tracking-widest uppercase mb-2">Community</p>
          <Link href="/news" className="group block">
            <h2 className="text-3xl font-bold tracking-tighter uppercase leading-none mb-2 group-hover:text-zinc-400 transition-colors">OpenClaw News</h2>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-xl">
              Latest updates from Peter and the Claw community — fresh daily.
            </p>
            <span className="text-zinc-400 hover:text-white text-xs uppercase tracking-widest mt-3 inline-block">
              Read news
            </span>
          </Link>
        </div>

        {/* Blog Posts - List style */}
        <div>
          {blogPosts.map((post) => (
            <article key={post.title} className="border-t border-zinc-900 py-8 group">
              <div className="flex items-center gap-4 mb-3">
                <p className="text-[10px] uppercase tracking-widest text-zinc-600">{post.date}</p>
                <div className="flex gap-3">
                  {post.tags.map((tag) => (
                    <span key={tag} className="text-[10px] uppercase tracking-widest text-zinc-600">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <h2 className="text-xl font-bold tracking-tighter uppercase leading-tight mb-2 group-hover:text-zinc-400 transition-colors">{post.title}</h2>
              <p className="text-zinc-400 text-sm leading-relaxed mb-3 max-w-2xl">
                {post.excerpt}
              </p>
              <Link href={`/blog/posts/${post.slug}`} className="text-zinc-400 hover:text-white text-xs uppercase tracking-widest">
                Read more
              </Link>
            </article>
          ))}
        </div>

        {/* Upcoming Features */}
        <div className="mt-20 border-t border-zinc-900 pt-12">
          <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Roadmap</p>
          <h2 className="text-3xl font-bold tracking-tighter uppercase leading-none mb-8">Coming Soon</h2>
          <div className="grid gap-px md:grid-cols-2 lg:grid-cols-3">
            {upcomingFeatures.map((feature) => (
              <div key={feature.title} className="border-t border-zinc-900 py-6 pr-6">
                <span className={`text-[10px] uppercase tracking-widest font-bold ${
                  feature.status === 'Coming Soon' ? 'text-blue-500' :
                  feature.status === 'In Progress' ? 'text-zinc-400' :
                  'text-zinc-600'
                }`}>
                  {feature.status}
                </span>
                <h3 className="font-bold text-white mt-2 uppercase tracking-tighter">{feature.title}</h3>
                <p className="text-sm text-zinc-400 mt-1 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
