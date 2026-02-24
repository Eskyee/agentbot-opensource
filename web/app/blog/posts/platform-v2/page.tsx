import Link from 'next/link';

export default function PlatformV2Post() {
  return (
    <main className="min-h-screen px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-gray-400 hover:text-white mb-8 inline-block">
          ← Back to Blog
        </Link>
        
        <article className="prose prose-invert max-w-none">
          <div className="mb-8">
            <p className="text-sm text-gray-500 mb-2">February 2026</p>
            <h1 className="text-4xl font-bold mb-4">Platform V2: Faster Deployments & New AI Models</h1>
            <div className="flex gap-2">
              <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400">Release</span>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400">Performance</span>
            </div>
          </div>

          <p className="text-lg text-gray-300 mb-6">
            We've shipped major performance improvements and expanded AI model support. Here's what's new.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">3× Faster Container Startup</h2>
          <p className="text-gray-300 mb-4">
            Agent deployments now start in under 10 seconds, down from 30+ seconds. We optimized our container orchestration layer and implemented aggressive caching for base images.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">New AI Models</h2>
          <p className="text-gray-300 mb-4">
            You can now deploy agents with:
          </p>
          <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
            <li><strong>GPT-4o</strong> - OpenAI's latest multimodal model</li>
            <li><strong>Claude 3.5 Sonnet</strong> - Anthropic's most capable model</li>
            <li><strong>Gemini 1.5 Pro</strong> - Google's 1M token context window</li>
            <li><strong>Groq Llama 3</strong> - Ultra-fast inference</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">Improved Dashboard</h2>
          <p className="text-gray-300 mb-4">
            The dashboard now shows real-time CPU & memory usage, message counts, and uptime metrics. You can restart, stop, or update your agent with one click.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">What's Next</h2>
          <p className="text-gray-300 mb-4">
            We're working on custom domains, WhatsApp integration, and a visual agent builder. Stay tuned.
          </p>

          <div className="mt-12 p-6 rounded-xl bg-gray-900 border border-gray-800">
            <p className="text-gray-300 mb-4">Ready to deploy your agent?</p>
            <Link href="/signup" className="inline-block bg-white text-black px-6 py-2.5 rounded-lg font-medium hover:bg-gray-100 transition-colors">
              Get Started
            </Link>
          </div>
        </article>
      </div>
    </main>
  );
}
