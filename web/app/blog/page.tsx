import Link from 'next/link';

const blogPosts = [
  {
    date: 'February 2026',
    title: 'Platform V2: Faster Deployments & New AI Models',
    excerpt: 'Major performance improvements with 3x faster container startup times. Added support for GPT-4o, Claude 3.5 Sonnet, and Gemini 1.5 Pro.',
    tags: ['Release', 'Performance']
  },
  {
    date: 'February 2026',
    title: 'Introducing Credit-Based Pricing',
    excerpt: 'New flexible credit system lets you pay only for what you use. Buy credits upfront and use across any AI model with transparent pricing.',
    tags: ['Feature', 'Pricing']
  },
  {
    date: 'February 2026',
    title: 'How to Deploy Your First AI Agent in 60 Seconds',
    excerpt: 'Step-by-step guide to launching your OpenClaw agent with Telegram integration. No server setup required.',
    tags: ['Tutorial', 'Getting Started']
  },
  {
    date: 'February 2026',
    title: 'Weekly Improvements: What is Shipping',
    excerpt: 'Dark mode UI refresh, Stripe checkout flow, OAuth with Google & GitHub, and Resend email integration for welcome emails.',
    tags: ['Update', 'Weekly']
  },
  {
    date: 'January 2026',
    title: 'Managing AI Agent Resources: Memory, CPU, and Scaling',
    excerpt: 'Understanding resource allocation and when to upgrade your plan for production workloads.',
    tags: ['Technical', 'Scaling']
  },
  {
    date: 'January 2026',
    title: 'Best Practices for Production AI Agents',
    excerpt: 'Security tips, monitoring strategies, and automation patterns for running agents at scale.',
    tags: ['Best Practices', 'Security']
  },
  {
    date: 'January 2026',
    title: 'API Webhooks and External Integrations',
    excerpt: 'Connect your AI agent to external systems using webhooks, APIs, and custom workflows.',
    tags: ['Tutorial', 'Integrations']
  },
  {
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
        <p className="text-gray-400 mb-10">
          Product updates, deployment tips, and guides for running OpenClaw agents in production.
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
              <Link href="/signup" className="text-white hover:underline">
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
