import Link from 'next/link';

export const metadata = {
  title: 'JSON Render — Generative UI for Agentbot',
  description: 'How we integrated json-render for AI-generated interfaces in Agentbot.',
};

export default function JsonRenderPost() {
  return (
    <main className="min-h-screen bg-black text-white">
      <article className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link href="/blog" className="text-xs text-zinc-500 hover:text-white transition-colors">
            ← Back to Blog
          </Link>
        </div>

        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs px-2 py-1 bg-orange-500/10 text-orange-500 rounded">Feature</span>
            <span className="text-xs text-zinc-500">June 16, 2026</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            JSON Render — Generative UI
          </h1>
          <p className="text-lg text-zinc-400">
            How we integrated json-render for AI-generated interfaces in Agentbot.
          </p>
        </header>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-bold mb-4">What is JSON Render?</h2>
            <p className="text-zinc-300 leading-relaxed">
              json-render is a framework for Generative UI — AI-generated interfaces that are safe, predictable, and render natively.
              You describe a UI in plain English, and AI generates a JSON spec that renders as real React components.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">How It Works</h2>
            <ol className="text-zinc-300 space-y-2 list-decimal list-inside">
              <li>Describe what you want: "Dashboard with 4 metric cards"</li>
              <li>AI generates a JSON spec with components and props</li>
              <li>The spec renders as real React components</li>
              <li>Edit the JSON or ask AI to iterate</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">Agentbot Integration</h2>
            <ul className="text-zinc-300 space-y-2 list-disc list-inside">
              <li>Playground at <code className="text-orange-500">/json-render-playground</code></li>
              <li>AI generation via OpenRouter</li>
              <li>Custom components: Metric, StatusBadge, CodeBlock</li>
              <li>Real-time preview as JSON changes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">Try It</h2>
            <Link
              href="/json-render-playground"
              className="inline-block bg-orange-500 text-black px-6 py-3 text-sm font-bold uppercase tracking-widest hover:bg-orange-400 transition-colors"
            >
              Open Playground
            </Link>
          </section>
        </div>
      </article>
    </main>
  );
}
