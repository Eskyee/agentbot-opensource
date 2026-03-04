import Link from 'next/link';

const blogPosts = [
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
  { status: 'Coming Soon', title: 'WhatsApp', desc: 'Deploy agents to WA' },
  { status: 'Coming Soon', title: 'Agent Builder', desc: 'Visual drag-drop UI' },
  { status: 'Coming Soon', title: 'Voice Mode', desc: 'Talk to your agent' },
  { status: 'Research', title: 'Neural Link', desc: 'Direct brain接口' },
  { status: 'Research', title: 'Time Travel', desc: 'Replay agent decisions' },
];

export default function BlogPage() {
  return (
    <main className="min-h-screen px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 p-6 rounded-2xl bg-gradient-to-r from-white/10 to-gray-500/10 border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-white text-black text-xs font-bold px-2 py-1 rounded">LAUNCH</span>
            <span className="text-xs text-gray-400">Coming Soon</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Agentbot Public Launch</h2>
          <p className="text-gray-300 mb-4">
            We're launching soon! Sign up now to get early access and lock in launch pricing.
          </p>
          <Link href="/signup" className="inline-block bg-white text-black font-semibold px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
            Get Early Access →
          </Link>
        </div>

        <h1 className="text-4xl font-bold tracking-tight mb-4">Blog</h1>
        <p className="text-gray-400 mb-2">
          Product updates, deployment tips, and guides for running OpenClaw agents in production.
        </p>
        <p className="text-sm text-gray-500 mb-10">
          Fresh content published daily at 9am UK London time
        </p>

        <div className="space-y-4">
          {blogPosts.map((post) => (
            <article key={post.title} className="rounded-2xl border border-gray-800 bg-gray-900 p-6 hover:border-white/50 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <p className="text-xs text-gray-500">{post.date}</p>
                <div className="flex gap-2">
                  {post.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <h2 className="text-2xl font-semibold mb-2">{post.title}</h2>
              <p className="text-gray-300 mb-4">
                {post.excerpt}
              </p>
              <Link href={`/blog/posts/${post.slug}`} className="text-white hover:underline">
                Read more →
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Coming Soon & In Progress</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingFeatures.map((feature) => (
              <div key={feature.title} className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    feature.status === 'Coming Soon' ? 'bg-blue-500/20 text-blue-400' :
                    feature.status === 'In Progress' ? 'bg-green-500/20 text-green-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {feature.status}
                  </span>
                </div>
                <h3 className="font-semibold text-white">{feature.title}</h3>
                <p className="text-sm text-gray-400 mt-1">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
