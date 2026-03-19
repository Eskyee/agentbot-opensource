import Link from 'next/link';

export default function FirstAgentPost() {
  return (
    <main className="min-h-screen px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-gray-400 hover:text-white mb-8 inline-block">
          ← Back to Blog
        </Link>
        
        <article className="prose prose-invert max-w-none">
          <div className="mb-8">
            <p className="text-sm text-gray-500 mb-2">February 2026</p>
            <h1 className="text-4xl font-bold mb-4">How to Deploy Your First AI Agent in 60 Seconds</h1>
            <div className="flex gap-2">
              <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400">Tutorial</span>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400">Getting Started</span>
            </div>
          </div>

          <p className="text-lg text-gray-300 mb-6">
            Launch your OpenClaw agent with Telegram integration. No server setup required.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Step 1: Create a Telegram Bot</h2>
          <p className="text-gray-300 mb-4">
            Open Telegram and message <code className="bg-gray-800 px-2 py-1 rounded">@BotFather</code>. Send <code className="bg-gray-800 px-2 py-1 rounded">/newbot</code> and follow the prompts. Copy your API token.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Step 2: Choose Your AI Model</h2>
          <p className="text-gray-300 mb-4">
            Select from GPT-4o, Claude 3.5, Gemini 1.5 Pro, or Groq Llama 3. Each has different pricing and capabilities.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Step 3: Deploy</h2>
          <p className="text-gray-300 mb-4">
            Paste your Telegram token, add your AI API key, and click deploy. Your agent will be live in under 60 seconds.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">What You Get</h2>
          <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
            <li>Secure cloud hosting on Railway</li>
            <li>Automatic scaling & restarts</li>
            <li>Real-time monitoring dashboard</li>
            <li>Memory persistence across restarts</li>
          </ul>

          <div className="mt-12 p-6 rounded-xl bg-gray-900 border border-gray-800">
            <p className="text-gray-300 mb-4">Ready to deploy?</p>
            <Link href="/signup" className="inline-block bg-white text-black px-6 py-2.5 rounded-lg font-medium hover:bg-gray-100 transition-colors">
              Get Started
            </Link>
          </div>
        </article>
      </div>
    </main>
  );
}
