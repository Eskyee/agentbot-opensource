import Link from 'next/link';

const blogPosts = [
  {
    date: 'February 2026',
    title: 'How to Deploy Your First AI Agent in 60 Seconds',
    excerpt: 'Step-by-step guide to launching your OpenClaw agent with Telegram integration. No server setup required.',
    tags: ['Tutorial', 'Getting Started']
  },
  {
    date: 'February 2026',
    title: 'Managing AI Agent Resources: Memory, CPU, and Scaling',
    excerpt: 'Understanding resource allocation and when to upgrade your plan for production workloads.',
    tags: ['Technical', 'Scaling']
  },
  {
    date: 'February 2026',
    title: 'Best Practices for Production AI Agents',
    excerpt: 'Security tips, monitoring strategies, and automation patterns for running agents at scale.',
    tags: ['Best Practices', 'Security']
  },
  {
    date: 'February 2026',
    title: 'API Webhooks and External Integrations',
    excerpt: 'Connect your AI agent to external systems using webhooks, APIs, and custom workflows.',
    tags: ['Tutorial', 'Integrations']
  },
  {
    date: 'February 2026',
    title: 'Welcome to OpenClaw Deploy',
    excerpt: 'We built this platform to remove server setup friction and help builders launch AI agents in under a minute.',
    tags: ['Announcement']
  }
];

export default function BlogPage() {
  return (
    <main className="min-h-screen px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Blog</h1>
        <p className="text-gray-400 mb-10">
          Product updates, deployment tips, and guides for running OpenClaw agents in production.
        </p>

        <div className="space-y-4">
          {blogPosts.map((post) => (
            <article key={post.title} className="rounded-2xl border border-gray-800 bg-gray-900 p-6 hover:border-lobster-500/50 transition-colors">
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
              <Link href="/signup" className="text-lobster-400 hover:underline">
                Read more →
              </Link>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
