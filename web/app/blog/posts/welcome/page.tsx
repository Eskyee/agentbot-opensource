import Link from 'next/link';

export default function WelcomePost() {
  return (
    <main className="min-h-screen px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-gray-400 hover:text-white mb-8 inline-block">
          ← Back to Blog
        </Link>
        
        <article className="prose prose-invert max-w-none">
          <div className="mb-8">
            <p className="text-sm text-gray-500 mb-2">January 2026</p>
            <h1 className="text-4xl font-bold mb-4">Welcome to Agentbot</h1>
            <div className="flex gap-2">
              <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400">Announcement</span>
            </div>
          </div>

          <p className="text-lg text-gray-300 mb-6">
            We built this platform to remove server setup friction and help builders launch AI agents in under a minute.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Why We Built This</h2>
          <p className="text-gray-300 mb-4">
            Deploying AI agents shouldn't require DevOps expertise. We wanted a platform where anyone could launch a production-ready agent with just a Telegram token and API key.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">What Makes Us Different</h2>
          <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
            <li>Deploy in under 60 seconds</li>
            <li>No server management required</li>
            <li>Automatic scaling & restarts</li>
            <li>Real-time monitoring dashboard</li>
            <li>Pay only for what you use</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">Built on OpenClaw</h2>
          <p className="text-gray-300 mb-4">
            We use OpenClaw as our agent framework. It's open source, extensible, and supports multiple AI models.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">What's Next</h2>
          <p className="text-gray-300 mb-4">
            We're shipping fast. Custom domains, WhatsApp integration, and a visual agent builder are coming soon.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Join Us</h2>
          <p className="text-gray-300 mb-4">
            We're building in public. Follow our progress on Twitter and join our Discord community.
          </p>

          <div className="mt-12 p-6 rounded-xl bg-gray-900 border border-gray-800">
            <p className="text-gray-300 mb-4">Ready to deploy your first agent?</p>
            <Link href="/signup" className="inline-block bg-white text-black px-6 py-2.5 rounded-lg font-medium hover:bg-gray-100 transition-colors">
              Get Started
            </Link>
          </div>
        </article>
      </div>
    </main>
  );
}
